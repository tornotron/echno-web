/**
 * Session Revocation Store (Hybrid In-Memory + Redis)
 *
 * Provides session revocation with automatic Redis synchronization:
 * - Always uses in-memory for fast synchronous access (required for middleware)
 * - Syncs to Redis in background when REDIS_URL is configured
 * - Periodically pulls from Redis to catch revocations from other instances
 *
 * To enable distributed Redis (recommended for production):
 * 1. Install: pnpm add ioredis
 * 2. Set REDIS_URL=redis://your-redis-host:6379
 * 3. Restart server - Redis sync will start automatically
 */

import { logger } from '@/lib/logger';
import { SESSION_REVOCATION, msToSeconds } from './constants';

// Import constants for better maintainability
const { TTL_MS, CLEANUP_INTERVAL_MS, REDIS_SYNC_INTERVAL_MS } =
  SESSION_REVOCATION;

// In-memory store (always used for fast synchronous access)
const revokedSessionsWithTimestamp = new Map<string, number>();

// Redis client (lazy loaded, optional)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redis: any = null;
let redisAvailable = false;

/**
 * Initialize Redis connection in background
 */
async function initializeRedis(): Promise<void> {
  if (!process.env.REDIS_URL) {
    logger.debug('REDIS_URL not configured, using in-memory only');
    return;
  }

  try {
    const { default: Redis } = await import('ioredis');
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
      lazyConnect: true, // Don't block on connection
    });

    await redis.connect();
    await redis.ping();
    redisAvailable = true;

    logger.info('Redis connected for distributed session revocation');

    redis.on('error', (error: Error) => {
      logger.error('Redis connection error', error);
      redisAvailable = false;
    });

    redis.on('connect', () => {
      logger.debug('Redis reconnected');
      redisAvailable = true;
    });

    // Start periodic sync from Redis
    startRedisSyncInterval();
  } catch (error) {
    logger.warn('Failed to initialize Redis, using in-memory only', { error });
    redisAvailable = false;
  }
}

/**
 * Sync in-memory store from Redis (pull remote revocations)
 */
async function syncFromRedis(): Promise<void> {
  if (!redisAvailable || !redis) return;

  try {
    const keys = await redis.keys('session:revoked:*');
    for (const key of keys) {
      const sessionId = key.replace('session:revoked:', '');
      const timestamp = await redis.get(key);
      if (timestamp) {
        revokedSessionsWithTimestamp.set(
          sessionId,
          Number.parseInt(timestamp, 10)
        );
      }
    }
    logger.debug('Synced session revocations from Redis', {
      count: keys.length,
    });
  } catch (error) {
    logger.error('Failed to sync from Redis', error);
  }
}

/**
 * Push revocation to Redis in background (non-blocking)
 */
function pushToRedis(sessionId: string, timestamp: number): void {
  if (!redisAvailable || !redis) return;

  const key = `session:revoked:${sessionId}`;
  const ttlSeconds = msToSeconds(TTL_MS);

  redis.setex(key, ttlSeconds, timestamp.toString()).catch((error: Error) => {
    logger.error('Failed to push revocation to Redis', error);
  });
}

/**
 * Start periodic Redis sync
 */
function startRedisSyncInterval(): void {
  setInterval(() => {
    syncFromRedis().catch((error) => {
      logger.error('Redis sync interval error', error);
    });
  }, REDIS_SYNC_INTERVAL_MS);
}

/**
 * Revoke a session (synchronous, writes to both in-memory and Redis)
 */
export function revokeSession(sessionId: string): void {
  const now = Date.now();

  // Always write to in-memory first (synchronous, fast)
  revokedSessionsWithTimestamp.set(sessionId, now);

  // Push to Redis in background (non-blocking)
  pushToRedis(sessionId, now);

  logger.auth.sessionRevoked(sessionId);
  logger.debug('Session revocation details', {
    revokedAt: new Date(now).toISOString(),
    totalRevoked: revokedSessionsWithTimestamp.size,
    storage: redisAvailable ? 'in-memory+redis' : 'in-memory',
  });
}

/**
 * Check if a session is revoked
 */
export function isSessionRevoked(sessionId: string): boolean {
  const revokedAt = revokedSessionsWithTimestamp.get(sessionId);

  // Log check in development only
  if (revokedSessionsWithTimestamp.size > 0) {
    logger.debug('Session revocation check', {
      totalRevoked: revokedSessionsWithTimestamp.size,
    });
  }

  if (!revokedAt) {
    return false;
  }

  // Check if revocation has expired
  const age = Date.now() - revokedAt;
  if (age > TTL_MS) {
    revokedSessionsWithTimestamp.delete(sessionId);
    logger.debug('Session revocation expired');
    return false;
  }

  return true;
}

/**
 * Clean up expired revocations
 */
function cleanupExpiredRevocations(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [sessionId, revokedAt] of revokedSessionsWithTimestamp.entries()) {
    const age = now - revokedAt;
    if (age > TTL_MS) {
      revokedSessionsWithTimestamp.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} expired session revocations`);
  }
}

// Start cleanup interval and initialize Redis
if (typeof globalThis !== 'undefined') {
  setInterval(cleanupExpiredRevocations, CLEANUP_INTERVAL_MS);

  // Initialize Redis in background (non-blocking)
  // eslint-disable-next-line unicorn/prefer-top-level-await
  void initializeRedis().catch((error) => {
    logger.warn('Redis initialization failed', { error });
  });
}

/**
 * Get revoked session count (for monitoring)
 */
export function getRevokedSessionCount(): number {
  return revokedSessionsWithTimestamp.size;
}

/**
 * Clear all revocations (for testing)
 */
export function clearAllRevocations(): void {
  revokedSessionsWithTimestamp.clear();

  // Also clear Redis if available
  if (redisAvailable && redis) {
    redis
      .keys('session:revoked:*')
      .then((keys: string[]) => {
        if (keys.length > 0) {
          return redis.del(...keys);
        }
      })
      .catch((error: Error) => {
        logger.error('Failed to clear Redis revocations', error);
      });
  }

  logger.info('Cleared all session revocations');
}

/**
 * Get Redis status (for health checks)
 */
export function getRedisStatus(): {
  available: boolean;
  mode: 'in-memory' | 'in-memory+redis';
} {
  return {
    available: redisAvailable,
    mode: redisAvailable ? 'in-memory+redis' : 'in-memory',
  };
}
