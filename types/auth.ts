/**
 * Authentication Type Definitions
 *
 * Centralized type definitions for authentication system
 */

/**
 * Supported authentication providers
 */
export type AuthProvider = 'keycloak';

/**
 * Session error types
 * These errors indicate issues with the session that require user action
 */
export type SessionError = 'RefreshAccessTokenError' | 'SessionRevoked';

/**
 * Session metadata interface
 */
export interface SessionMetadata {
  /** Authentication provider used for this session */
  provider?: AuthProvider;

  /** Session expiration timestamp (milliseconds since epoch) */
  expiresAt?: number;

  /** Keycloak session ID for backchannel logout */
  sessionId?: string | unknown;

  /** Session error if any */
  error?: SessionError;
}

/**
 * Extended user data in session
 */
export interface SessionUser {
  /** User ID */
  id: string;

  /** User email */
  email?: string;

  /** User display name */
  name?: string;

  /** User roles from Keycloak */
  roles?: string[];
}

/**
 * Type guard to check if a value is a valid SessionError
 */
export function isSessionError(value: unknown): value is SessionError {
  return value === 'RefreshAccessTokenError' || value === 'SessionRevoked';
}

/**
 * Type guard to check if a value is a valid AuthProvider
 */
export function isAuthProvider(value: unknown): value is AuthProvider {
  return value === 'keycloak';
}
