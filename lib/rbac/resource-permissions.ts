import type { KeycloakResourcePermission } from '@/types/keycloak';

/**
 * Resource Permission Utilities
 *
 * Functions for working with Keycloak Authorization Services permissions.
 * These permissions are fine-grained, resource-based access controls
 * that come from the `authorization.permissions` claim in the Keycloak token.
 *
 * Resource permissions follow the pattern:
 * - rsname: resource name (e.g., "project", "organization", "invoice")
 * - rsid: resource ID (optional, for specific instances)
 * - scopes: array of allowed actions (e.g., ["read", "create", "update", "delete"])
 */

/**
 * Common resource scopes used in Keycloak Authorization Services
 */
export const RESOURCE_SCOPES = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  APPROVE: 'approve',
  ASSIGN: 'assign',
  VIEW_ALL: 'view-all',
} as const;

export type ResourceScope =
  (typeof RESOURCE_SCOPES)[keyof typeof RESOURCE_SCOPES];

/**
 * Common resource names used in the application
 */
export const RESOURCES = {
  // Core resources
  ORGANIZATION: 'organization',
  PROJECT: 'project',
  TASK: 'task',

  // Workforce
  USER: 'user',
  EMPLOYEE: 'employee',
  ATTENDANCE: 'attendance',
  LEAVE: 'leave',

  // Finance
  INVOICE: 'invoice',
  EXPENSE: 'expense',
  BUDGET: 'budget',

  // Operations
  RESOURCE: 'resource',
  INVENTORY: 'inventory',
  ASSET: 'asset',

  // Third party
  VENDOR: 'vendor',
  CONTRACT: 'contract',

  // Reporting
  REPORT: 'report',
  ANALYTICS: 'analytics',

  // Default resource (catch-all)
  DEFAULT: 'Default Resource',
} as const;

export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];

/**
 * Check if user has a specific scope on a resource
 *
 * @param resourcePermissions - User's resource permissions from session
 * @param resource - Resource name to check
 * @param scope - Scope/action to check for
 * @returns True if user has the scope on the resource
 */
export function hasResourcePermission(
  resourcePermissions: KeycloakResourcePermission[],
  resource: string,
  scope: string
): boolean {
  const permission = resourcePermissions.find(
    (p) => p.rsname.toLowerCase() === resource.toLowerCase()
  );

  if (!permission) {
    return false;
  }

  // If no scopes defined, treat as full access to the resource
  if (!permission.scopes || permission.scopes.length === 0) {
    return true;
  }

  return permission.scopes.includes(scope);
}

/**
 * Check if user has any of the specified scopes on a resource
 *
 * @param resourcePermissions - User's resource permissions from session
 * @param resource - Resource name to check
 * @param scopes - Array of scopes to check (OR logic)
 * @returns True if user has any of the scopes
 */
export function hasAnyResourceScope(
  resourcePermissions: KeycloakResourcePermission[],
  resource: string,
  scopes: string[]
): boolean {
  return scopes.some((scope) =>
    hasResourcePermission(resourcePermissions, resource, scope)
  );
}

/**
 * Check if user has all specified scopes on a resource
 *
 * @param resourcePermissions - User's resource permissions from session
 * @param resource - Resource name to check
 * @param scopes - Array of scopes to check (AND logic)
 * @returns True if user has all the scopes
 */
export function hasAllResourceScopes(
  resourcePermissions: KeycloakResourcePermission[],
  resource: string,
  scopes: string[]
): boolean {
  return scopes.every((scope) =>
    hasResourcePermission(resourcePermissions, resource, scope)
  );
}

/**
 * Check if user has access to a resource (any scope)
 *
 * @param resourcePermissions - User's resource permissions from session
 * @param resource - Resource name to check
 * @returns True if user has any access to the resource
 */
export function hasResourceAccess(
  resourcePermissions: KeycloakResourcePermission[],
  resource: string
): boolean {
  return resourcePermissions.some(
    (p) => p.rsname.toLowerCase() === resource.toLowerCase()
  );
}

/**
 * Get all scopes a user has on a specific resource
 *
 * @param resourcePermissions - User's resource permissions from session
 * @param resource - Resource name to check
 * @returns Array of scopes, empty if no access
 */
export function getResourceScopes(
  resourcePermissions: KeycloakResourcePermission[],
  resource: string
): string[] {
  const permission = resourcePermissions.find(
    (p) => p.rsname.toLowerCase() === resource.toLowerCase()
  );

  if (!permission) {
    return [];
  }

  return permission.scopes || [];
}

/**
 * Get all resources the user has access to
 *
 * @param resourcePermissions - User's resource permissions from session
 * @returns Array of resource names
 */
export function getAccessibleResources(
  resourcePermissions: KeycloakResourcePermission[]
): string[] {
  return resourcePermissions.map((p) => p.rsname);
}

/**
 * Check if user can perform CRUD operations on a resource
 * Convenience functions for common permission checks
 */
export const resourceCan = {
  read: (permissions: KeycloakResourcePermission[], resource: string) =>
    hasResourcePermission(permissions, resource, RESOURCE_SCOPES.READ),

  create: (permissions: KeycloakResourcePermission[], resource: string) =>
    hasResourcePermission(permissions, resource, RESOURCE_SCOPES.CREATE),

  update: (permissions: KeycloakResourcePermission[], resource: string) =>
    hasResourcePermission(permissions, resource, RESOURCE_SCOPES.UPDATE),

  delete: (permissions: KeycloakResourcePermission[], resource: string) =>
    hasResourcePermission(permissions, resource, RESOURCE_SCOPES.DELETE),

  manage: (permissions: KeycloakResourcePermission[], resource: string) =>
    hasResourcePermission(permissions, resource, RESOURCE_SCOPES.MANAGE),

  approve: (permissions: KeycloakResourcePermission[], resource: string) =>
    hasResourcePermission(permissions, resource, RESOURCE_SCOPES.APPROVE),
};

/**
 * Check if user has a specific permission on a specific resource instance
 *
 * @param resourcePermissions - User's resource permissions from session
 * @param resource - Resource name
 * @param resourceId - Specific resource instance ID
 * @param scope - Scope to check
 * @returns True if user has the scope on the specific instance
 */
export function hasInstancePermission(
  resourcePermissions: KeycloakResourcePermission[],
  resource: string,
  resourceId: string,
  scope: string
): boolean {
  // First check for instance-specific permission
  const instancePermission = resourcePermissions.find(
    (p) =>
      p.rsname.toLowerCase() === resource.toLowerCase() && p.rsid === resourceId
  );

  if (instancePermission) {
    if (!instancePermission.scopes || instancePermission.scopes.length === 0) {
      return true;
    }
    return instancePermission.scopes.includes(scope);
  }

  // Fall back to resource-level permission (without rsid)
  return hasResourcePermission(resourcePermissions, resource, scope);
}

/**
 * Build a permission string in resource:scope format
 * Useful for consistent permission naming
 *
 * @param resource - Resource name
 * @param scope - Scope name
 * @returns Formatted permission string
 */
export function buildPermissionString(resource: string, scope: string): string {
  return `${resource}:${scope}`;
}

/**
 * Parse a permission string in resource:scope format
 *
 * @param permissionString - Permission string like "project:read"
 * @returns Object with resource and scope, or null if invalid
 */
export function parsePermissionString(
  permissionString: string
): { resource: string; scope: string } | null {
  const parts = permissionString.split(':');
  if (parts.length !== 2) {
    return null;
  }
  return { resource: parts[0], scope: parts[1] };
}
