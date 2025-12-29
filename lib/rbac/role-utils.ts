import { SYSTEM_ROLES } from '@/types/rbac/role';

/**
 * Check if user has super admin role
 */
export function isSuperAdmin(roles: string[] | undefined): boolean {
  return roles?.includes(SYSTEM_ROLES.SUPER_ADMIN) || false;
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
