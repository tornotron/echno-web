/**
 * Session Revocation Store
 *
 * Simple in-memory store for revoked sessions.
 * In production, use Redis or a database for persistence across instances.
 */

// Cleanup old revocations every hour
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const REVOCATION_TTL = 24 * 60 * 60 * 1000; // 24 hours

const revokedSessionsWithTimestamp = new Map<string, number>();

/**
 * Revoke a session
 */
export function revokeSession(sessionId: string): void {
  const now = Date.now();
  revokedSessionsWithTimestamp.set(sessionId, now);
  console.log(`[Session Revocation] Session revoked:`, {
    sessionId,
    revokedAt: new Date(now).toISOString(),
    totalRevoked: revokedSessionsWithTimestamp.size,
  });
}

/**
 * Check if a session is revoked
 */
export function isSessionRevoked(sessionId: string): boolean {
  const revokedAt = revokedSessionsWithTimestamp.get(sessionId);

  // DEBUG: Log all revoked sessions when checking
  if (revokedSessionsWithTimestamp.size > 0) {
    console.log(`[Session Revocation] Checking session:`, {
      checkingSessionId: sessionId,
      revokedSessions: [...revokedSessionsWithTimestamp.keys()],
      totalRevoked: revokedSessionsWithTimestamp.size,
    });
  }

  if (!revokedAt) {
    console.log(`[Session Revocation] Session NOT revoked: ${sessionId}`);
    return false;
  }

  // Check if revocation has expired
  const age = Date.now() - revokedAt;
  if (age > REVOCATION_TTL) {
    revokedSessionsWithTimestamp.delete(sessionId);
    console.log(`[Session Revocation] Revocation expired for: ${sessionId}`);
    return false;
  }

  console.log(`[Session Revocation] Session IS revoked: ${sessionId}`);
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
    if (age > REVOCATION_TTL) {
      revokedSessionsWithTimestamp.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(
      `[Session Revocation] Cleaned up ${cleaned} expired revocations`
    );
  }
}

// Start cleanup interval
if (typeof globalThis !== 'undefined') {
  setInterval(cleanupExpiredRevocations, CLEANUP_INTERVAL);
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
  console.log('[Session Revocation] Cleared all revocations');
}

// ==================== PRODUCTION REDIS IMPLEMENTATION ====================
/**
 * For production, use Redis:
 *
 * import Redis from 'ioredis';
 * const redis = new Redis(process.env.REDIS_URL);
 *
 * export async function revokeSession(sessionId: string): Promise<void> {
 *   await redis.setex(`revoked:${sessionId}`, REVOCATION_TTL / 1000, '1');
 * }
 *
 * export async function isSessionRevoked(sessionId: string): Promise<boolean> {
 *   const revoked = await redis.get(`revoked:${sessionId}`);
 *   return !!revoked;
 * }
 */
