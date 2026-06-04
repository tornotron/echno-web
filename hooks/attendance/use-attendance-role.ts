/**
 * hooks/attendance/use-attendance-role.ts
 *
 * Attendance management role detection hook. Resolves the user's effective
 * attendance role (admin / manager / employee) and the associated permission
 * flags from the authorization context.
 *
 * Role priority: Admin > Manager > Employee.
 *
 * Type definitions live in `@/types/attendance/role.ts` so pages can import
 * the enum and the return-shape interface without pulling in this hook's
 * runtime dependencies (see Milestone 10 — Type Extraction).
 */

import { useMemo } from 'react';
import { useAuthorization } from '@/hooks/use-authorization';
import { AttendanceRole, type AttendanceRoleContext } from '@/types/attendance';

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
