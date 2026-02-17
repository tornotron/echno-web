import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { auth } from '@/auth';
import { getRevokedSessionCount } from '@/lib/auth/session-revocation';

/**
 * Debug endpoint to inspect current session state
 *
 * IMPORTANT: Remove or protect this endpoint in production!
 *
 * Usage: GET /api/debug/session
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    const debugInfo = {
      timestamp: new Date().toISOString(),
      session: session
        ? {
            userId: session.user?.id,
            email: session.user?.email,
            provider: session.provider,
            sessionId: session.sessionId,
            expiresAt: session.expiresAt
              ? new Date(session.expiresAt).toISOString()
              : null,
            error: session.error,
          }
        : null,
      revocationStore: {
        totalRevokedSessions: getRevokedSessionCount(),
      },
      cookies: {
        // List all cookies from request
        all: req.cookies
          .getAll()
          .map((c) => ({ name: c.name, hasValue: !!c.value })),
      },
    };

    return NextResponse.json(debugInfo, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('[Debug] Session debug error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get debug info',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
