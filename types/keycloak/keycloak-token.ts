import { KeycloakResourcePermission } from './keycloak-resource-permission';

/**
 * Keycloak Token Interface
 *
 * Represents the structure of a Keycloak authentication token
 * including access and refresh tokens, expiration times, roles,
 * groups, and resource-based permissions.
 *
 * @example
 * {
 *   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   expiresAt: 1625247600,
 *   sessionExpiresAt: 1625251200,
 *   error: undefined,
 *   roles: ["hr-manager", "project-manager"],
 *   groups: ["/management", "/hr"],
 *   resourcePermissions: [
 *     {
 *       rsname: "organization",
 *       rsid: "org-123",
 *       scopes: ["create", "read", "update", "delete"]
 *     }
 *   ]
 * }
 */
export interface KeycloakToken {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  sessionExpiresAt?: number; // When the Keycloak session (refresh token) expires
  lastRefresh?: number;
  error?: string;

  // Roles from realm_access and resource_access combined
  roles?: string[];

  // Groups from Keycloak Groups feature
  // Normalized to remove leading slash (e.g., "management" not "/management")
  groups?: string[];

  // Resource-based permissions from Keycloak Authorization Services
  resourcePermissions?: KeycloakResourcePermission[];

  // Allow additional properties for JWT compatibility
  [key: string]: unknown;
}
