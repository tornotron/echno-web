'use client';

import { useCallback, useEffect, useRef } from 'react';
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
export const IDLE_WARNING_TOAST_ID = 'session-idle-warning';

/** The part of the session this hook reads. */
export interface LifecycleSession {
  provider?: string;
  sessionId?: string;
  expiresAt?: number;
  error?: string;
}

/** How the hook speaks to the user. */
export interface SessionNotifier {
  error(message: string, options: { description: string }): void;
  warning(
    message: string,
    options: {
      id: string;
      duration: number;
      description: string;
      action: { label: string; onClick: () => void };
    }
  ): void;
  dismiss(id: string): void;
}

export interface SessionLifecycleOptions {
  session: LifecycleSession | null | undefined;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  /** Runs the session round trip that refreshes the cookie. */
  update: () => Promise<unknown>;
  /** Ends the session. */
  signOut: (options: { callbackUrl: string }) => unknown;
  notify: SessionNotifier;
}

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
 * cannot miss a deadline the same way: it re-asks the question, so a tab coming
 * back gets the answer late rather than never.
 *
 * The refresh was then started from several places at once. NextAuth refetches
 * the session on its own when a tab becomes visible, which is exactly the
 * instant a queued request also discovers its token has lapsed. Both ran, both
 * posted the same single-use refresh token, and Keycloak revoked the chain as a
 * replay. Every refresh here goes through one coordinator, and NextAuth's own
 * refetch is turned off where the provider is mounted, so there is one way in.
 *
 * And when a session did end, it ended in silence: no toast, no redirect, just
 * a page where everything failed. Anything that ends a session here says so.
 *
 * `signOut` and `notify` are passed in rather than imported. Both reach outside
 * the component, and taking them as arguments is what lets the whole lifecycle
 * be exercised without replacing modules that other suites depend on.
 */
export function useSessionLifecycle({
  session,
  status,
  update,
  signOut,
  notify,
}: SessionLifecycleOptions): void {
  /** Set while this hook is deliberately ending the session. */
  const isSigningOut = useRef(false);
  /** Whether this tab has ever held an authenticated session. */
  const wasAuthenticated = useRef(false);
  /** Last activity known to this tab, before consulting the shared value. */
  const lastActivityRef = useRef<number>(0);
  /** When the shared timestamp was last written, to keep writes cheap. */
  const lastActivityWriteRef = useRef<number>(0);
  /** Whether the idle warning is currently on screen. */
  const isWarningShown = useRef(false);

  /**
   * Which session the activity clock belongs to.
   *
   * localStorage outlives a session, so a timestamp has to say whose it is or
   * the next sign-in inherits the previous one's idleness.
   */
  const sessionId = session?.sessionId;
  const expiresAt = session?.expiresAt;
  const provider = session?.provider;
  const sessionError = session?.error;

  /**
   * The most recent activity across every tab on this profile.
   *
   * A tab sitting in the background is not evidence that its owner is idle:
   * they may be working in the tab next to it, on the same session.
   */
  const resolveLastActivity = useCallback(
    (now: number) => {
      if (lastActivityRef.current === 0) {
        // Nothing recorded yet in this tab. A sibling tab on the same session
        // may already have a clock running, and this tab inherits it rather
        // than restarting it. Seeded against zero, not against the current
        // time, or the clock it is meant to inherit would always lose.
        const shared = readLastActivity(sessionId, 0);
        // No sibling either: this tab has just opened, so its clock starts now
        // rather than reading the absence as half an hour of idleness.
        lastActivityRef.current = shared > 0 ? shared : now;
      }

      return readLastActivity(sessionId, lastActivityRef.current);
    },
    [sessionId]
  );

  /** Records that the user is here, and drops any warning that says otherwise. */
  const recordActivity = useCallback(
    (at: number = Date.now()) => {
      lastActivityRef.current = at;

      if (
        at - lastActivityWriteRef.current >
        SESSION_ACTIVITY.ACTIVITY_DEBOUNCE_MS
      ) {
        lastActivityWriteRef.current = at;
        writeLastActivity(sessionId, at);
      }

      if (isWarningShown.current) {
        isWarningShown.current = false;
        notify.dismiss(IDLE_WARNING_TOAST_ID);
      }
    },
    [sessionId, notify]
  );

  /** Ends the session and tells the user why. */
  const endSession = useCallback(
    (message: string, description: string) => {
      if (isSigningOut.current) return;
      isSigningOut.current = true;

      notify.dismiss(IDLE_WARNING_TOAST_ID);
      isWarningShown.current = false;
      clearLastActivity();
      notify.error(message, { description });
      signOut({ callbackUrl: '/' });
    },
    [notify, signOut]
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
  // Deliberately keyed on `expiresAt` rather than on the session object, so the
  // interval survives the identity change every refresh produces and is rebuilt
  // only when the token actually rotates.
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
        notify.warning(
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
      // this hook exists to avoid. Real activity follows within moments if they
      // are actually there.
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
    notify,
    recordActivity,
    resolveLastActivity,
  ]);

  // Remember that this tab was signed in, and let a recovered session clear the
  // guard so a later failure can be reported again.
  useEffect(() => {
    if (status !== 'authenticated') return;
    wasAuthenticated.current = true;
    if (!sessionError) isSigningOut.current = false;
  }, [status, sessionError]);

  // A session the server has marked as finished.
  useEffect(() => {
    if (status !== 'authenticated' || !sessionError) return;

    if (sessionError === 'SessionRevoked') {
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
  }, [status, sessionError, endSession]);

  // The session went away without this hook ending it.
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
}
