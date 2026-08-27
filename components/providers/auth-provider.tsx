'use client';

import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { QueryProvider } from './query-provider';
import { OrgCacheGuard } from './org-cache-guard';
import { UserPrefetcher } from './user-prefetcher';
import { useOrganizationPrefetch } from '@/features/organization/hooks/use-organization-prefetch';
import { useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api/api-client';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { SESSION_ACTIVITY } from '@/lib/auth/constants';
import { isWithinRefreshBuffer } from '@/lib/auth/token-refresh-schedule';
import {
  clearLastActivity,
  minutesUntilIdleSignOut,
  readLastActivity,
  sessionIdleState,
  writeLastActivity,
} from '@/lib/auth/session-activity';
import { sessionRefresh } from '@/lib/auth/session-refresh-lock';

/** Events that count as the user being at the machine. */
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel',
] as const;

/** Identity of the idle warning, so it can be replaced and dismissed. */
const IDLE_WARNING_TOAST_ID = 'session-idle-warning';

/**
 * Keeps the session alive while the user is working and ends it when they stop.
 *
 * The design in one line: the session follows activity, not the clock.
 *
 * Three things went wrong on the way here and each one shapes the code below.
 *
 * The access token was refreshed by a `setTimeout` armed for the moment just
 * before expiry. That works only while the tab is in front. Backgrounded, the
 * browser throttles or suspends the timer, the moment passes unattended, and
 * the token is already dead by the time anyone looks. A repeating interval
 * cannot miss a deadline in the same way: it re-asks the question, and a tab
 * coming back simply gets the answer late rather than never.
 *
 * The refresh was then started from several places at once. NextAuth refetches
 * the session on its own when a tab becomes visible, which is exactly the
 * instant a queued request also discovers its token has lapsed. Both ran, both
 * posted the same single-use refresh token, and Keycloak revoked the chain as a
 * replay. Every refresh here goes through one coordinator, and NextAuth's own
 * refetch is turned off in `Providers` below and replaced by the visibility
 * handler in this component, so there is one way in.
 *
 * And when a session did end, it ended in silence: no toast, no redirect, just
 * a page where everything failed. Anything that ends a session here says so.
 *
 * Exported for its tests; the app mounts it through {@link Providers}.
 */
export function SessionMonitor({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();

  /** Set while this component is deliberately ending the session. */
  const isSigningOut = useRef(false);
  /** Whether this tab has ever held an authenticated session. */
  const wasAuthenticated = useRef(false);
  /**
   * Last activity known to this tab, before consulting the shared value.
   *
   * Seeded from the shared timestamp rather than from the clock, so a tab
   * opening into a session that has already been idle for a while inherits that
   * idle clock instead of quietly resetting it. Only real input counts as
   * activity here, which is the same rule the visibility handler follows.
   */
  const lastActivityRef = useRef<number>(0);
  /** When the shared timestamp was last written, to keep writes cheap. */
  const lastActivityWriteRef = useRef<number>(0);
  /** Whether the idle warning is currently on screen. */
  const isWarningShown = useRef(false);

  /**
   * The most recent activity across every tab on this profile.
   *
   * A tab sitting in the background is not evidence that its owner is idle:
   * they may be working in the tab next to it, on the same session.
   */
  const resolveLastActivity = useCallback((now: number) => {
    const shared = readLastActivity(lastActivityRef.current);
    if (shared > 0) return shared;

    // Nothing recorded anywhere yet, so this tab has only just opened. Start
    // its clock now rather than reading the absence as half an hour of idleness.
    lastActivityRef.current = now;
    return now;
  }, []);

  /** Records that the user is here, and drops any warning that says otherwise. */
  const recordActivity = useCallback((at: number = Date.now()) => {
    lastActivityRef.current = at;

    if (at - lastActivityWriteRef.current > SESSION_ACTIVITY.ACTIVITY_DEBOUNCE_MS) {
      lastActivityWriteRef.current = at;
      writeLastActivity(at);
    }

    if (isWarningShown.current) {
      isWarningShown.current = false;
      toast.dismiss(IDLE_WARNING_TOAST_ID);
    }
  }, []);

  /** Ends the session and tells the user why. */
  const endSession = useCallback(
    (message: string, description: string) => {
      if (isSigningOut.current) return;
      isSigningOut.current = true;

      toast.dismiss(IDLE_WARNING_TOAST_ID);
      isWarningShown.current = false;
      clearLastActivity();
      toast.error(message, { description });
      signOut({ callbackUrl: '/' });
    },
    []
  );

  // Track activity. The listeners are passive and the shared write is
  // debounced, so a mousemove costs a timestamp comparison.
  useEffect(() => {
    if (status !== 'authenticated') return;

    const handleActivity = () => recordActivity();
    for (const event of ACTIVITY_EVENTS) {
      globalThis.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        globalThis.removeEventListener(event, handleActivity);
      }
    };
  }, [status, recordActivity]);

  // Re-evaluate the session: on a timer, and whenever the tab comes back.
  //
  // Deliberately keyed on `session.expiresAt` rather than on the session
  // object, so the interval survives the identity change every refresh
  // produces and is rebuilt only when the token actually rotates.
  const expiresAt = session?.expiresAt;
  const provider = session?.provider;
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (provider !== 'keycloak') return;

    let disposed = false;

    const keepAlive = async () => {
      if (disposed) return;

      try {
        // One coordinator for every refresh in the app. The refresh token is
        // single-use, so a second exchange started alongside this one is read
        // as a replay and costs the user the whole session.
        await sessionRefresh.refreshExclusive(() => update());
        logger.debug('Session: access token refreshed');
      } catch (error) {
        // Left for the next tick. The server keeps the session intact when an
        // exchange does not complete, so trying again shortly is the right
        // answer and giving up is not.
        logger.warn('Session: refresh attempt did not complete', {
          reason: error instanceof Error ? error.message : 'unknown',
        });
      }
    };

    const evaluate = async () => {
      if (disposed || isSigningOut.current) return;

      const now = Date.now();
      const lastActivity = resolveLastActivity(now);
      const idleState = sessionIdleState(lastActivity, now);

      if (idleState === 'expired') {
        endSession(
          'Signed out after 30 minutes of inactivity',
          'Sign in again to pick up where you left off.'
        );
        return;
      }

      if (idleState === 'warning' && !isWarningShown.current) {
        isWarningShown.current = true;
        const minutes = minutesUntilIdleSignOut(lastActivity, now);
        toast.warning(
          `You will be signed out in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`,
          {
            id: IDLE_WARNING_TOAST_ID,
            duration: Number.POSITIVE_INFINITY,
            description:
              'You have been inactive. Move the mouse or press a key to stay signed in.',
            action: {
              label: 'Stay signed in',
              onClick: () => {
                recordActivity();
                void keepAlive();
              },
            },
          }
        );
      }

      // The user is still within the window, so keep the access token usable.
      // Refreshing an abandoned tab is what would defeat the idle timeout, so
      // this only runs on the near side of the deadline.
      if (isWithinRefreshBuffer(expiresAt, now)) {
        await keepAlive();
      }
    };

    const interval = setInterval(() => {
      void evaluate();
    }, SESSION_ACTIVITY.EVALUATION_INTERVAL_MS);

    // A tab that was hidden has had its timers throttled, so the first thing to
    // do on the way back is ask where the session stands. This replaces
    // NextAuth's own refetch-on-focus, which ran outside the coordinator and
    // was one half of the race that ended sessions.
    const handleVisible = () => {
      // Becoming visible is deliberately not treated as activity. Someone
      // returning after an hour would otherwise reset the idle clock and be
      // handed a session Keycloak had already discarded, which is the failure
      // this whole file exists to avoid. Real activity follows within moments
      // if they are actually there.
      if (document.visibilityState === 'visible') void evaluate();
    };

    document.addEventListener('visibilitychange', handleVisible);
    globalThis.addEventListener('focus', handleVisible);
    void evaluate();

    return () => {
      disposed = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisible);
      globalThis.removeEventListener('focus', handleVisible);
    };
  }, [
    status,
    provider,
    expiresAt,
    update,
    endSession,
    recordActivity,
    resolveLastActivity,
  ]);

  // Sync organization ID header with every session change
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.defaultOrganizationId) {
      apiClient.setDefaultHeader(
        'X-Organization-Id',
        String(session.user.defaultOrganizationId)
      );
    }
  }, [status, session?.user?.defaultOrganizationId]);

  // Remember that this tab was signed in, and let a recovered session clear the
  // guard so a later failure can be reported again.
  useEffect(() => {
    if (status !== 'authenticated') return;
    wasAuthenticated.current = true;
    if (!session?.error) isSigningOut.current = false;
  }, [status, session?.error]);

  // A session the server has marked as finished.
  useEffect(() => {
    if (status !== 'authenticated' || !session?.error) return;

    if (session.error === 'SessionRevoked') {
      endSession(
        'Your session was ended',
        'This account was signed out somewhere else. Please sign in again.'
      );
      return;
    }

    endSession(
      'Your session has ended',
      'We could not renew your sign-in. Please sign in again to continue.'
    );
  }, [status, session?.error, endSession]);

  // The session went away without this component ending it.
  //
  // This is the case that cost a user their work: the session vanished, the app
  // showed nothing, and every request failed silently behind a page that still
  // looked signed in. Whatever the cause, the user is told.
  useEffect(() => {
    if (status !== 'unauthenticated') return;
    if (!wasAuthenticated.current || isSigningOut.current) return;

    wasAuthenticated.current = false;
    logger.warn('Session: session ended unexpectedly, signing out');
    endSession(
      'Your session has ended',
      'Please sign in again to continue where you left off.'
    );
  }, [status, endSession]);

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
    // NextAuth refetches the session whenever a tab becomes visible, which
    // reaches the `jwt()` callback and can exchange the refresh token. That
    // path is invisible to the coordinator every other refresh goes through,
    // and it raced one, which is what revoked a user's session mid-form.
    // SessionMonitor owns the visibility handling instead, so the refreshes all
    // queue behind each other.
    <SessionProvider refetchOnWindowFocus={false}>
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
