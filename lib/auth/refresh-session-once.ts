import { getSession } from 'next-auth/react';
import { sessionRefresh } from '@/lib/auth/session-refresh-lock';

/**
 * Forces the session round trip that refreshes the access token, at most one at
 * a time across every caller on this origin.
 *
 * Two client paths need this and both must go through the same coordinator. The
 * API client asks for it when the BFF answers a request with the expiry signal,
 * and a whole dashboard of parallel queries can hit that signal in the same
 * instant. The chat stream asks for it before reopening a stream the browser
 * closed, which the ten minute server-side recycle makes a routine event.
 *
 * Letting either path call `getSession()` on its own would put several runs of
 * the `jwt()` callback on one cookie, all posting the same refresh token to
 * Keycloak. Our realms set `revokeRefreshToken` with `refreshTokenMaxReuse: 0`,
 * so the first exchange wins and every other one is a reuse that revokes the
 * chain and signs the user out. {@link sessionRefresh} collapses the callers in
 * this tab into one exchange and holds the cross-tab lock while it runs, so the
 * other tabs wait too.
 *
 * Calling it when nothing needs refreshing is deliberately cheap and safe. The
 * `jwt()` callback only exchanges when the token is inside its refresh buffer,
 * so an early call costs one round trip and changes nothing.
 *
 * It never throws. A refresh that fails leaves the caller to fail on its own
 * 401, which is exactly what would have happened without this step.
 */
export async function refreshSessionOnce(): Promise<void> {
  try {
    await sessionRefresh.refreshOnce(getSession);
  } catch {
    // Intentionally swallowed: see the note above.
  }
}
