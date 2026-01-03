import { KeycloakResourcePermission } from './keycloak-resource-permission';

/**
 * Keycloak Token Interface
 *
 * Represents the structure of a Keycloak authentication token
 * including access and refresh tokens, expiration times, roles,
 * and resource-based permissions.
 * @example
 * {
 *  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *  expiresAt: 1625247600,
 *  sessionExpiresAt: 1625251200,
 *  error: undefined,
 *  roles: ["user", "admin"],
 *  resourcePermissions: [
 *    {
 *      rsname: "organization",
 *      rsid: "org-123",
 *      scopes: ["create", "read", "update", "delete"]
 *    }
 *  ]
 * }
 */

export interface KeycloakToken {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  sessionExpiresAt?: number; // When the Keycloak session (refresh token) expires
  error?: string;
  roles?: string[];
  resourcePermissions?: KeycloakResourcePermission[]; // Resource-based permissions from Keycloak Authorization Services
  [key: string]: unknown;
}
