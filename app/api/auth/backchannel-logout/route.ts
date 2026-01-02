import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { revokeSession } from '@/lib/auth/session-revocation';
import { logger } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

interface LogoutToken {
  sid?: string;
  sub?: string;
  iat?: number;
  iss?: string;
  aud?: string | string[];
  events?: Record<string, unknown>;
  [key: string]: unknown;
}

// Lazy-load JWKS to avoid URL construction at build time
// Cache is maintained across requests for performance
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwksCache) {
    const issuer = process.env.KEYCLOAK_ISSUER;
    if (!issuer) {
      throw new Error('KEYCLOAK_ISSUER environment variable is not set');
    }
    jwksCache = createRemoteJWKSet(
      new URL(`${issuer}/protocol/openid-connect/certs`)
    );
  }
  return jwksCache;
}

/**
 * Keycloak Backchannel Logout Endpoint
 *
 * This endpoint is called by Keycloak when a user logs out from another application
 * or when an admin terminates a session. It receives a logout token and should
 * invalidate the corresponding session.
 *
 * Configure this URL in Keycloak:
 * Admin Console → Clients → [Your Client] → Settings → Backchannel logout URL
 * URL: https://your-domain.com/api/auth/backchannel-logout
 *
 * Keycloak will send a POST request with:
 * - logout_token: A signed JWT containing the session to terminate
 *
 * @see https://openid.net/specs/openid-connect-backchannel-1_0.html
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting - prevent abuse
    const clientIp =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const rateLimitResult = checkRateLimit(clientIp, RATE_LIMITS.BACKCHANNEL);

    if (!rateLimitResult.allowed) {
      logger.warn('Backchannel logout rate limit exceeded', {
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

    const formData = await req.formData();
    const logoutToken = formData.get('logout_token') as string;

    if (!logoutToken) {
      logger.auth.backchannel('No logout token provided');
      return new NextResponse('Bad Request', { status: 400 });
    }

    // Verify and decode the logout token with signature verification
    try {
      const expectedIssuer = process.env.KEYCLOAK_ISSUER;
      const expectedAudience = process.env.KEYCLOAK_ID;

      if (!expectedIssuer || !expectedAudience) {
        logger.error(
          'Backchannel logout: Missing KEYCLOAK_ISSUER or KEYCLOAK_ID environment variables'
        );
        return new NextResponse('Server Configuration Error', { status: 500 });
      }

      // Verify JWT signature and validate claims
      const { payload } = await jwtVerify(logoutToken, getJWKS(), {
        issuer: expectedIssuer, // Validate issuer matches Keycloak realm
        audience: expectedAudience, // Validate audience contains client ID
        // clockTolerance allows for small time differences (5 minutes)
        clockTolerance: 300,
      });

      const decoded = payload as LogoutToken;

      logger.auth.backchannel('Received logout request', {
        hasSid: !!decoded.sid, // Session ID present
        hasSub: !!decoded.sub, // User ID present
        iat: decoded.iat, // Issued at
        iss: decoded.iss, // Issuer
        aud: decoded.aud, // Audience (client ID)
        events: decoded.events, // Logout event type
      });

      // Validate issued-at time is within acceptable bounds (not too old)
      if (decoded.iat) {
        const now = Math.floor(Date.now() / 1000);
        const iatAge = now - decoded.iat;
        const maxAge = 600; // 10 minutes max age

        if (iatAge > maxAge) {
          logger.warn(
            `Backchannel logout: Token too old: issued ${iatAge}s ago (max ${maxAge}s)`
          );
          return new NextResponse('Token Expired', { status: 400 });
        }

        if (iatAge < -300) {
          // Token issued more than 5 minutes in the future
          logger.warn(
            `Backchannel logout: Token issued in the future: ${iatAge}s`
          );
          return new NextResponse('Invalid Token Time', { status: 400 });
        }
      }

      // Validate the logout event claim
      if (
        !decoded.events ||
        !decoded.events['http://schemas.openid.net/event/backchannel-logout']
      ) {
        logger.warn('Backchannel logout: Invalid logout event');
        return new NextResponse('Invalid logout event', { status: 400 });
      }

      // Revoke session by session ID (sid)
      if (decoded.sid) {
        revokeSession(decoded.sid);
        logger.auth.backchannel('Session revoked by session ID');
      }

      // Alternatively, revoke by user ID (sub) - revokes all sessions for the user
      // This is more aggressive and will log out the user from all devices
      if (decoded.sub && !decoded.sid) {
        revokeSession(decoded.sub);
        logger.auth.backchannel('All sessions revoked by user ID');
      }

      // Return 200 OK to Keycloak
      return new NextResponse('OK', { status: 200 });
    } catch (error) {
      logger.error('Backchannel logout: Failed to verify logout token', error);

      // Provide more specific error message
      if (error instanceof Error) {
        if (error.message.includes('signature')) {
          return new NextResponse('Invalid Token Signature', { status: 400 });
        }
        if (error.message.includes('issuer')) {
          return new NextResponse('Invalid Token Issuer', { status: 400 });
        }
        if (error.message.includes('audience')) {
          return new NextResponse('Invalid Token Audience', { status: 400 });
        }
      }

      return new NextResponse('Invalid Token', { status: 400 });
    }
  } catch (error) {
    logger.error('Backchannel logout error', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
