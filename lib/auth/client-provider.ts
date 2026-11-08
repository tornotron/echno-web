import {
  type AuthProviderName,
  DEFAULT_AUTH_PROVIDER,
} from '@/lib/auth/provider';

/**
 * The sign-in provider, as the browser knows it.
 *
 * Client code cannot read `AUTH_PROVIDER`, which is a server variable read at run time, so the
 * root layout reads it and passes it to `AuthSessionProvider`, which records it here. The plain
 * functions in `lib/auth/client.tsx` (`signOut`, `startSignIn`) and the refresh coordinator are
 * called outside React and read it from here. It is fixed for the life of the page, and Keycloak
 * until told otherwise.
 */
let provider: AuthProviderName = DEFAULT_AUTH_PROVIDER;

export function setClientAuthProvider(next: AuthProviderName): void {
  provider = next;
}

export function clientAuthProvider(): AuthProviderName {
  return provider;
}
