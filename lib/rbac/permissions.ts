/**
 * Role Utilities
 *
 * Functions for checking user roles. Permissions are now handled by
 * Backend API enforces fine-grained permissions.
 */

/**
 * Check if user has a specific role
 * Supports checking for single role or array of roles (OR logic)
 */
export function hasRole(
  userRoles: string[],
  required: string | string[]
): boolean {
  const requiredRoles = Array.isArray(required) ? required : [required];
  return requiredRoles.some((r) => userRoles.includes(r));
}

/**
 * Check if user has ALL specified roles (AND logic)
 */
export function hasAllRoles(userRoles: string[], required: string[]): boolean {
  return required.every((r) => userRoles.includes(r));
}
