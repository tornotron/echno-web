/**
 * Keycloak Token Interface
 *
 * Represents the structure of a Keycloak authentication token
 * including access and refresh tokens and expiration times.
 * Roles and permissions are no longer stored in the token —
 * they come from the employee object via the backend API.
 */
export interface KeycloakToken {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  sessionExpiresAt?: number;
  lastRefresh?: number;
  error?: string;

  // Allow additional properties for JWT compatibility
  [key: string]: unknown;
}
