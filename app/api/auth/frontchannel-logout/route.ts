import { NextRequest, NextResponse } from 'next/server';
import { revokeSession } from '@/lib/auth/session-revocation';
import { logger } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

/**
 * Keycloak Frontchannel Logout Endpoint
 *
 * This endpoint is called by Keycloak when a user logs out from another application
 * or when an admin terminates a session. Unlike backchannel logout, frontchannel
 * logout works through the browser using iframes or redirects.
 *
 * Configure this URL in Keycloak:
 * Admin Console → Clients → [Your Client] → Settings → Frontchannel logout URL
 * URL: https://your-domain.com/api/auth/frontchannel-logout
 *
 * Keycloak will include these query parameters:
 * - iss: Issuer identifier (Keycloak realm URL)
 * - sid: Session ID to terminate
 *
 * @see https://openid.net/specs/openid-connect-frontchannel-1_0.html
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting - prevent abuse
    const clientIp =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const rateLimitResult = checkRateLimit(clientIp, RATE_LIMITS.BACKCHANNEL); // Reuse same rate limit

    if (!rateLimitResult.allowed) {
      logger.warn('Frontchannel logout rate limit exceeded', {
        ip: clientIp.slice(0, 20),
        current: rateLimitResult.current,
        limit: rateLimitResult.limit,
      });

      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)),
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(Date.now() + rateLimitResult.resetIn),
        },
      });
    }

    const { searchParams } = new URL(req.url);
    const iss = searchParams.get('iss');
    const sid = searchParams.get('sid');

    // Validate required parameters
    if (!iss || !sid) {
      logger.warn('Frontchannel logout: Missing required parameters', {
        hasIss: !!iss,
        hasSid: !!sid,
      });
      return new NextResponse('Bad Request: Missing iss or sid parameter', {
        status: 400,
      });
    }

    // Validate issuer matches expected Keycloak realm
    const expectedIssuer = process.env.KEYCLOAK_ISSUER;
    if (!expectedIssuer) {
      logger.error(
        'Frontchannel logout: Missing KEYCLOAK_ISSUER environment variable'
      );
      return new NextResponse('Server Configuration Error', { status: 500 });
    }

    if (iss !== expectedIssuer) {
      logger.warn('Frontchannel logout: Invalid issuer', {
        expected: expectedIssuer,
        received: iss,
      });
      return new NextResponse('Invalid issuer', { status: 400 });
    }

    logger.info('Frontchannel logout: Received logout request', {
      iss,
      sid: sid.slice(0, 10) + '...', // Log partial session ID for security
    });

    // Revoke the session
    revokeSession(sid);
    logger.info('Frontchannel logout: Session revoked successfully', {
      sid: sid.slice(0, 10) + '...',
    });

    // Return minimal HTML page that can be loaded in an iframe
    // This confirms logout to Keycloak
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Logout</title>
</head>
<body>
  <p>Logged out successfully</p>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    });
  } catch (error) {
    logger.error('Frontchannel logout error', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
