'use client';

import { useSession } from 'next-auth/react';
import { useEmployeeRoles } from '@/hooks/use-employee-roles';
import { isSystemAdmin as checkSystemAdmin } from '@/lib/rbac/role-utils';
import { hasRole, hasAllRoles } from '@/lib/rbac/permissions';

/**
 * Authorization hook for checking roles based on employee data.
 * Sources roles from employee.orgRoles + employee.isManager
 * instead of JWT/session data.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasRoles, isSystemAdmin, isManager } = useAuthorization();
 *
 *   if (isSystemAdmin) return <AdminPanel />;
 *   if (isManager) return <ManagerControls />;
 *   if (hasRoles(['HR_MANAGER'])) return <HRSection />;
 *
 *   return null;
 * }
 * ```
 */
export function useAuthorization() {
  const { status } = useSession();
  const {
    orgRoles,
    isManager,
    isLoading: employeeLoading,
    employee,
  } = useEmployeeRoles();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading' || employeeLoading;

  const isSystemAdmin = checkSystemAdmin(orgRoles);

  /**
   * Check if user has a specific role (or any role if array)
   * System admin always returns true
   */
  const checkRoles = (role: string | string[]): boolean => {
    if (!isAuthenticated) return false;
    if (isSystemAdmin) return true;
    return hasRole(orgRoles, role);
  };

  /**
   * Check if user has ALL specified roles (AND logic)
   * System admin always returns true
   */
  const hasEveryRole = (roles: string[]): boolean => {
    if (!isAuthenticated) return false;
    if (isSystemAdmin) return true;
    return hasAllRoles(orgRoles, roles);
  };

  return {
    // Role checks
    hasRoles: checkRoles,
    hasEveryRole,

    // Status checks
    isSystemAdmin,
    isManager,
    isAuthenticated,
    isLoading,

    // User data
    roles: orgRoles,
    employee,
  };
}

/**
 * Alias for useAuthorization for convenience
 */
export const usePermissions = useAuthorization;
