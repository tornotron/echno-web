/**
 * types/leave/leave-role.ts
 *
 * Leave management role types and permissions.
 *
 * Defines the roles users can have in the leave management system
 * and their associated permissions.
 */

/**
 * Leave management roles
 *
 * Priority: ADMIN > MANAGER > EMPLOYEE
 */
export enum LeaveRole {
  /** Regular employee - can manage own leave */
  EMPLOYEE = 'employee',

  /** Manager - can approve team leave requests */
  MANAGER = 'manager',

  /** System admin - full access to policies and org-wide data */
  ADMIN = 'admin',
}

/**
 * Permission set for leave management
 */
export interface LeavePermissions {
  /** Can approve leave requests */
  canApprove: boolean;

  /** Can manage leave policies (create, update, delete) */
  canManagePolicies: boolean;

  /** Can view all requests in organization */
  canViewAllRequests: boolean;

  /** Can view team requests (subordinates) */
  canViewTeamRequests: boolean;

  /** Can view own requests */
  canViewOwnRequests: boolean;

  /** Can adjust leave balances manually */
  canAdjustBalances: boolean;

  /** Can export leave data/reports */
  canExportReports: boolean;

  /** Can view organization analytics */
  canViewAnalytics: boolean;
}

/**
 * Default permissions for each role
 */
export const ROLE_PERMISSIONS: Record<LeaveRole, LeavePermissions> = {
  [LeaveRole.EMPLOYEE]: {
    canApprove: false,
    canManagePolicies: false,
    canViewAllRequests: false,
    canViewTeamRequests: false,
    canViewOwnRequests: true,
    canAdjustBalances: false,
    canExportReports: false,
    canViewAnalytics: false,
  },

  [LeaveRole.MANAGER]: {
    canApprove: true,
    canManagePolicies: false,
    canViewAllRequests: false,
    canViewTeamRequests: true,
    canViewOwnRequests: true,
    canAdjustBalances: false,
    canExportReports: true,
    canViewAnalytics: false,
  },

  [LeaveRole.ADMIN]: {
    canApprove: true,
    canManagePolicies: true,
    canViewAllRequests: true,
    canViewTeamRequests: true,
    canViewOwnRequests: true,
    canAdjustBalances: true,
    canExportReports: true,
    canViewAnalytics: true,
  },
};

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(role: LeaveRole): LeavePermissions {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: LeaveRole,
  permission: keyof LeavePermissions
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}
