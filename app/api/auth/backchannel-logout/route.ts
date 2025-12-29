import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { revokeSession } from '@/lib/auth/session-revocation';

interface LogoutToken {
  sid?: string;
  sub?: string;
  iat?: number;
  aud?: string | string[];
  events?: Record<string, unknown>;
  [key: string]: unknown;
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
    const formData = await req.formData();
    const logoutToken = formData.get('logout_token') as string;

    if (!logoutToken) {
      console.error('[Backchannel Logout] No logout token provided');
      return new NextResponse('Bad Request', { status: 400 });
    }

    // Decode the logout token
    try {
      const decoded = jwtDecode<LogoutToken>(logoutToken);

      console.log('[Backchannel Logout] Received logout request:', {
        sid: decoded.sid, // Session ID
        sub: decoded.sub, // User ID (subject)
        iat: decoded.iat, // Issued at
        aud: decoded.aud, // Audience (client ID)
        events: decoded.events, // Logout event type
      });

      // Validate the logout token
      if (
        !decoded.events ||
        !decoded.events['http://schemas.openid.net/event/backchannel-logout']
      ) {
        console.error('[Backchannel Logout] Invalid logout event');
        return new NextResponse('Invalid logout event', { status: 400 });
      }

      // Revoke session by session ID (sid)
      if (decoded.sid) {
        revokeSession(decoded.sid);
        console.log(`[Backchannel Logout] Session revoked: ${decoded.sid}`);
      }

      // Alternatively, revoke by user ID (sub) - revokes all sessions for the user
      // This is more aggressive and will log out the user from all devices
      if (decoded.sub && !decoded.sid) {
        revokeSession(decoded.sub);
        console.log(
          `[Backchannel Logout] All sessions revoked for user: ${decoded.sub}`
        );
      }

      // Return 200 OK to Keycloak
      return new NextResponse('OK', { status: 200 });
    } catch (error) {
      console.error(
        '[Backchannel Logout] Failed to decode logout token:',
        error
      );
      return new NextResponse('Invalid Token', { status: 400 });
    }
  } catch (error) {
    console.error('[Backchannel Logout] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
