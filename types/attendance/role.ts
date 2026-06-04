/**
 * types/attendance/role.ts
 *
 * Frontend role abstraction for attendance management. Rolls up backend
 * `OrgRole` values (PROJECT_MANAGER, SITE_MANAGER, HR_MANAGER, etc.) into a
 * three-tier hierarchy used by the attendance UI for dashboard switching and
 * permission gating.
 *
 * The enum + context interface live here (not in the consuming hook) so
 * pages and feature components can import them without pulling in the
 * `useAttendanceRole` runtime.
 */

export enum AttendanceRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export interface AttendanceRoleContext {
  /** Primary role for the user. */
  role: AttendanceRole;

  /** Quick boolean checks. */
  isEmployee: boolean;
  isManager: boolean;
  isAdmin: boolean;

  /** Available roles for this user (used for dashboard switching). */
  availableRoles: AttendanceRole[];

  /** Permission flags. */
  canApprove: boolean;
  canManageSettings: boolean;
  canViewAllProjects: boolean;
  canViewTeamAttendance: boolean;
  canViewOwnAttendance: boolean;
  canMarkAttendance: boolean;

  /** Loading state from the underlying authorization hook. */
  isLoading: boolean;
}
