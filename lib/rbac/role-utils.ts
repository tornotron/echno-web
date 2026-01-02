import { SYSTEM_ROLES } from '@/types/rbac/role';

/**
 * Check if user has super admin role
 * Handles both formats: 'super-admin' and 'SUPER_ADMIN'
 */
export function isSuperAdmin(roles: string[] | undefined): boolean {
  if (!roles || roles.length === 0) return false;

  // Check for exact match with SYSTEM_ROLES.SUPER_ADMIN
  if (roles.includes(SYSTEM_ROLES.SUPER_ADMIN)) return true;

  // Also check for uppercase format that Keycloak might send
  if (roles.includes('SUPER_ADMIN')) return true;

  // Check case-insensitive
  const normalizedRoles = new Set(roles.map((r) => r.toLowerCase()));
  return (
    normalizedRoles.has('super-admin') || normalizedRoles.has('super_admin')
  );
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(
  userRoles: string[] | undefined,
  roles: string[]
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return roles.some((role) => userRoles.includes(role));
}
