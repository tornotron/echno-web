/**
 * The one place server code reaches the sign-in library: route handlers, server components and the
 * proxy use these, never the library itself. An ESLint rule holds the boundary.
 *
 * `getSession` reads the signed-in session, or null. `authProxy` wraps the proxy so it sees the
 * session on `request.auth`. `authRouteHandlers` are the library's own routes under `/api/auth`.
 */
import { getSessionTokens } from '@/lib/auth/get-session-tokens';

export {
  auth as authProxy,
  handlers as authRouteHandlers,
  auth as getSession,
} from '@/auth';

/** The access token the BFF forwards to the backend, or null when there is no usable session. */
export async function getAccessToken(): Promise<string | null> {
  const tokens = await getSessionTokens();
  return tokens?.accessToken ?? null;
}
