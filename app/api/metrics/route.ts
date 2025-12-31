/**
 * Metrics Endpoint
 *
 * Returns authentication metrics for monitoring
 * Protected endpoint - only accessible in development or with proper auth
 */

import { NextResponse } from 'next/server';
import { getAuthStats, getMetricCounts } from '@/lib/monitoring/metrics';
import { getRateLimitStats } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET() {
  // In production, add authentication check here
  // For now, only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Metrics endpoint disabled in production' },
      { status: 403 }
    );
  }

  try {
    // Get auth stats for different time windows
    const last15Min = getAuthStats(15 * 60 * 1000);
    const lastHour = getAuthStats(60 * 60 * 1000);

    // Get rate limit stats
    const rateLimitStats = getRateLimitStats();

    // Get all metric counts
    const allMetrics = getMetricCounts();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      auth: {
        last15Minutes: last15Min,
        lastHour,
      },
      rateLimiting: rateLimitStats,
      metrics: allMetrics,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
