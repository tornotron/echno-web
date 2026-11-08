/**
 * Authentication configuration helpers and validators.
 *
 * This module centralizes validation and access for authentication-related
 * environment variables. Call `validateAuthConfig()` early during process
 * initialization (server-side) to fail-fast on missing or malformed
 * configuration values.
 */
import { logger } from '@/lib/logger';
import { NEXTAUTH } from '@/lib/auth/constants';
import { type AuthProviderName, getAuthProvider } from '@/lib/auth/provider';

/**
 * Required environment variables for authentication with Keycloak. Kept as a
 * `const` tuple so we can derive a narrow `RequiredAuthEnvVar` union type.
 */
const REQUIRED_AUTH_ENV_VARS = [
  'KEYCLOAK_ISSUER',
  'KEYCLOAK_ID',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const;

type RequiredAuthEnvVar = (typeof REQUIRED_AUTH_ENV_VARS)[number];

/**
 * Required environment variables for authentication with WorkOS. The redirect
 * URI is read when the server runs and must never be set while the image is
 * built (see `lib/auth/workos/settings.ts`), and `WORKOS_ISSUER` is required
 * because `authkit-nextjs` checks the token's issuer only when it is set.
 */
const REQUIRED_WORKOS_ENV_VARS = [
  'WORKOS_API_KEY',
  'WORKOS_CLIENT_ID',
  'WORKOS_COOKIE_PASSWORD',
  'NEXT_PUBLIC_WORKOS_REDIRECT_URI',
  'WORKOS_ISSUER',
  'ECHNO_SESSION_ACTIVITY_SECRET',
] as const;

/** Shortest secret accepted for the WorkOS cookie password and the activity cookie key. */
const MIN_WORKOS_SECRET_LENGTH = 32;
type OptionalAuthEnvVar = 'ENABLE_DEBUG_LOGS' | 'NEXT_PUBLIC_API_URL';

/**
 * Validated and typed environment configuration
 */
export interface AuthConfig {
  keycloak: {
    issuer: string;
    clientId: string;
  };
  nextAuth: {
    secret: string;
    url: string;
  };
  api: {
    url: string | undefined;
  };
  logging: {
    debugEnabled: boolean;
  };
}

/**
 * validateAuthConfig
 *
 * Ensures that the environment variables the chosen sign-in provider needs
 * are set and performs lightweight format validation. Throws a detailed Error
 * that is suitable for logging and crash reporting when validation fails.
 *
 * @param provider - The provider to check. Defaults to `AUTH_PROVIDER`, which
 *   is itself validated: an unknown value throws.
 * @throws {Error} When required environment variables are missing or invalid.
 */
export function validateAuthConfig(
  provider: AuthProviderName = getAuthProvider()
): void {
  if (provider === 'workos') {
    validateWorkosConfig();
    return;
  }

  requireEnvVars(REQUIRED_AUTH_ENV_VARS);

  // Validate format of certain variables
  validateKeycloakIssuer();
  validateNextAuthUrl();
  validateNextAuthSecret();
}

/** Throws one error naming every variable in `names` that is unset or empty. */
function requireEnvVars(names: readonly string[]): void {
  const missing = names.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(
      `[Auth Config] Missing required environment variables:\n  - ${missing.join('\n  - ')}\n\n` +
        `Please ensure these are set in your .env file or environment.`
    );
  }
}

/**
 * validateWorkosConfig
 *
 * The WorkOS variables: all present, both URLs parse, and both secrets are
 * long enough. A short cookie password is fatal here rather than a warning,
 * because `authkit-nextjs` refuses one on every request anyway.
 */
function validateWorkosConfig(): void {
  requireEnvVars(REQUIRED_WORKOS_ENV_VARS);

  for (const name of ['NEXT_PUBLIC_WORKOS_REDIRECT_URI', 'WORKOS_ISSUER']) {
    const value = process.env[name] ?? '';
    let parsed: URL | null = null;
    try {
      parsed = new URL(value);
    } catch {
      parsed = null;
    }
    if (!parsed || !parsed.protocol.startsWith('http')) {
      throw new Error(
        `[Auth Config] Invalid ${name} format: ${value}\n` +
          `Must be a valid HTTP(S) URL (e.g., https://app.example.test/callback)`
      );
    }
  }

  for (const name of [
    'WORKOS_COOKIE_PASSWORD',
    'ECHNO_SESSION_ACTIVITY_SECRET',
  ]) {
    const length = process.env[name]?.length ?? 0;
    if (length < MIN_WORKOS_SECRET_LENGTH) {
      throw new Error(
        `[Auth Config] ${name} must be at least ${MIN_WORKOS_SECRET_LENGTH} characters long. ` +
          `Current length: ${length} characters.\n` +
          `Generate one: openssl rand -base64 32`
      );
    }
  }
}

/**
 * validateKeycloakIssuer
 *
 * Ensures `KEYCLOAK_ISSUER` (if present) is a valid HTTP(S) URL. Throws a
 * descriptive Error when the format is invalid to aid troubleshooting.
 */
function validateKeycloakIssuer(): void {
  const issuer = process.env.KEYCLOAK_ISSUER;
  if (!issuer) return;

  try {
    const url = new URL(issuer);
    if (!url.protocol.startsWith('http')) {
      throw new Error('Issuer must be HTTP/HTTPS URL');
    }
  } catch {
    throw new Error(
      `[Auth Config] Invalid KEYCLOAK_ISSUER format: ${issuer}\n` +
        `Must be a valid URL (e.g., https://keycloak.example.com/realms/my-realm)`
    );
  }
}

/**
 * validateNextAuthUrl
 *
 * Ensures `NEXTAUTH_URL` (if present) parses as a valid URL.
 */
function validateNextAuthUrl(): void {
  const url = process.env.NEXTAUTH_URL;
  if (!url) return;

  try {
    new URL(url);
  } catch {
    throw new Error(
      `[Auth Config] Invalid NEXTAUTH_URL format: ${url}\n` +
        `Must be a valid URL (e.g., https://example.com or http://localhost:3000)`
    );
  }
}

/**
 * validateNextAuthSecret
 *
 * Performs a minimal check against `NEXTAUTH_SECRET` strength by
 * validating length. Logs a warning (does not throw) because a short
 * secret is not fatal but is discouraged for production.
 */
function validateNextAuthSecret(): void {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return;

  // NextAuth recommends at least MIN_SECRET_LENGTH characters
  if (secret.length < NEXTAUTH.MIN_SECRET_LENGTH) {
    logger.warn(
      `[Auth Config] Warning: NEXTAUTH_SECRET should be at least ${NEXTAUTH.MIN_SECRET_LENGTH} characters long for security.\n` +
        `Current length: ${secret.length} characters.\n` +
        `Generate a secure secret: openssl rand -base64 32`
    );
  }
}

/**
 * getAuthConfig
 *
 * Returns a typed `AuthConfig` built from environment variables. This
 * helper assumes `validateAuthConfig()` has been executed previously to
 * ensure required keys exist.
 */
export function getAuthConfig(): AuthConfig {
  // This assumes validateAuthConfig() was already called
  return {
    keycloak: {
      issuer: process.env.KEYCLOAK_ISSUER!,
      clientId: process.env.KEYCLOAK_ID!,
    },
    nextAuth: {
      secret: process.env.NEXTAUTH_SECRET!,
      url: process.env.NEXTAUTH_URL!,
    },
    api: {
      url: process.env.NEXT_PUBLIC_API_URL,
    },
    logging: {
      debugEnabled: process.env.ENABLE_DEBUG_LOGS === 'true',
    },
  };
}

/**
 * isProduction
 *
 * Returns true when `NODE_ENV` is set to `production`.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * isServer
 *
 * Helper to determine if the code is executing on the server (Node)
 * rather than in a browser runtime.
 */
export function isServer(): boolean {
  return globalThis.window === undefined;
}

/**
 * getEnv
 *
 * Typed accessor for environment variables used by auth configuration.
 * Use the overloads to get either required or optional variables with
 * compile-time safety in TypeScript code.
 */
export function getEnv(key: RequiredAuthEnvVar): string;
export function getEnv(key: OptionalAuthEnvVar): string | undefined;
export function getEnv(
  key: RequiredAuthEnvVar | OptionalAuthEnvVar
): string | undefined {
  return process.env[key];
}
