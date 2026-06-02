/**
 * hooks/attendance/use-attendance-role.ts
 *
 * Attendance management role detection hook.
 * Uses role groups from OrgRole (adminRoles, managerRoles, etc.)
 * to determine the user's attendance management permissions.
 *
 * Role Priority: Admin > Manager > Employee
 */

import { useMemo } from 'react';
import { useAuthorization } from '@/hooks/use-authorization';

// ==================== Types ====================

export enum AttendanceRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export interface AttendanceRoleContext {
  /** Primary role for the user */
  role: AttendanceRole;

  /** Quick boolean checks */
  isEmployee: boolean;
  isManager: boolean;
  isAdmin: boolean;

  /** Available roles for this user (for dashboard switching) */
  availableRoles: AttendanceRole[];

  /** Permission flags */
  canApprove: boolean;
  canManageSettings: boolean;
  canViewAllProjects: boolean;
  canViewTeamAttendance: boolean;
  canViewOwnAttendance: boolean;
  canMarkAttendance: boolean;

  /** Loading state */
  isLoading: boolean;
}

// ==================== Hook ====================

export function useAttendanceRole(): AttendanceRoleContext {
  const { isAdmin, isManagerOrAbove, isLoading } = useAuthorization();

  const roleContext = useMemo<AttendanceRoleContext>(() => {
    const availableRoles: AttendanceRole[] = [AttendanceRole.EMPLOYEE];

    if (isManagerOrAbove) availableRoles.push(AttendanceRole.MANAGER);
    if (isAdmin) availableRoles.push(AttendanceRole.ADMIN);

    // Priority 1: Admin
    if (isAdmin) {
      return {
        role: AttendanceRole.ADMIN,
        isEmployee: true,
        isManager: true,
        isAdmin: true,
        availableRoles,
        canApprove: true,
        canManageSettings: true,
        canViewAllProjects: true,
        canViewTeamAttendance: true,
        canViewOwnAttendance: true,
        canMarkAttendance: true,
        isLoading,
      };
    }

    // Priority 2: Manager (PROJECT_MANAGER, SITE_MANAGER, HR_MANAGER)
    if (isManagerOrAbove) {
      return {
        role: AttendanceRole.MANAGER,
        isEmployee: true,
        isManager: true,
        isAdmin: false,
        availableRoles,
        canApprove: true,
        canManageSettings: false,
        canViewAllProjects: false,
        canViewTeamAttendance: true,
        canViewOwnAttendance: true,
        canMarkAttendance: true,
        isLoading,
      };
    }

    // Priority 3: Employee (default)
    return {
      role: AttendanceRole.EMPLOYEE,
      isEmployee: true,
      isManager: false,
      isAdmin: false,
      availableRoles,
      canApprove: false,
      canManageSettings: false,
      canViewAllProjects: false,
      canViewTeamAttendance: false,
      canViewOwnAttendance: true,
      canMarkAttendance: false,
      isLoading,
    };
  }, [isAdmin, isManagerOrAbove, isLoading]);

  return roleContext;
}
