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
 */
export const SESSION_WARNINGS = {
  /** Show initial warning this many minutes before session expires */
  INITIAL_WARNING_MINUTES: 5,

  /** Show final warning this many minutes before session expires */
  FINAL_WARNING_MINUTES: 1,
} as const;

/**
 * Token Refresh Constants
 */
export const TOKEN_REFRESH = {
  /** Clock tolerance for token validation in seconds (5 minutes) */
  CLOCK_TOLERANCE_SECONDS: 300,

  /** Maximum age for backchannel logout tokens in seconds (10 minutes) */
  BACKCHANNEL_MAX_AGE_SECONDS: 600,

  /** Future token tolerance in seconds (5 minutes) */
  FUTURE_TOKEN_TOLERANCE_SECONDS: 300,
} as const;

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
