'use client';

import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { QueryProvider } from './query-provider';
import { OrgCacheGuard } from './org-cache-guard';
import { UserPrefetcher } from './user-prefetcher';
import { useOrganizationPrefetch } from '@/features/organization/hooks/use-organization-prefetch';
import { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/api-client';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { SESSION_WARNINGS } from '@/lib/auth/constants';
import {
  msUntilAccessTokenRefresh,
  withRefreshJitter,
} from '@/lib/auth/token-refresh-schedule';
import { sessionRefresh } from '@/lib/auth/session-refresh-lock';

// Warning thresholds (in minutes before expiration)
const { INITIAL_WARNING_MINUTES, FINAL_WARNING_MINUTES } = SESSION_WARNINGS;

// Activity detection configuration
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel',
] as const;

// Refresh session if user is active within this time before expiration (5 minutes)
const ACTIVITY_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
// Debounce activity detection to avoid excessive updates (30 seconds)
const ACTIVITY_DEBOUNCE_MS = 30 * 1000;

/**
 * Monitors session for token refresh errors and forces logout
 * Also tracks user activity to extend session when active
 */
function SessionMonitor({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const isLoggingOut = useRef(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [hasShownFinalWarning, setHasShownFinalWarning] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const lastActivityUpdateRef = useRef<number>(0);
  const isRefreshingRef = useRef(false);

  // Track user activity with debouncing
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    // Only update if enough time has passed since last update (debounce)
    if (now - lastActivityUpdateRef.current > ACTIVITY_DEBOUNCE_MS) {
      lastActivityRef.current = now;
      lastActivityUpdateRef.current = now;
    }
  }, []);

  // Set up activity event listeners
  useEffect(() => {
    if (status !== 'authenticated') return;

    // Add event listeners for activity detection
    for (const event of ACTIVITY_EVENTS) {
      globalThis.addEventListener(event, handleUserActivity, { passive: true });
    }

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        globalThis.removeEventListener(event, handleUserActivity);
      }
    };
  }, [status, handleUserActivity]);

  // Refresh session when user is active and session is about to expire
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;
    if (session.provider !== 'keycloak') return;

    const sessionExpiresAt = session.sessionExpiresAt;
    if (!sessionExpiresAt) return;

    const checkAndRefreshSession = async () => {
      const now = Date.now();
      const timeUntilExpiry = sessionExpiresAt - now;
      const timeSinceLastActivity = now - lastActivityRef.current;

      // If session is expiring soon and user was recently active, refresh
      if (
        timeUntilExpiry <= ACTIVITY_REFRESH_THRESHOLD_MS &&
        timeUntilExpiry > 0 &&
        timeSinceLastActivity < ACTIVITY_REFRESH_THRESHOLD_MS &&
        !isRefreshingRef.current
      ) {
        isRefreshingRef.current = true;
        logger.debug('Session: User is active, refreshing session...', {
          timeUntilExpiry: `${Math.floor(timeUntilExpiry / 60_000)} minutes`,
          timeSinceLastActivity: `${Math.floor(timeSinceLastActivity / 1000)} seconds`,
        });

        try {
          // Trigger session update which will refresh the token. It goes
          // through the same origin-wide lock as the scheduled refresh below:
          // isRefreshingRef only covers this provider, and two active tabs near
          // session expiry would otherwise exchange the same refresh token.
          await sessionRefresh.refreshExclusive(() => update());
          // Reset warning flags since session was extended
          setHasShownWarning(false);
          setHasShownFinalWarning(false);
          logger.info('Session: Session refreshed due to user activity');
        } catch (error) {
          logger.error('Session: Failed to refresh session', error);
        } finally {
          isRefreshingRef.current = false;
        }
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkAndRefreshSession, 30_000);
    checkAndRefreshSession(); // Check immediately

    return () => clearInterval(interval);
  }, [session, status, update]);

  // Refresh the access token before it expires
  //
  // Every XHR goes through the BFF proxy, which reads the access token straight
  // out of the session cookie and never runs the NextAuth `jwt()` callback,
  // the one place a refresh happens. A user sitting on a single page therefore
  // kept forwarding a token that had lapsed minutes ago, and every request 401d
  // until the page was reloaded. Arming a timer off the access token's own
  // expiry puts the refresh back on the right clock: `update()` calls
  // /api/auth/session, which runs `jwt()`, which refreshes and rewrites the
  // cookie. Re-arms on every session change, so exactly one timer is pending.
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;
    if (session.provider !== 'keycloak') return;

    const scheduled = msUntilAccessTokenRefresh(session.expiresAt, Date.now());
    if (scheduled === null) return;

    // Every tab holds the same cookie and so computes the same deadline. The
    // lock below is what makes that safe; the jitter only keeps them from all
    // waking into it in the same instant.
    const delay = withRefreshJitter(scheduled);

    const refreshAccessToken = async () => {
      // Refresh tokens are single-use on our realms (revokeRefreshToken with
      // refreshTokenMaxReuse 0), so two refreshes in flight with the same token
      // revoke the whole chain and log the user out. This shares the guard with
      // the activity-driven refresh above so only one can ever run.
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;

      try {
        // isRefreshingRef only coordinates this provider, so the refresh runs
        // under the origin-wide lock as well, or every open tab would post the
        // same refresh token at the same moment. A tab that takes the lock
        // second finds an expiresAt its peer already advanced, so `jwt()`
        // returns the token untouched instead of exchanging it again.
        await sessionRefresh.refreshExclusive(() => update());
        // The refresh extends the Keycloak session too, so let the expiry
        // warnings fire again against the new deadline.
        setHasShownWarning(false);
        setHasShownFinalWarning(false);
        logger.debug('Session: Access token refreshed ahead of expiry');
      } catch (error) {
        logger.error('Session: Failed to refresh access token', error);
      } finally {
        isRefreshingRef.current = false;
      }
    };

    const timeoutId = setTimeout(() => {
      void refreshAccessToken();
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [session, status, update]);

  // Sync organization ID header with every session change
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.defaultOrganizationId) {
      apiClient.setDefaultHeader(
        'X-Organization-Id',
        String(session.user.defaultOrganizationId)
      );
    }
  }, [status, session?.user?.defaultOrganizationId]);

  // Reset logout flag when session becomes authenticated again
  useEffect(() => {
    if (status === 'authenticated' && !session?.error) {
      isLoggingOut.current = false;
    }
  }, [status, session]);

  // Handle token refresh errors and session revocation
  useEffect(() => {
    if (status === 'authenticated' && session?.error && !isLoggingOut.current) {
      isLoggingOut.current = true;

      if (session.error === 'RefreshAccessTokenError') {
        logger.warn('Session: Token refresh failed, forcing logout');
        toast.error('Session expired. Please login again.');
      } else if (session.error === 'SessionRevoked') {
        logger.warn('Session: Session revoked, forcing logout');
        toast.error('Your session was terminated. Please login again.');
      }

      // Force logout and redirect to home page
      signOut({ callbackUrl: '/' });
    }
  }, [session, status]);

  // Monitor session expiration and show warnings
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;

    // Only for Keycloak sessions (credentials sessions are long-lived)
    if (session.provider !== 'keycloak') return;

    // Use sessionExpiresAt (Keycloak session timeout) instead of expiresAt (access token expiration)
    // sessionExpiresAt tracks when the refresh token expires (~30 minutes)
    // expiresAt tracks when the access token expires (~5 minutes); that one is
    // kept alive by the access token refresh effect above, not by this check
    const sessionExpiresAt = session.sessionExpiresAt;
    if (!sessionExpiresAt) return; // No session expiration time available

    const checkExpiration = () => {
      const now = Date.now();
      const timeUntilExpiry = sessionExpiresAt - now;
      const minutesRemaining = Math.floor(timeUntilExpiry / 60_000);

      // Session already expired - force logout
      if (timeUntilExpiry <= 0 && !isLoggingOut.current) {
        isLoggingOut.current = true;
        logger.warn('Session: Session expired, forcing logout');
        toast.error('Session expired. Please login again.');
        signOut({ callbackUrl: '/' });
        return;
      }

      // Final warning at configured threshold
      if (minutesRemaining <= FINAL_WARNING_MINUTES && !hasShownFinalWarning) {
        setHasShownFinalWarning(true);
        toast.warning(
          `Your session will expire in ${minutesRemaining} ${minutesRemaining === 1 ? 'minute' : 'minutes'}`,
          {
            description:
              'Keep using the app to stay logged in, or your session will expire.',
          }
        );
      }
      // Initial warning at configured threshold
      else if (
        minutesRemaining <= INITIAL_WARNING_MINUTES &&
        !hasShownWarning
      ) {
        setHasShownWarning(true);
        toast.info(`Your session will expire in ${minutesRemaining} minutes`, {
          description:
            'Your session will automatically extend while you are active.',
        });
      }
    };

    // Check every minute
    const interval = setInterval(checkExpiration, 60_000);
    checkExpiration(); // Check immediately

    return () => clearInterval(interval);
  }, [session, status, hasShownWarning, hasShownFinalWarning]);

  return <>{children}</>;
}

/**
 * Runs feature-level prefetch hooks that must execute inside
 * QueryProvider + SessionProvider context.
 */
function FeaturePrefetcher({ children }: { children: React.ReactNode }) {
  useOrganizationPrefetch();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionMonitor>
        <QueryProvider>
          <OrgCacheGuard>
            <UserPrefetcher>
              <FeaturePrefetcher>{children}</FeaturePrefetcher>
            </UserPrefetcher>
          </OrgCacheGuard>
        </QueryProvider>
      </SessionMonitor>
    </SessionProvider>
  );
}
