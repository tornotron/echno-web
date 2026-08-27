import { SESSION_ACTIVITY } from './constants';

/**
 * When the user was last doing something, and what follows from it.
 *
 * The session is anchored to activity rather than to a fixed lifetime, so this
 * one timestamp decides everything: whether the access token is worth
 * refreshing, whether to warn, and whether to sign out. The helpers are pure
 * and take `now` explicitly so the deadlines can be tested without waiting.
 */

/** What the session should do at a given moment. */
export type SessionIdleState =
  /** Someone is working. Keep the session alive. */
  | 'active'
  /** Still recoverable, but the sign-out is close enough to say so. */
  | 'warning'
  /** Idle past the deadline. The session ends. */
  | 'expired';

/** What the shared entry holds: whose session it describes, and when. */
interface StoredActivity {
  sessionId: string;
  at: number;
}

/**
 * Reads the shared activity timestamp for a session.
 *
 * Scoped to the session id, because localStorage outlives the session that
 * wrote it. An entry left behind by a previous sign-in would otherwise be read
 * as half an hour of idleness by the next one, and sign a user out moments
 * after they signed in. An entry belonging to another session is ignored; one
 * belonging to this session came from a sibling tab and counts.
 *
 * Storage is unavailable in a few contexts (private windows, blocked site data)
 * and throws rather than returning nothing, so every access is guarded. A tab
 * that cannot read the shared value falls back to its own, which is the
 * behaviour of a single open tab and never less safe.
 *
 * @param sessionId - The session asking. Without one there is nothing to scope
 *   to, so only this tab's own view is used.
 * @param fallback - Used when nothing belonging to this session is stored.
 */
export function readLastActivity(
  sessionId: string | undefined,
  fallback: number
): number {
  if (!sessionId) return fallback;

  try {
    const raw = globalThis.localStorage?.getItem(SESSION_ACTIVITY.STORAGE_KEY);
    if (!raw) return fallback;

    const stored = JSON.parse(raw) as Partial<StoredActivity>;
    if (stored.sessionId !== sessionId) return fallback;
    if (typeof stored.at !== 'number' || !Number.isFinite(stored.at)) {
      return fallback;
    }

    // The larger of the two: this tab's own activity may not have been flushed
    // yet, and under-reporting it would sign a working user out.
    return Math.max(stored.at, fallback);
  } catch {
    return fallback;
  }
}

/**
 * Publishes the activity timestamp to every tab on this profile.
 *
 * @param sessionId - The session the activity belongs to.
 * @param at - Epoch milliseconds of the activity.
 */
export function writeLastActivity(
  sessionId: string | undefined,
  at: number
): void {
  if (!sessionId) return;

  try {
    globalThis.localStorage?.setItem(
      SESSION_ACTIVITY.STORAGE_KEY,
      JSON.stringify({ sessionId, at } satisfies StoredActivity)
    );
  } catch {
    // A tab that cannot write still tracks its own activity in memory, so it
    // holds its own session open. Only the sharing across tabs is lost.
  }
}

/**
 * Clears the shared timestamp, so the next session starts its own clock.
 *
 * Called on sign-out: leaving a stale timestamp behind would let the next
 * sign-in inherit an idle window that had already half elapsed.
 */
export function clearLastActivity(): void {
  try {
    globalThis.localStorage?.removeItem(SESSION_ACTIVITY.STORAGE_KEY);
  } catch {
    // Nothing to do: an unreadable store is also an unusable one.
  }
}

/**
 * How long the user has been idle.
 *
 * @param lastActivity - Epoch milliseconds of the most recent activity.
 * @param now - Current time in epoch milliseconds.
 */
export function idleFor(lastActivity: number, now: number): number {
  return Math.max(now - lastActivity, 0);
}

/**
 * Where the session stands.
 *
 * @param lastActivity - Epoch milliseconds of the most recent activity.
 * @param now - Current time in epoch milliseconds.
 */
export function sessionIdleState(
  lastActivity: number,
  now: number
): SessionIdleState {
  const idle = idleFor(lastActivity, now);

  if (idle >= SESSION_ACTIVITY.IDLE_SIGN_OUT_MS) {
    return 'expired';
  }

  if (
    idle >=
    SESSION_ACTIVITY.IDLE_SIGN_OUT_MS - SESSION_ACTIVITY.IDLE_WARNING_LEAD_MS
  ) {
    return 'warning';
  }

  return 'active';
}

/**
 * Whole minutes left before the idle sign-out, rounded up.
 *
 * Rounded up so the warning never reads "0 minutes" while there is still time
 * on the clock.
 *
 * @param lastActivity - Epoch milliseconds of the most recent activity.
 * @param now - Current time in epoch milliseconds.
 */
export function minutesUntilIdleSignOut(
  lastActivity: number,
  now: number
): number {
  const remaining =
    SESSION_ACTIVITY.IDLE_SIGN_OUT_MS - idleFor(lastActivity, now);
  return Math.max(Math.ceil(remaining / 60_000), 0);
}

/**
 * Whether the session is worth keeping alive right now.
 *
 * Refreshing an abandoned tab is what would quietly defeat the whole design:
 * the token would roll over every few minutes forever and the session would
 * never end, however long ago its owner walked away. Gating the refresh on
 * recent activity is what lets Keycloak's own idle timeout do its job.
 *
 * @param lastActivity - Epoch milliseconds of the most recent activity.
 * @param now - Current time in epoch milliseconds.
 */
export function shouldKeepSessionAlive(
  lastActivity: number,
  now: number
): boolean {
  return sessionIdleState(lastActivity, now) !== 'expired';
}
