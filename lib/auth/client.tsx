'use client';

/**
 * The one place client code reaches the sign-in library. Pages and components use these, never the
 * library itself, so the provider behind them can change without touching them. An ESLint rule
 * holds the boundary.
 *
 * `AuthSessionProvider` holds the session for everything below it, and `signOut` ends it, taking the
 * library's options such as `callbackUrl` or `redirect: false`.
 *
 * Which provider is behind them is decided on the server (`AUTH_PROVIDER`) and handed to
 * `AuthSessionProvider` by the root layout. Under Keycloak each of these is the Auth.js call it
 * always was. Under WorkOS the session is served into the same Auth.js context from
 * `/api/session`, so `useAuthSession()` reads it unchanged.
 */
import {
  SessionProvider,
  type SessionProviderProps,
  type SignOutParams,
  signIn as librarySignIn,
  signOut as librarySignOut,
  useSession,
} from 'next-auth/react';

import {
  clientAuthProvider,
  setClientAuthProvider,
} from '@/lib/auth/client-provider';
import type { AuthProviderName } from '@/lib/auth/provider';
import { startKeycloakSignIn } from '@/lib/auth/sign-in-flow';
import {
  WorkosSessionProvider,
  signOutWorkos,
  startWorkosSignIn,
} from '@/lib/auth/workos/client-session';

/** Holds the session for everything below it. `provider` comes from the server layout. */
export function AuthSessionProvider({
  provider = 'keycloak',
  children,
  ...props
}: SessionProviderProps & { provider?: AuthProviderName }) {
  setClientAuthProvider(provider);
  if (provider === 'workos') {
    return <WorkosSessionProvider>{children}</WorkosSessionProvider>;
  }
  return <SessionProvider {...props}>{children}</SessionProvider>;
}

/** The signed-in session and its state: `loading`, `authenticated` or `unauthenticated`. */
export function useAuthSession() {
  return useSession();
}

/** Ends the session. Takes `callbackUrl` or `redirectTo`, or `redirect: false` to stay on the page. */
export function signOut(options?: SignOutParams<boolean>): Promise<unknown> {
  if (clientAuthProvider() === 'workos') return signOutWorkos(options);
  // The library types `redirect` through two overloads; the call is the same one either way.
  return librarySignOut(options as SignOutParams<true>);
}

/**
 * Sends the person to sign in, after any sign-out still in flight has finished, and back to the
 * page the query string names (`callbackUrl`), or the dashboard.
 */
export function startSignIn(
  search: string = globalThis.location?.search ?? ''
): Promise<void> {
  if (clientAuthProvider() === 'workos') return startWorkosSignIn(search);
  return startKeycloakSignIn(librarySignIn, search);
}
