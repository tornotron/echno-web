import { TOKEN_REFRESH } from './constants';

/**
 * Access token expiry helpers.
 *
 * Keycloak issues the access token with a short lifetime (5 minutes on our
 * realms) while the session itself lasts as long as the user keeps working.
 * The two clocks are tracked separately on the session: `expiresAt` is the
 * access token, and it is the only one that answers "is the bearer we are
 * about to send still good".
 *
 * These are questions asked about the present, not schedules for the future.
 * An earlier version armed a one-shot timer for the exact moment a refresh was
 * due, which a backgrounded tab never reaches: its timers are throttled or
 * suspended and the moment passes unattended. The session monitor now asks
 * these questions on a repeating interval and whenever a tab comes back, so a
 * missed tick is caught up rather than lost.
 *
 * Both helpers are pure and take `now` explicitly so they can be reasoned about
 * (and tested) without touching the clock.
 */

/**
 * Allowance for clock drift between this browser and Keycloak, in milliseconds.
 *
 * A token whose expiry is inside this window is treated as already dead: the
 * request would very likely land after expiry anyway, and a needless refresh is
 * far cheaper than an app-wide 401.
 */
const CLOCK_SKEW_ALLOWANCE_MS = 5 * 1000;

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

/**
 * Whether the access token is close enough to expiry to be worth renewing.
 *
 * The buffer is the same one the `jwt()` callback applies server-side, so a
 * client that decides to refresh and the callback that performs it agree about
 * whether there is anything to do. A caller inside the buffer gets a new token;
 * one that arrives just after somebody else refreshed finds a token that is
 * comfortably valid and does nothing, which is what makes a duplicate refresh
 * harmless rather than a replayed one.
 *
 * @param expiresAt - Access token expiry as an epoch timestamp in milliseconds,
 *   or undefined when the session carries no expiry.
 * @param now - Current time in milliseconds since the epoch.
 * @returns True when a refresh is due. False when there is no recorded expiry,
 *   since there is then nothing to schedule from.
 */
export function isWithinRefreshBuffer(
  expiresAt: number | undefined | null,
  now: number
): boolean {
  if (expiresAt === undefined || expiresAt === null) {
    return false;
  }

  return expiresAt - now <= TOKEN_REFRESH.REFRESH_BUFFER_MS;
}
