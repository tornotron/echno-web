/**
 * Which sign-in provider this deployment uses, read from `AUTH_PROVIDER` when the server runs.
 *
 * Unset or empty means `keycloak`, so a stack that has never heard of the setting behaves exactly
 * as it did before. Any other value is refused rather than guessed at: a typo that quietly fell
 * back to Keycloak would leave a WorkOS stack trying to reach a Keycloak that is not there.
 *
 * Read on every call, never at module load and never through a `NEXT_PUBLIC_` variable, so one
 * image serves either provider. Client components cannot read it; the root layout passes it down.
 */

export const AUTH_PROVIDERS = ['keycloak', 'workos'] as const;

export type AuthProviderName = (typeof AUTH_PROVIDERS)[number];

/** The provider used when `AUTH_PROVIDER` is not set. */
export const DEFAULT_AUTH_PROVIDER: AuthProviderName = 'keycloak';

/**
 * Parses an `AUTH_PROVIDER` value.
 *
 * @param value - The raw variable, or undefined when it is not set.
 * @throws {Error} When the value names no known provider.
 */
export function parseAuthProvider(value: string | undefined): AuthProviderName {
  const trimmed = value?.trim() ?? '';
  if (trimmed === '') return DEFAULT_AUTH_PROVIDER;
  if ((AUTH_PROVIDERS as readonly string[]).includes(trimmed)) {
    return trimmed as AuthProviderName;
  }
  throw new Error(
    `[Auth Config] AUTH_PROVIDER must be one of ${AUTH_PROVIDERS.join(', ')}, or unset for ${DEFAULT_AUTH_PROVIDER}. Got: ${trimmed}`
  );
}

/** The provider this server process signs people in with. */
export function getAuthProvider(): AuthProviderName {
  return parseAuthProvider(process.env.AUTH_PROVIDER);
}
