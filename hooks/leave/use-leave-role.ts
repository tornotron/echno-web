/**
 * lib/hooks/use-leave-role.ts
 *
 * Leave management role detection hook.
 * Uses the role groups from OrgRole (adminRoles, managerRoles, etc.)
 * to determine user's leave management permissions.
 *
 * Role Priority: Admin > Manager > Employee
 */

import { useMemo } from 'react';
import { useAuthorization } from '@/hooks/use-authorization';

// ==================== Types ====================

/**
 * Leave management roles
 */
export enum LeaveRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

/**
 * Leave role context with permissions
 */
export interface LeaveRoleContext {
  /** Primary role for the user */
  role: LeaveRole;

  /** Quick boolean checks */
  isEmployee: boolean;
  isManager: boolean;
  isAdmin: boolean;

  /** Available roles for this user (for dashboard switching) */
  availableRoles: LeaveRole[];

  /** Permission flags */
  canApprove: boolean;
  canManagePolicies: boolean;
  canViewAllRequests: boolean;
  canViewTeamRequests: boolean;
  canViewOwnRequests: boolean;

  /** Loading state */
  isLoading: boolean;
}

// ==================== Hook ====================

/**
 * Hook to determine user's leave management role and permissions.
 * Uses role groups from useAuthorization (isAdmin, isManagerOrAbove, etc.).
 */
export function useLeaveRole(): LeaveRoleContext {
  const { isAdmin, isManagerOrAbove, isLoading } = useAuthorization();

  const roleContext = useMemo<LeaveRoleContext>(() => {
    const availableRoles: LeaveRole[] = [LeaveRole.EMPLOYEE];

    if (isManagerOrAbove) availableRoles.push(LeaveRole.MANAGER);
    if (isAdmin) availableRoles.push(LeaveRole.ADMIN);

    // Priority 1: Admin
    if (isAdmin) {
      return {
        role: LeaveRole.ADMIN,
        isEmployee: true,
        isManager: true,
        isAdmin: true,
        availableRoles,
        canApprove: true,
        canManagePolicies: true,
        canViewAllRequests: true,
        canViewTeamRequests: true,
        canViewOwnRequests: true,
        isLoading,
      };
    }

    // Priority 2: Manager (PROJECT_MANAGER, SITE_MANAGER, HR_MANAGER)
    if (isManagerOrAbove) {
      return {
        role: LeaveRole.MANAGER,
        isEmployee: true,
        isManager: true,
        isAdmin: false,
        availableRoles,
        canApprove: true,
        canManagePolicies: false,
        canViewAllRequests: false,
        canViewTeamRequests: true,
        canViewOwnRequests: true,
        isLoading,
      };
    }

    // Priority 3: Employee (default)
    return {
      role: LeaveRole.EMPLOYEE,
      isEmployee: true,
      isManager: false,
      isAdmin: false,
      availableRoles,
      canApprove: false,
      canManagePolicies: false,
      canViewAllRequests: false,
      canViewTeamRequests: false,
      canViewOwnRequests: true,
      isLoading,
    };
  }, [isAdmin, isManagerOrAbove, isLoading]);

  return roleContext;
}

/**
 * Helper to check if user has a specific role
 */
export function hasLeaveRole(
  context: LeaveRoleContext,
  role: LeaveRole
): boolean {
  return context.role === role;
}

/**
 * Helper to check if user has any of the specified roles
 */
export function hasAnyLeaveRole(
  context: LeaveRoleContext,
  roles: LeaveRole[]
): boolean {
  return roles.includes(context.role);
}
