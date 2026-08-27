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
 * Session Warning Thresholds (in minutes before expiration)
 * Based on Keycloak SSO session timeout (typically 30 minutes)
 */
export const SESSION_WARNINGS = {
  /** Show initial warning this many minutes before session expires (after 20 min of inactivity) */
  INITIAL_WARNING_MINUTES: 10,

  /** Show final warning this many minutes before session expires (after 25 min of inactivity) */
  FINAL_WARNING_MINUTES: 5,
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
