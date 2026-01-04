/**
 * Authentication Metrics Tracking
 *
 * Tracks important authentication events for monitoring and analytics
 * In production, these metrics can be sent to monitoring services like:
 * - Prometheus
 * - DataDog
 * - CloudWatch
 * - New Relic
 */

import { logger } from '@/lib/logger';

/**
 * Metric types we track
 */
export enum MetricType {
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  TOKEN_REFRESH_SUCCESS = 'auth.token.refresh.success',
  TOKEN_REFRESH_FAILURE = 'auth.token.refresh.failure',
  SESSION_REVOKED = 'auth.session.revoked',
  SESSION_EXPIRED = 'auth.session.expired',
  RATE_LIMIT_HIT = 'auth.ratelimit.hit',
  FRONTCHANNEL_LOGOUT = 'auth.frontchannel.logout',
}

/**
 * In-memory metrics store (last hour)
 * For production, send to external monitoring service
 */
interface MetricEntry {
  type: MetricType;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

const metricsStore: MetricEntry[] = [];
const MAX_METRICS_AGE = 60 * 60 * 1000; // 1 hour

/**
 * Record a metric event
 *
 * @param type - Type of metric to record
 * @param metadata - Optional metadata to attach
 *
 * @example
 * ```ts
 * recordMetric(MetricType.LOGIN_SUCCESS, {
 *   provider: 'keycloak',
 *   userId: user.id,
 * });
 * ```
 */
export function recordMetric(
  type: MetricType,
  metadata?: Record<string, unknown>
): void {
  const entry: MetricEntry = {
    type,
    timestamp: Date.now(),
    metadata,
  };

  metricsStore.push(entry);

  // Log for debugging
  logger.debug('Metric recorded', {
    type,
    ...metadata,
  });

  // In production, send to monitoring service here
  // Example: sendToDataDog(type, metadata);
  // Example: sendToPrometheus(type, metadata);
}

/**
 * Get metrics for a specific type within a time window
 *
 * @param type - Metric type to filter
 * @param windowMs - Time window in milliseconds (default: 1 hour)
 * @returns Array of matching metrics
 */
export function getMetrics(
  type?: MetricType,
  windowMs: number = MAX_METRICS_AGE
): MetricEntry[] {
  const now = Date.now();
  const cutoff = now - windowMs;

  let filtered = metricsStore.filter((entry) => entry.timestamp >= cutoff);

  if (type) {
    filtered = filtered.filter((entry) => entry.type === type);
  }

  return filtered;
}

/**
 * Get metric counts by type
 *
 * @param windowMs - Time window in milliseconds (default: 1 hour)
 * @returns Object with counts for each metric type
 */
export function getMetricCounts(
  windowMs: number = MAX_METRICS_AGE
): Record<string, number> {
  const metrics = getMetrics(undefined, windowMs);
  const counts: Record<string, number> = {};

  for (const metric of metrics) {
    counts[metric.type] = (counts[metric.type] || 0) + 1;
  }

  return counts;
}

/**
 * Get authentication statistics
 *
 * @param windowMs - Time window in milliseconds (default: 1 hour)
 * @returns Authentication statistics
 */
export function getAuthStats(windowMs: number = MAX_METRICS_AGE): {
  loginSuccess: number;
  loginFailure: number;
  logout: number;
  tokenRefreshSuccess: number;
  tokenRefreshFailure: number;
  sessionRevoked: number;
  rateLimitHits: number;
  loginSuccessRate: number;
  tokenRefreshSuccessRate: number;
} {
  const counts = getMetricCounts(windowMs);

  const loginSuccess = counts[MetricType.LOGIN_SUCCESS] || 0;
  const loginFailure = counts[MetricType.LOGIN_FAILURE] || 0;
  const logout = counts[MetricType.LOGOUT] || 0;
  const tokenRefreshSuccess = counts[MetricType.TOKEN_REFRESH_SUCCESS] || 0;
  const tokenRefreshFailure = counts[MetricType.TOKEN_REFRESH_FAILURE] || 0;
  const sessionRevoked = counts[MetricType.SESSION_REVOKED] || 0;
  const rateLimitHits = counts[MetricType.RATE_LIMIT_HIT] || 0;

  const totalLogins = loginSuccess + loginFailure;
  const totalRefreshes = tokenRefreshSuccess + tokenRefreshFailure;

  return {
    loginSuccess,
    loginFailure,
    logout,
    tokenRefreshSuccess,
    tokenRefreshFailure,
    sessionRevoked,
    rateLimitHits,
    loginSuccessRate: totalLogins > 0 ? loginSuccess / totalLogins : 1,
    tokenRefreshSuccessRate:
      totalRefreshes > 0 ? tokenRefreshSuccess / totalRefreshes : 1,
  };
}

/**
 * Cleanup old metrics
 */
function cleanupOldMetrics(): void {
  const now = Date.now();
  const cutoff = now - MAX_METRICS_AGE;

  const before = metricsStore.length;
  const filtered = metricsStore.filter((entry) => entry.timestamp >= cutoff);

  metricsStore.length = 0;
  metricsStore.push(...filtered);

  const removed = before - metricsStore.length;
  if (removed > 0) {
    logger.debug('Cleaned up old metrics', {
      removed,
      remaining: metricsStore.length,
    });
  }
}

/**
 * Clear all metrics (for testing)
 */
export function clearMetrics(): void {
  metricsStore.length = 0;
}

// Cleanup old metrics every 15 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(cleanupOldMetrics, 15 * 60 * 1000);
}
