'use client';

import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { QueryProvider } from './query-provider';
import { useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { SESSION_WARNINGS } from '@/lib/auth/constants';

// Warning thresholds (in minutes before expiration)
const { INITIAL_WARNING_MINUTES, FINAL_WARNING_MINUTES } = SESSION_WARNINGS;

/**
 * Monitors session for token refresh errors and forces logout
 */
function SessionMonitor({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isLoggingOut = useRef(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [hasShownFinalWarning, setHasShownFinalWarning] = useState(false);

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
    // expiresAt tracks when the access token expires (~5 minutes, auto-refreshed)
    const sessionExpiresAt = session.sessionExpiresAt;
    if (!sessionExpiresAt) return; // No session expiration time available

    const checkExpiration = () => {
      const now = Date.now();
      const timeUntilExpiry = sessionExpiresAt - now;
      const minutesRemaining = Math.floor(timeUntilExpiry / 60_000);

      // Session already expired
      if (timeUntilExpiry <= 0) {
        return;
      }

      // Final warning at configured threshold
      if (minutesRemaining <= FINAL_WARNING_MINUTES && !hasShownFinalWarning) {
        setHasShownFinalWarning(true);
        toast.warning(
          `Your session will expire in ${minutesRemaining} ${minutesRemaining === 1 ? 'minute' : 'minutes'}`,
          {
            description:
              'Any page navigation will refresh your session automatically.',
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
          description: 'Navigate to any page to keep your session active.',
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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionMonitor>
        <QueryProvider>{children}</QueryProvider>
      </SessionMonitor>
    </SessionProvider>
  );
}
