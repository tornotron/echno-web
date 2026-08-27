/**
 * Authentication System Constants
 *
 * Centralized configuration for authentication timing, intervals, and thresholds
 */

/**
 * Session Revocation Constants
 */
export const SESSION_REVOCATION = {
  /** Time-to-live for revoked sessions in milliseconds (24 hours) */
  TTL_MS: 24 * 60 * 60 * 1000,

  /** Interval for cleaning up expired revocations in milliseconds (1 hour) */
  CLEANUP_INTERVAL_MS: 60 * 60 * 1000,

  /** Interval for syncing with Redis in milliseconds (30 seconds) */
  REDIS_SYNC_INTERVAL_MS: 30 * 1000,
} as const;

/**
 * Session lifetime, measured from the user's last activity.
 *
 * The session is kept alive for as long as someone is working and ends when
 * they stop, rather than on a fixed clock from sign-in. Nothing here is keyed
 * to the access token: that rotates every few minutes and is an implementation
 * detail the user should never feel.
 *
 * Two clocks have to agree. Keycloak ends the SSO session after
 * {@link SESSION_ACTIVITY.KEYCLOAK_IDLE_TIMEOUT_MS} without a refresh, and the
 * app stops refreshing once the user has been idle that long, so the two run
 * out together. The app signs out slightly first, so the ending is one the app
 * performs and can explain rather than one it discovers from a 401.
 */
export const SESSION_ACTIVITY = {
  /**
   * The realm's `ssoSessionIdleTimeout` (30 minutes).
   *
   * Recorded here so the client deadline below can be read against it. Change
   * this only alongside the realm.
   */
  KEYCLOAK_IDLE_TIMEOUT_MS: 30 * 60 * 1000,

  /**
   * Idle time after which the app signs the user out.
   *
   * A minute inside the realm's own timeout, so the app always gets there
   * first. Losing that race is what turns a clean, explained sign-out into a
   * page where every request suddenly fails.
   */
  IDLE_SIGN_OUT_MS: 29 * 60 * 1000,

  /**
   * How long before the idle sign-out the warning appears.
   *
   * One warning, not a series. Anything much earlier fires while the user is
   * still away from the keyboard and goes unread, and a warning nobody is
   * present to see is not a warning. Two minutes is close enough that someone
   * at the machine will see it and far enough that they can act on it. This is
   * the number to change if it proves too tight in practice.
   */
  IDLE_WARNING_LEAD_MS: 2 * 60 * 1000,

  /**
   * How often the session is re-evaluated.
   *
   * An interval rather than a timer armed for a single moment: a hidden tab has
   * its timers throttled or suspended outright, and a repeating interval simply
   * misses ticks and catches up, where a one-shot timeout set for a wall-clock
   * deadline never fires at all.
   */
  EVALUATION_INTERVAL_MS: 30 * 1000,

  /** Smallest gap between two recordings of user activity. */
  ACTIVITY_DEBOUNCE_MS: 10 * 1000,

  /**
   * How often an active client pushes its activity clock to the session token.
   *
   * The browser's own timestamp is not something the server can verify, so the
   * deadline is kept on the encrypted JWT and advanced by a session update. The
   * cadence is owned here rather than inherited from the access token lifetime,
   * which is realm configuration and can change without anyone touching this
   * repo. Every number below that depends on how stale the token's copy can be
   * is derived from this one.
   *
   * Five minutes costs one extra round trip per active user per five minutes,
   * and most of those coincide with a token refresh that was happening anyway.
   */
  SERVER_SYNC_INTERVAL_MS: 5 * 60 * 1000,

  /**
   * Extra idle time the BFF proxy allows on top of {@link IDLE_SIGN_OUT_MS}.
   *
   * The proxy never runs the `jwt()` callback, so it reads whatever the last
   * session update wrote and nothing newer. For someone working right now that
   * is one {@link SERVER_SYNC_INTERVAL_MS} stale by construction, and staler if
   * a sync failed and was retried a tick or two later. Two intervals covers
   * both: one for the staleness that is there by design, one for a push that
   * did not land the first time.
   *
   * Erring generous here is deliberate. Refusing a request from someone at the
   * keyboard is a worse failure than an idle window that runs ten minutes long,
   * and the proxy is not what enforces the deadline anyway: see
   * `isIdlePastProxyGrace` in `session-idle.ts` for why this is a backstop and
   * never the binding constraint.
   */
  PROXY_IDLE_GRACE_MS: 10 * 60 * 1000,

  /**
   * Where the last activity timestamp is shared.
   *
   * Every tab on the profile shares one session, so activity in any of them
   * counts for all of them. Without this a tab left open in the background
   * would judge the user idle while they work in the tab next to it.
   */
  STORAGE_KEY: 'echno:last-activity',
} as const;

/**
 * Token Refresh Constants
 */
export const TOKEN_REFRESH = {
  /** Clock tolerance for token validation in seconds (5 minutes) */
  CLOCK_TOLERANCE_SECONDS: 300,

  /** Maximum age for frontchannel logout requests in seconds (10 minutes) */
  FRONTCHANNEL_MAX_AGE_SECONDS: 600,

  /** Future token tolerance in seconds (5 minutes) */
  FUTURE_TOKEN_TOLERANCE_SECONDS: 300,

  /** Buffer before token expiry to trigger refresh in milliseconds (60 seconds) */
  REFRESH_BUFFER_MS: 60 * 1000,

  /** Timeout for fetching the user profile during login (5 seconds) */
  USER_PROFILE_FETCH_TIMEOUT_MS: 5 * 1000,
} as const;

/**
 * Error code the BFF proxy returns when the session cookie still holds an
 * access token that has expired.
 *
 * It is deliberately machine-readable: the API client keys its one-shot session
 * refresh off this exact value, so the string is part of the contract between
 * `app/api/v1/[...path]/route.ts` and `lib/api/api-client.ts`.
 */
export const SESSION_TOKEN_EXPIRED_ERROR = 'SessionTokenExpired';

/**
 * NextAuth Secret Validation
 */
export const NEXTAUTH = {
  /** Minimum recommended secret length */
  MIN_SECRET_LENGTH: 32,
} as const;

/**
 * Helper function to convert milliseconds to seconds
 */
export function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

/**
 * Helper function to convert seconds to milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}

/**
 * Helper function to convert minutes to milliseconds
 */
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}
