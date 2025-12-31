/**
 * Rate Limiting Utility
 *
 * Provides in-memory rate limiting for authentication endpoints
 * Prevents brute force attacks and API abuse
 *
 * Features:
 * - Per-IP rate limiting
 * - Configurable time windows
 * - Automatic cleanup of expired entries
 * - Production-ready (use Redis for distributed systems)
 */

import { logger } from '@/lib/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// For production with multiple instances, use Redis
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval - remove expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxRequests: number;

  /** Time window in milliseconds */
  windowMs: number;

  /** Custom identifier (defaults to IP address) */
  identifier?: string;
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  /** Login attempts: 5 per 15 minutes */
  LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },

  /** Backchannel logout: 100 per minute */
  BACKCHANNEL: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },

  /** API routes: 60 per minute */
  API: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },

  /** Strict: 10 per hour */
  STRICT: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  },
} as const;

/**
 * Result of rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;

  /** Remaining requests in current window */
  remaining: number;

  /** Time until rate limit resets (milliseconds) */
  resetIn: number;

  /** Total requests in current window */
  current: number;

  /** Maximum requests allowed */
  limit: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 *
 * @example
 * ```ts
 * const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
 * const result = checkRateLimit(clientIp, RATE_LIMITS.LOGIN);
 *
 * if (!result.allowed) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     {
 *       status: 429,
 *       headers: {
 *         'Retry-After': String(Math.ceil(result.resetIn / 1000)),
 *       },
 *     }
 *   );
 * }
 * ```
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No previous requests or window expired
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
      current: 1,
      limit: config.maxRequests,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = entry.resetTime - now;

  // Log rate limit violations
  if (!allowed) {
    logger.warn('Rate limit exceeded', {
      identifier: identifier.slice(0, 20), // Partial IP for privacy
      current: entry.count,
      limit: config.maxRequests,
      resetIn,
    });
  }

  return {
    allowed,
    remaining,
    resetIn,
    current: entry.count,
    limit: config.maxRequests,
  };
}

/**
 * Reset rate limit for an identifier
 *
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status without incrementing
 *
 * @param identifier - Unique identifier to check
 * @param config - Rate limit configuration
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetIn: config.windowMs,
      current: 0,
      limit: config.maxRequests,
    };
  }

  const allowed = entry.count < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = entry.resetTime - now;

  return {
    allowed,
    remaining,
    resetIn,
    current: entry.count,
    limit: config.maxRequests,
  };
}

/**
 * Cleanup expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [identifier, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(identifier);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug('Cleaned up expired rate limit entries', { count: cleaned });
  }
}

/**
 * Get rate limit store statistics
 */
export function getRateLimitStats(): {
  totalEntries: number;
  activeEntries: number;
} {
  const now = Date.now();
  let active = 0;

  for (const entry of rateLimitStore.values()) {
    if (now <= entry.resetTime) {
      active++;
    }
  }

  return {
    totalEntries: rateLimitStore.size,
    activeEntries: active,
  };
}

// Start cleanup interval
if (typeof globalThis !== 'undefined') {
  setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);
}
