/**
 * Keeps a sign-in from racing the sign-out that ends a dead session.
 *
 * A browser that comes back to `/` with a session past its idle deadline (or
 * refused, or revoked) is signed out by `useSessionLifecycle` about a second
 * after the page loads. A Login click inside that second used to start a
 * sign-in alongside it. The sign-out then navigated the page to `/`, and
 * Firefox cancels a page's in-flight requests when a navigation starts, which
 * took out the sign-in's `/api/auth/csrf` fetch. `next-auth/react` turns that
 * failure into an empty CSRF token, posts it anyway, and Auth.js answers
 * `MissingCSRF` (issue: "Error login in", 1 Oct 2026).
 *
 * Three things close it:
 *   - the lifecycle sign-out is registered here, and a sign-in waits for it;
 *   - on `/` that sign-out ends the session in place instead of navigating, so
 *     there is no navigation to cancel anything, and the `?error=` message the
 *     user was sent here with stays on screen;
 *   - the sign-in names where to land afterwards instead of defaulting to the
 *     current URL, so a retry from `/?error=...` does not come back to the
 *     same error after it succeeds.
 */

/** Where a sign-in lands when nothing better is known. */
export const DEFAULT_SIGN_IN_TARGET = '/users/dashboard';

let pendingSignOut: Promise<unknown> | null = null;

/**
 * Registers a sign-out in progress so {@link waitForPendingSignOut} can hold a
 * sign-in behind it. Returns the same promise.
 */
export function trackSignOut<T>(signOutPromise: Promise<T>): Promise<T> {
  pendingSignOut = signOutPromise;
  const clear = () => {
    if (pendingSignOut === signOutPromise) pendingSignOut = null;
  };
  signOutPromise.then(clear, clear);
  return signOutPromise;
}

/** Resolves once no tracked sign-out is in flight. Never rejects. */
export async function waitForPendingSignOut(): Promise<void> {
  while (pendingSignOut) {
    const current = pendingSignOut;
    await current.catch(() => {});
    if (pendingSignOut === current) pendingSignOut = null;
  }
}

/** The two shapes of `next-auth/react`'s `signOut` this module calls. */
interface SignOutFn {
  (options: { callbackUrl: string }): Promise<unknown>;
  (options: { redirect: false }): Promise<unknown>;
}

/**
 * The sign-out `useSessionLifecycle` performs. On `/` the session is ended
 * without a navigation: the page is already where the sign-out would send it,
 * and the navigation is what cancelled a concurrent sign-in.
 */
export function endSessionForLifecycle(
  signOut: SignOutFn,
  pathname: string,
  options: { callbackUrl: string }
): Promise<unknown> {
  const inPlace = pathname === '/';
  return trackSignOut(
    inPlace ? signOut({ redirect: false }) : signOut(options)
  );
}

/**
 * Where a sign-in started from the page at `search` should land. A
 * `callbackUrl` that `proxy.ts` set for a protected page is honoured when it
 * is a same-origin path; anything else, including the `?error=` landing
 * itself, goes to the dashboard.
 */
export function signInRedirectTarget(search: string): string {
  const callbackUrl = new URLSearchParams(search).get('callbackUrl');
  if (
    callbackUrl &&
    callbackUrl.startsWith('/') &&
    !callbackUrl.startsWith('//') &&
    !callbackUrl.includes('\\') &&
    !callbackUrl.startsWith('/?') &&
    callbackUrl !== '/'
  ) {
    return callbackUrl;
  }
  return DEFAULT_SIGN_IN_TARGET;
}

type SignInFn = (
  provider: string,
  options: { redirectTo: string }
) => Promise<unknown>;

/**
 * Starts the Keycloak sign-in once any sign-out in flight has finished, with
 * an explicit landing target.
 */
export async function startKeycloakSignIn(
  signIn: SignInFn,
  search: string
): Promise<void> {
  await waitForPendingSignOut();
  await signIn('keycloak', { redirectTo: signInRedirectTarget(search) });
}
