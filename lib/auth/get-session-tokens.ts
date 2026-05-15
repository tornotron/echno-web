import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';

/**
 * Server-side helper to read the JWT (with tokens) from the encrypted
 * session cookie on the current request.
 *
 * The client-facing session intentionally omits tokens — anything placed on
 * the session object is sent to the browser in plaintext by /api/auth/session,
 * which would defeat the BFF model. This helper decrypts the cookie
 * server-side so route handlers can forward the access token to the backend
 * without exposing it to client JS.
 *
 * Note: this does NOT run the NextAuth `jwt()` callback. That means token
 * refresh and revocation checks do not happen here — they happen during
 * `auth()` calls (middleware on protected pages, `/api/auth/session` polls
 * from `useSession()`). Route handlers that need to enforce revocation must
 * do so explicitly using `isSessionRevoked(token.sessionId)`.
 *
 * Usage:
 * ```typescript
 * const tokens = await getSessionTokens();
 * if (!tokens) return new NextResponse('Unauthorized', { status: 401 });
 * ```
 */
export async function getSessionTokens() {
  const cookieStore = await cookies();
  const token = await getToken({
    req: {
      headers: {
        cookie: cookieStore.toString(),
      },
    } as { headers: { cookie: string } },
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NEXTAUTH_URL?.startsWith('https://'),
  });

  if (!token) {
    return null;
  }

  return {
    // Identity / session metadata
    userId: token.userId as string | undefined,
    email: token.email as string | undefined,
    name: token.name as string | undefined,
    provider: token.provider as string | undefined,
    sessionId: token.sessionId as string | undefined,
    expiresAt: token.expiresAt as number | undefined,
    error: token.error as string | undefined,
    defaultOrganizationId: token.defaultOrganizationId as string | undefined,

    // Token material — server-side only; never returned to the browser.
    accessToken: token.accessToken as string | undefined,
    idToken: token.idToken as string | undefined,
    refreshToken: token.refreshToken as string | undefined,
    keycloakIssuer: token.keycloakIssuer as string | undefined,
  };
}

/**
 * Shorthand to get just the access token from the current request's cookie.
 */
export async function getAccessToken(): Promise<string | null> {
  const tokens = await getSessionTokens();
  return tokens?.accessToken ?? null;
}
