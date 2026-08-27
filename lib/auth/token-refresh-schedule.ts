import { TOKEN_REFRESH } from './constants';

/**
 * Access token scheduling helpers.
 *
 * Keycloak issues the access token with a short lifetime (5 minutes on our
 * realms) while the SSO session itself lives for half an hour or more. The two
 * clocks are tracked separately on the session: `expiresAt` is the access
 * token, `sessionExpiresAt` is the SSO session. Anything that reasons about
 * "is the bearer we are about to send still good" must use the first one.
 *
 * Both helpers here are pure and take `now` explicitly so they can be reasoned
 * about (and tested) without touching the clock.
 */

/**
 * Floor for a scheduled refresh, in milliseconds.
 *
 * A token that is already inside its refresh buffer would otherwise schedule a
 * refresh in the past, and a session that keeps coming back with the same
 * expiry would then re-arm the timer as fast as React can re-render. Five
 * seconds is short enough to recover a stale token promptly and long enough
 * that a pathological session cannot turn the timer into a spin loop.
 */
export const MIN_REFRESH_DELAY_MS = 5 * 1000;

/**
 * Allowance for clock drift between this browser and Keycloak, in milliseconds.
 *
 * A token whose expiry is inside this window is treated as already dead: the
 * request would very likely land after expiry anyway, and a needless refresh is
 * far cheaper than an app-wide 401.
 */
const CLOCK_SKEW_ALLOWANCE_MS = 5 * 1000;

/**
 * Milliseconds to wait before proactively refreshing the access token.
 *
 * The refresh is scheduled one {@link TOKEN_REFRESH.REFRESH_BUFFER_MS} ahead of
 * expiry, so the new token is in the cookie before the old one lapses, and is
 * floored at {@link MIN_REFRESH_DELAY_MS}.
 *
 * @param expiresAt - Access token expiry as an epoch timestamp in milliseconds,
 *   or undefined when the session carries no expiry.
 * @param now - Current time in milliseconds since the epoch.
 * @returns The delay to arm a timer with, or `null` when there is no expiry to
 *   schedule from.
 */
export function msUntilAccessTokenRefresh(
  expiresAt: number | undefined | null,
  now: number
): number | null {
  if (expiresAt === undefined || expiresAt === null) {
    return null;
  }

  const delay = expiresAt - TOKEN_REFRESH.REFRESH_BUFFER_MS - now;
  return Math.max(delay, MIN_REFRESH_DELAY_MS);
}

/**
 * Widest jitter added to a scheduled refresh, in milliseconds.
 *
 * Small next to the 60 second refresh buffer, so a jittered timer still fires
 * comfortably before the token lapses.
 */
export const MAX_REFRESH_JITTER_MS = 5 * 1000;

/**
 * Spreads scheduled refreshes out by up to {@link MAX_REFRESH_JITTER_MS}.
 *
 * Every tab on the origin shares one session cookie and therefore one refresh
 * deadline, so without jitter they all wake in the same instant and pile onto
 * the cross-tab lock together. This is defence in depth and not the fix: the
 * lock in `session-refresh-lock.ts` is what makes concurrent tabs safe, and
 * jitter only thins the crowd arriving at it.
 *
 * A delay already at {@link MIN_REFRESH_DELAY_MS} is left alone, since that
 * floor means the token is at or past expiry and recovery should not be
 * postponed any further.
 *
 * @param delay - Scheduled delay in milliseconds.
 * @param random - Source of randomness in the range [0, 1). Injectable so the
 *   spread can be tested without depending on `Math.random`.
 * @returns The delay, with jitter added when there is room for it.
 */
export function withRefreshJitter(
  delay: number,
  random: () => number = Math.random
): number {
  if (delay <= MIN_REFRESH_DELAY_MS) {
    return delay;
  }

  return delay + Math.floor(random() * MAX_REFRESH_JITTER_MS);
}

/**
 * Whether the access token is expired, or close enough to expiry that it should
 * be treated as expired.
 *
 * @param expiresAt - Access token expiry as an epoch timestamp in milliseconds,
 *   or undefined when the session carries no expiry.
 * @param now - Current time in milliseconds since the epoch.
 * @returns True when the token is spent. False when there is no recorded
 *   expiry, which leaves the judgement to the backend rather than rejecting a
 *   request we cannot reason about.
 */
export function isAccessTokenExpired(
  expiresAt: number | undefined | null,
  now: number
): boolean {
  if (expiresAt === undefined || expiresAt === null) {
    return false;
  }

  return expiresAt - now <= CLOCK_SKEW_ALLOWANCE_MS;
}
