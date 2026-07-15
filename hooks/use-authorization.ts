'use client';

import { useSession } from 'next-auth/react';
import { useEmployeeRoles } from '@tornotron/echno-core/employee/hooks';
import {
  isSystemAdmin as checkSystemAdmin,
  isAdmin as checkAdmin,
  isManager as checkManager,
  isSupervisor as checkSupervisor,
  isEngineer as checkEngineer,
  isInspector as checkInspector,
  isManagerOrAbove as checkManagerOrAbove,
  isSupervisorOrAbove as checkSupervisorOrAbove,
} from '@/lib/rbac/role-utils';
import { hasRole, hasAllRoles } from '@/lib/rbac/permissions';

/**
 * Authorization hook for checking roles based on employee data.
 * Sources roles from employee.orgRoles instead of JWT/session data.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAdmin, isManager, isSupervisorOrAbove } = useAuthorization();
 *
 *   if (isAdmin) return <AdminPanel />;
 *   if (isManager) return <ManagerControls />;
 *   if (isSupervisorOrAbove) return <SupervisorView />;
 *
 *   return <EmployeeView />;
 * }
 * ```
 */
export function useAuthorization() {
  const { status } = useSession();
  const { orgRoles, isLoading: employeeLoading, employee } = useEmployeeRoles();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading' || employeeLoading;

  // Role group checks
  const isSystemAdmin = checkSystemAdmin(orgRoles);
  const isAdmin = checkAdmin(orgRoles);
  const isManager = checkManager(orgRoles);
  const isSupervisor = checkSupervisor(orgRoles);
  const isEngineer = checkEngineer(orgRoles);
  const isInspector = checkInspector(orgRoles);
  const isManagerOrAbove = checkManagerOrAbove(orgRoles);
  const isSupervisorOrAbove = checkSupervisorOrAbove(orgRoles);

  /**
   * Check if user has a specific role (or any role if array)
   * Admin always returns true
   */
  const checkRoles = (role: string | string[]): boolean => {
    if (!isAuthenticated) return false;
    if (isAdmin) return true;
    return hasRole(orgRoles, role);
  };

  /**
   * Check if user has ALL specified roles (AND logic)
   * Admin always returns true
   */
  const hasEveryRole = (roles: string[]): boolean => {
    if (!isAuthenticated) return false;
    if (isAdmin) return true;
    return hasAllRoles(orgRoles, roles);
  };

  return {
    // Role checks
    hasRoles: checkRoles,
    hasEveryRole,

    // Role group checks
    isSystemAdmin,
    isAdmin,
    isManager,
    isSupervisor,
    isEngineer,
    isInspector,
    isManagerOrAbove,
    isSupervisorOrAbove,

    // Status
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
