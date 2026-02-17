import { OrgRole } from '@/types/employee';

/**
 * Check if user has system admin role
 */
export function isSystemAdmin(roles: string[] | undefined): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.includes(OrgRole.SYSTEM_ADMIN);
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
