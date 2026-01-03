/**
 * Keycloak Authorization Services Types
 *
 * These types represent the resource-based authorization data
 * from Keycloak Authorization Services.
 */

/**
 * Resource permission from Keycloak Authorization Services
 *
 * Represents access to a specific resource with granted scopes.
 *
 * @example
 * {
 *   rsname: "organization",
 *   rsid: "org-123",
 *   scopes: ["create", "read", "update", "delete"]
 * }
 */
export interface KeycloakResourcePermission {
  /** Resource name (e.g., "organization", "project") */
  rsname: string;
  /** Resource ID (optional, for specific resource instances) */
  rsid?: string;
  /** Granted scopes for this resource (e.g., ["create", "read", "update", "delete"]) */
  scopes?: string[];
}
