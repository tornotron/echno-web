import { auth } from '@/auth';
import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';
import { isSystemAdmin } from '@/lib/rbac/role-utils';

/**
 * Server-side helper to get full session with tokens and permissions
 *
 * The session object sent to client is minimal to reduce cookie size.
 * This function retrieves the full JWT token server-side with all data.
 *
 * Usage:
 * ```typescript
 * const { accessToken, idToken, permissions } = await getSessionTokens();
 * ```
 */
export async function getSessionTokens() {
  const session = await auth();

  if (!session) {
    return null;
  }

  // Get the full JWT token from the cookie (server-side only)
  const cookieStore = await cookies();
  const token = await getToken({
    req: {
      headers: {
        cookie: cookieStore.toString(),
      },
    } as { headers: { cookie: string } },
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return null;
  }

  const userRoles = session.user?.roles || [];

  return {
    // Session info (already in session)
    userId: session.user?.id,
    email: session.user?.email,
    name: session.user?.name,
    roles: userRoles,
    isSystemAdmin: isSystemAdmin(userRoles),
    provider: session.provider,
    sessionId: session.sessionId,
    expiresAt: session.expiresAt,
    error: session.error,

    // Token info (from JWT, not in session to reduce cookie size)
    accessToken: token.accessToken as string,
    idToken: token.idToken as string,
    refreshToken: token.refreshToken as string,
    keycloakIssuer: token.keycloakIssuer as string,
    permissions: token.permissions || [],
  };
}

/**
 * Shorthand to get just the access token
 */
export async function getAccessToken(): Promise<string | null> {
  const tokens = await getSessionTokens();
  return tokens?.accessToken || null;
}

/**
 * Shorthand to get permissions computed from roles
 */
export async function getSessionPermissions() {
  const tokens = await getSessionTokens();
  return tokens?.permissions || [];
}
