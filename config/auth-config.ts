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

/**
 * Required environment variables for authentication. Kept as a `const`
 * tuple so we can derive a narrow `RequiredAuthEnvVar` union type.
 */
const REQUIRED_AUTH_ENV_VARS = [
  'KEYCLOAK_ISSUER',
  'KEYCLOAK_ID',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const;

type RequiredAuthEnvVar = (typeof REQUIRED_AUTH_ENV_VARS)[number];
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
 * Ensures that all required authentication environment variables are set
 * and performs lightweight format validation. Throws a detailed Error that
 * is suitable for logging and crash reporting when validation fails.
 *
 * @throws {Error} When required environment variables are missing or invalid.
 */
export function validateAuthConfig(): void {
  const missing: string[] = [];

  for (const envVar of REQUIRED_AUTH_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[Auth Config] Missing required environment variables:\n  - ${missing.join('\n  - ')}\n\n` +
        `Please ensure these are set in your .env file or environment.`
    );
  }

  // Validate format of certain variables
  validateKeycloakIssuer();
  validateNextAuthUrl();
  validateNextAuthSecret();
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
