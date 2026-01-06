/**
 * Health Check Endpoint
 *
 * Returns comprehensive system health status:
 * - API availability
 * - Session revocation store status
 * - Redis connectivity (if configured)
 * - Environment configuration
 *
 * Public endpoint - no authentication required
 * Used by load balancers, monitoring systems, and ops teams
 */

import { NextResponse } from 'next/server';
import {
  getRedisStatus,
  getRevokedSessionCount,
} from '@/lib/auth/session-revocation';

// Force dynamic rendering and prevent cookie/auth processing
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const startTime = Date.now();

    // Check session store health
    const redisStatus = getRedisStatus();
    const revokedCount = getRevokedSessionCount();

    // Check environment configuration
    const hasKeycloakConfig = !!(
      process.env.KEYCLOAK_ISSUER && process.env.KEYCLOAK_ID
    );

    const hasNextAuthConfig = !!(
      process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL
    );

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Degraded if Redis is configured but unavailable
    if (process.env.REDIS_URL && !redisStatus.available) {
      overallStatus = 'degraded';
    }

    // Unhealthy if critical config is missing
    if (!hasKeycloakConfig || !hasNextAuthConfig) {
      overallStatus = 'unhealthy';
    }

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        api: {
          status: 'ok',
          message: 'API is responding',
        },
        sessionStore: {
          status: redisStatus.available
            ? 'ok'
            : process.env.REDIS_URL
              ? 'degraded'
              : 'ok',
          mode: redisStatus.mode,
          revokedCount,
          redisAvailable: redisStatus.available,
        },
        environment: {
          status: hasKeycloakConfig && hasNextAuthConfig ? 'ok' : 'error',
          nodeEnv: process.env.NODE_ENV || 'unknown',
          hasKeycloakConfig,
          hasNextAuthConfig,
        },
      },
    };

    const statusCode =
      overallStatus === 'healthy'
        ? 200
        : overallStatus === 'degraded'
          ? 200
          : 503;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
