import { OrgRole, isAdmin } from '@tornotron/echno-core/employee/types';

/**
 * Check if user has system admin role.
 * Kept for backward compatibility — prefer isAdmin() for broader admin checks.
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

// Re-export group checks for convenience
export {
  isAdmin,
  isManager,
  isSupervisor,
  isEngineer,
  isInspector,
  isManagerOrAbove,
  isSupervisorOrAbove,
} from '@tornotron/echno-core';
