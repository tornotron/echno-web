import { SESSION_ACTIVITY } from './constants';

/**
 * The idle deadline, as the server keeps it.
 *
 * The client already measures inactivity: `hooks/use-session-lifecycle.ts`
 * watches for input, keeps the timestamp in `localStorage` so sibling tabs
 * share one clock, warns, and signs out. That is the part the user sees, and it
 * stays exactly as it is.
 *
 * What it cannot be is the thing the server trusts. The timestamp lives in
 * browser storage and is read by React, so it exists only for as long as our
 * own client is the one holding the session. A cookie replayed by anything else
 * skips all of it, and both server paths would happily keep that session alive:
 * `jwt()` refreshes the access token on request, and the BFF forwards the
 * bearer without ever running `jwt()` at all. Keycloak's `ssoSessionIdleTimeout`
 * is real enforcement but resets on every refresh, so it bounds a session that
 * goes quiet and not one that keeps being used.
 *
 * So the deadline is recorded on the NextAuth JWT, which is encrypted and
 * signed server-side and cannot be edited by whoever holds it. The client says
 * "someone is here" by sending a session update; the server decides what time
 * it is when that arrives. A caller that never sends one never advances the
 * clock, whatever else it does with the cookie.
 *
 * The honest limit, worth stating plainly: this bounds a session replayed by
 * something that is not our client. It does not bound an attacker driving a
 * real browser, because such an attacker can send the same update a user would.
 * No idle timeout can, and this one does not pretend to.
 *
 * Every function here is pure and takes `now` explicitly, so the deadlines can
 * be reasoned about without waiting for them.
 */

/** What a session update carries when the client is asserting the user is present. */
export interface SessionActivityUpdate {
  activity: true;
}

/**
 * The payload to send with a session update that should advance the clock.
 *
 * Deliberately carries no timestamp. A time supplied by the caller would be as
 * unverifiable as the `localStorage` value this replaces, so the only thing
 * crossing the wire is the assertion, and the server stamps its own clock.
 */
export const SESSION_ACTIVITY_UPDATE: SessionActivityUpdate = { activity: true };

/**
 * Whether a session-update payload is the client asserting the user is present.
 *
 * A plain `update()` with no payload refreshes the access token and nothing
 * more. That distinction is the point: the keep-alive runs on a timer and would
 * otherwise hold the clock open on a tab nobody is sitting at, which is the
 * behaviour this whole mechanism exists to stop.
 *
 * @param payload - The `session` argument NextAuth hands the `jwt()` callback
 *   on an update trigger. Untrusted, so it is checked rather than cast.
 */
export function isActivityAssertion(payload: unknown): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { activity?: unknown }).activity === true
  );
}

/**
 * Reads the recorded activity timestamp off a token.
 *
 * @param lastActivityAt - The token field, which is whatever was in the cookie
 *   and so is typed as unknown.
 * @returns The timestamp, or null when the token carries no usable one.
 */
function readLastActivityAt(lastActivityAt: unknown): number | null {
  if (typeof lastActivityAt !== 'number' || !Number.isFinite(lastActivityAt)) {
    return null;
  }
  return lastActivityAt;
}

/**
 * Records that the user is present, using the server's own clock.
 *
 * @param token - The NextAuth JWT, mutated in place the way the rest of the
 *   `jwt()` callback works.
 * @param now - Current time in epoch milliseconds.
 */
export function recordSessionActivity(
  token: { lastActivityAt?: unknown },
  now: number
): void {
  token.lastActivityAt = now;
}

/**
 * Whether the session has been idle past the point where it should end.
 *
 * This is the same {@link SESSION_ACTIVITY.IDLE_SIGN_OUT_MS} the client uses,
 * and it is checked in `jwt()`, which is the only path that mints a fresh
 * access token. Once it bites, nothing rotates: the access token in the cookie
 * dies within its own few minutes and Keycloak stops having its idle timer
 * reset, so the session ends on both clocks.
 *
 * There is no tolerance here, and none is needed. The update that carries the
 * activity assertion is handled by the same `jwt()` call that then asks this
 * question, so an active client's own round trip can never be refused by it.
 *
 * @param lastActivityAt - The token's recorded activity timestamp.
 * @param now - Current time in epoch milliseconds.
 * @returns True when the session has run out. False when the token carries no
 *   recorded activity at all, which is how sessions minted before this existed
 *   keep working until their first update fills the field in.
 */
export function isIdlePastDeadline(lastActivityAt: unknown, now: number): boolean {
  const at = readLastActivityAt(lastActivityAt);
  if (at === null) return false;

  return now - at >= SESSION_ACTIVITY.IDLE_SIGN_OUT_MS;
}

/**
 * Whether the session is idle past the deadline the BFF proxy holds it to.
 *
 * The proxy is the awkward one, and it is the reason
 * {@link SESSION_ACTIVITY.PROXY_IDLE_GRACE_MS} exists. It reads the timestamp
 * out of the cookie without running `jwt()`, so it sees whatever the last
 * session update left there and nothing newer. For a user who is working right
 * now that value is already up to one
 * {@link SESSION_ACTIVITY.SERVER_SYNC_INTERVAL_MS} old by construction, and
 * older still if a sync did not land and had to be retried on a later tick.
 * Comparing that stale value against the real deadline would refuse requests
 * from someone sitting at the keyboard, which is a far worse outcome than an
 * idle window that runs slightly long.
 *
 * The grace is affordable because the proxy is not what enforces the deadline.
 * By the time it would matter, `jwt()` has been refusing to refresh for the
 * whole length of the grace, so the access token in that cookie expired within
 * minutes of the real deadline and the proxy has been rejecting it on expiry
 * ever since. This check only closes the case of a caller that touches
 * `/api/v1` and nothing else, and never gets to be the binding constraint on a
 * real session.
 *
 * @param lastActivityAt - The token's recorded activity timestamp.
 * @param now - Current time in epoch milliseconds.
 * @returns True when even the generous deadline has passed. False when the
 *   token carries no recorded activity.
 */
export function isIdlePastProxyGrace(
  lastActivityAt: unknown,
  now: number
): boolean {
  const at = readLastActivityAt(lastActivityAt);
  if (at === null) return false;

  return (
    now - at >=
    SESSION_ACTIVITY.IDLE_SIGN_OUT_MS + SESSION_ACTIVITY.PROXY_IDLE_GRACE_MS
  );
}

/**
 * Whether the client should push its activity clock to the server now.
 *
 * Two conditions, and both matter. There has to be activity the server has not
 * been told about, or an abandoned tab would keep renewing its own deadline on
 * a timer. And enough time has to have passed since the last push, or a user
 * moving the mouse would send a round trip every evaluation tick.
 *
 * @param lastActivity - Most recent activity this client knows about, in epoch
 *   milliseconds.
 * @param lastSyncedActivity - The activity value last pushed to the server.
 * @param lastSyncedAt - When that push was made.
 * @param now - Current time in epoch milliseconds.
 */
export function isActivitySyncDue(
  lastActivity: number,
  lastSyncedActivity: number,
  lastSyncedAt: number,
  now: number
): boolean {
  if (lastActivity <= lastSyncedActivity) return false;

  return now - lastSyncedAt >= SESSION_ACTIVITY.SERVER_SYNC_INTERVAL_MS;
}
