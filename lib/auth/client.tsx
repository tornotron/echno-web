'use client';

/**
 * The one place client code reaches the sign-in library. Pages and components use these, never the
 * library itself, so the provider behind them can change without touching them. An ESLint rule
 * holds the boundary.
 *
 * `AuthSessionProvider` holds the session for everything below it, and `signOut` ends it, taking the
 * library's options such as `callbackUrl` or `redirect: false`.
 */
import { signIn as librarySignIn, useSession } from 'next-auth/react';

import { startKeycloakSignIn } from '@/lib/auth/sign-in-flow';

export {
  SessionProvider as AuthSessionProvider,
  signOut,
} from 'next-auth/react';

/** The signed-in session and its state: `loading`, `authenticated` or `unauthenticated`. */
export function useAuthSession() {
  return useSession();
}

/**
 * Sends the person to sign in, after any sign-out still in flight has finished, and back to the
 * page the query string names (`callbackUrl`), or the dashboard.
 */
export function startSignIn(
  search: string = globalThis.location?.search ?? ''
): Promise<void> {
  return startKeycloakSignIn(librarySignIn, search);
}
