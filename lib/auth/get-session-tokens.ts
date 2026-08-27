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
    // When the server last saw the client assert that a user was present. The
    // idle deadline is measured from this rather than from browser storage,
    // because a caller that is not our client never advances it.
    lastActivityAt: token.lastActivityAt as number | undefined,
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

/**
 * Names NextAuth stores the session cookie under.
 *
 * Which of the two is in play depends on whether the deployment issues secure
 * cookies, and a large session is split across numbered chunks (`.0`, `.1`, …),
 * so both bases are matched with and without a chunk suffix.
 */
const SESSION_COOKIE_NAMES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
] as const;

/** The suffix NextAuth gives each piece of a session cookie it had to split. */
const CHUNK_SUFFIX = /^\d+$/;

/**
 * Whether a cookie name is one NextAuth keeps the session in.
 *
 * @param name - Cookie name as it arrived on the request.
 */
export function isSessionCookieName(name: string): boolean {
  return SESSION_COOKIE_NAMES.some((base) => {
    if (name === base) return true;
    if (!name.startsWith(`${base}.`)) return false;
    // Only the numbered chunks count. Anything else sharing the prefix was put
    // there by something that is not NextAuth, and reading it as a session
    // would turn an anonymous request into an ended one.
    return CHUNK_SUFFIX.test(name.slice(base.length + 1));
  });
}

/**
 * Whether the request arrived carrying a session cookie at all.
 *
 * This is the question {@link getSessionTokens} cannot answer. It returns null
 * for two situations that mean opposite things: nobody is signed in, and
 * somebody is holding a cookie that no longer decrypts. The first is an
 * ordinary anonymous request and belongs upstream, where the endpoint decides
 * whether it allows one. The second is a session that has ended, and forwarding
 * it buys a generic rejection from the backend that the browser cannot act on.
 *
 * Only the presence of the cookie is read here, never its contents: whether it
 * still decodes is exactly what {@link getSessionTokens} already established.
 */
export async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.getAll().some(({ name }) => isSessionCookieName(name));
}
