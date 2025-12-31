/**
 * Authentication Configuration Validation
 *
 * Validates all required environment variables at startup
 * Prevents runtime crashes due to missing configuration
 *
 * Call validateAuthConfig() at app initialization
 */

import { logger } from '@/lib/logger';

/**
 * Required environment variables for authentication
 */
const REQUIRED_AUTH_ENV_VARS = [
  'KEYCLOAK_ISSUER',
  'KEYCLOAK_ID',
  'KEYCLOAK_SECRET',
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
    clientSecret: string;
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
 * Validate that all required environment variables are present
 * @throws Error if any required variable is missing
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
 * Validate KEYCLOAK_ISSUER format
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
 * Validate NEXTAUTH_URL format
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
 * Validate NEXTAUTH_SECRET length
 */
function validateNextAuthSecret(): void {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return;

  // NextAuth recommends at least 32 characters
  if (secret.length < 32) {
    logger.warn(
      `[Auth Config] Warning: NEXTAUTH_SECRET should be at least 32 characters long for security.\n` +
        `Current length: ${secret.length} characters.\n` +
        `Generate a secure secret: openssl rand -base64 32`
    );
  }
}

/**
 * Get validated auth configuration
 * Use this instead of directly accessing process.env
 */
export function getAuthConfig(): AuthConfig {
  // This assumes validateAuthConfig() was already called
  return {
    keycloak: {
      issuer: process.env.KEYCLOAK_ISSUER!,
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET!,
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
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running on server side
 */
export function isServer(): boolean {
  return globalThis.window === undefined;
}

/**
 * Safe environment variable getter with type safety
 */
export function getEnv(key: RequiredAuthEnvVar): string;
export function getEnv(key: OptionalAuthEnvVar): string | undefined;
export function getEnv(
  key: RequiredAuthEnvVar | OptionalAuthEnvVar
): string | undefined {
  return process.env[key];
}
