import { Permission } from '@/types/rbac/permission';
import { SYSTEM_ROLES } from '@/types/rbac/role';
import {
  UserPermissionGrant,
  PermissionCheckContext,
  grantMatchesContext,
  isGrantValid,
} from '@/types/rbac/user-permission';

/**
 * Role-to-Permission Mapping
 * Defines what permissions each role has
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // ==================== SUPER ADMIN ====================
  // Has ALL permissions
  [SYSTEM_ROLES.SUPER_ADMIN]: Object.values(Permission),

  // ==================== PROJECT MANAGER ====================
  [SYSTEM_ROLES.PROJECT_MANAGER]: [
    // Projects - Full access
    Permission.PROJECT_VIEW,
    Permission.PROJECT_VIEW_ALL,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_MANAGE,
    Permission.PROJECT_ASSIGN_MEMBERS,

    // Tasks - Full access
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,

    // Issues
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.ISSUE_UPDATE,
    Permission.ISSUE_RESOLVE,

    // Users - View only
    Permission.USER_VIEW,
    Permission.USER_VIEW_ALL,
    Permission.USER_UPDATE_OWN,

    // Finance - View and create
    Permission.FINANCE_VIEW,
    Permission.FINANCE_VIEW_ALL,
    Permission.FINANCE_CREATE,
    Permission.EXPENSE_VIEW,
    Permission.EXPENSE_CREATE,

    // Workforce
    Permission.WORKFORCE_VIEW,
    Permission.WORKFORCE_VIEW_ALL,
    Permission.WORKFORCE_MANAGE,
    Permission.ATTENDANCE_VIEW_ALL,
    Permission.LEAVE_VIEW,
    Permission.LEAVE_APPROVE,

    // Resources
    Permission.RESOURCE_VIEW,
    Permission.RESOURCE_CREATE,
    Permission.RESOURCE_ALLOCATE,
    Permission.INVENTORY_VIEW,

    // Reports
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.REPORT_EXPORT,
    Permission.ANALYTICS_VIEW,

    // Inspections
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_APPROVE,
  ],

  // ==================== SITE MANAGER ====================
  [SYSTEM_ROLES.SITE_MANAGER]: [
    // Projects
    Permission.PROJECT_VIEW,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_ASSIGN_MEMBERS,

    // Tasks
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_ASSIGN,

    // Issues
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.ISSUE_UPDATE,
    Permission.ISSUE_RESOLVE,

    // Workforce
    Permission.WORKFORCE_VIEW,
    Permission.WORKFORCE_MANAGE,
    Permission.EMPLOYEE_VIEW,
    Permission.ATTENDANCE_VIEW_ALL,
    Permission.ATTENDANCE_MANAGE,
    Permission.LEAVE_VIEW,
    Permission.LEAVE_APPROVE,

    // Resources
    Permission.RESOURCE_VIEW,
    Permission.RESOURCE_ALLOCATE,
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_MANAGE,

    // Inspections
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_UPDATE,

    // Users
    Permission.USER_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  // ==================== HR MANAGER ====================
  [SYSTEM_ROLES.HR_MANAGER]: [
    // Users - Full access except role management
    Permission.USER_VIEW,
    Permission.USER_VIEW_ALL,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_UPDATE_OWN,

    // Workforce - Full access
    Permission.WORKFORCE_VIEW,
    Permission.WORKFORCE_VIEW_ALL,
    Permission.WORKFORCE_MANAGE,

    // Employees - Full access
    Permission.EMPLOYEE_VIEW,
    Permission.EMPLOYEE_CREATE,
    Permission.EMPLOYEE_UPDATE,
    Permission.EMPLOYEE_DELETE,

    // Attendance
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_VIEW_ALL,
    Permission.ATTENDANCE_MANAGE,

    // Leaves - Full access
    Permission.LEAVE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.LEAVE_UPDATE,
    Permission.LEAVE_APPROVE,
    Permission.LEAVE_REJECT,

    // Reports
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.REPORT_EXPORT,

    // Projects - View only
    Permission.PROJECT_VIEW,
  ],

  // ==================== ACCOUNTANT ====================
  [SYSTEM_ROLES.ACCOUNTANT]: [
    // Finance - Full access
    Permission.FINANCE_VIEW,
    Permission.FINANCE_VIEW_ALL,
    Permission.FINANCE_CREATE,
    Permission.FINANCE_UPDATE,
    Permission.FINANCE_DELETE,
    Permission.FINANCE_APPROVE,
    Permission.FINANCE_MANAGE_BUDGET,

    // Invoices
    Permission.INVOICE_VIEW,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_DELETE,
    Permission.INVOICE_APPROVE,

    // Expenses
    Permission.EXPENSE_VIEW,
    Permission.EXPENSE_CREATE,
    Permission.EXPENSE_UPDATE,
    Permission.EXPENSE_DELETE,
    Permission.EXPENSE_APPROVE,

    // Reports
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.REPORT_EXPORT,
    Permission.ANALYTICS_VIEW,

    // Projects - View only
    Permission.PROJECT_VIEW,
    Permission.PROJECT_VIEW_ALL,

    // Users - View only
    Permission.USER_VIEW,
    Permission.USER_UPDATE_OWN,

    // Vendors
    Permission.VENDOR_VIEW,
    Permission.VENDOR_CREATE,
    Permission.VENDOR_UPDATE,
  ],

  // ==================== ENGINEERS ====================
  [SYSTEM_ROLES.CIVIL_ENGINEER]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.ISSUE_UPDATE,
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_UPDATE,
    Permission.RESOURCE_VIEW,
    Permission.REPORT_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.SITE_ENGINEER]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.ISSUE_UPDATE,
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_UPDATE,
    Permission.RESOURCE_VIEW,
    Permission.RESOURCE_ALLOCATE,
    Permission.WORKFORCE_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.REPORT_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.STRUCTURAL_ENGINEER]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.REPORT_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.ARCHITECT]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.INSPECTION_VIEW,
    Permission.REPORT_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.PLANNING_ENGINEER]: [
    Permission.PROJECT_VIEW,
    Permission.PROJECT_VIEW_ALL,
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.RESOURCE_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  // ==================== SUPERVISORY ====================
  [SYSTEM_ROLES.SUPERVISOR]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.WORKFORCE_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_MANAGE,
    Permission.RESOURCE_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.FOREMAN]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.WORKFORCE_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.RESOURCE_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.SAFETY_OFFICER]: [
    Permission.PROJECT_VIEW,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.ISSUE_UPDATE,
    Permission.INSPECTION_VIEW,
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_UPDATE,
    Permission.INSPECTION_APPROVE,
    Permission.WORKFORCE_VIEW,
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  // ==================== PROCUREMENT & ADMIN ====================
  [SYSTEM_ROLES.QUANTITY_SURVEYOR]: [
    Permission.PROJECT_VIEW,
    Permission.FINANCE_VIEW,
    Permission.FINANCE_CREATE,
    Permission.RESOURCE_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.VENDOR_VIEW,
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.PROCUREMENT_OFFICER]: [
    Permission.RESOURCE_VIEW,
    Permission.RESOURCE_CREATE,
    Permission.RESOURCE_UPDATE,
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_MANAGE,
    Permission.VENDOR_VIEW,
    Permission.VENDOR_CREATE,
    Permission.VENDOR_UPDATE,
    Permission.EXPENSE_VIEW,
    Permission.EXPENSE_CREATE,
    Permission.REPORT_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.ADMIN_STAFF]: [
    Permission.USER_VIEW,
    Permission.PROJECT_VIEW,
    Permission.REPORT_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.DOCUMENT_CONTROLLER]: [
    Permission.PROJECT_VIEW,
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  // ==================== SKILLED WORKERS ====================
  [SYSTEM_ROLES.ELECTRICIAN]: [
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.RESOURCE_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.PLUMBER]: [
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.RESOURCE_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.CARPENTER]: [
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.RESOURCE_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.MASON]: [
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.RESOURCE_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.WELDER]: [
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.RESOURCE_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.PAINTER]: [
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.SCAFFOLDER]: [
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.RESOURCE_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  // ==================== EQUIPMENT OPERATORS ====================
  [SYSTEM_ROLES.EQUIPMENT_OPERATOR]: [
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.RESOURCE_VIEW,
    Permission.ASSET_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.CRANE_OPERATOR]: [
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.RESOURCE_VIEW,
    Permission.ASSET_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.DRIVER]: [
    Permission.TASK_VIEW,
    Permission.RESOURCE_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  // ==================== GENERAL WORKERS ====================
  [SYSTEM_ROLES.LABORER]: [
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.HELPER]: [
    Permission.TASK_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.SITE_CLEANER]: [
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.SECURITY_GUARD]: [
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  // ==================== THIRD PARTY ====================
  [SYSTEM_ROLES.CONTRACTOR]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.REPORT_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.SUBCONTRACTOR]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.VENDOR]: [
    Permission.RESOURCE_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.CONSULTANT]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.REPORT_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.CLIENT]: [
    Permission.PROJECT_VIEW,
    Permission.REPORT_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  // ==================== TRAINEES ====================
  [SYSTEM_ROLES.STUDENT]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.INTERN]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.ISSUE_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.TRAINEE]: [
    Permission.TASK_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  // ==================== OFFICE SUPPORT ====================
  [SYSTEM_ROLES.RECEPTIONIST]: [
    Permission.USER_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_VIEW,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.IT_SUPPORT]: [
    Permission.USER_VIEW,
    Permission.PROJECT_VIEW,
    Permission.ISSUE_VIEW,
    Permission.ISSUE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],

  [SYSTEM_ROLES.OFFICE_ASSISTANT]: [
    Permission.USER_VIEW,
    Permission.PROJECT_VIEW,
    Permission.ATTENDANCE_VIEW,
    Permission.LEAVE_CREATE,
    Permission.USER_UPDATE_OWN,
  ],
};

/**
 * Get all permissions for given roles
 * Automatically deduplicates permissions if user has multiple roles
 */
export function getRolePermissions(roles: string[]): Permission[] {
  const permissionSet = new Set<Permission>();

  for (const roleId of roles) {
    const permissions = ROLE_PERMISSIONS[roleId] || [];
    for (const p of permissions) permissionSet.add(p);
  }

  return [...permissionSet];
}

/**
 * Check if user has a specific permission
 * Supports checking for single permission or array of permissions (AND logic)
 */
export function hasPermission(
  userPermissions: Permission[],
  required: Permission | Permission[]
): boolean {
  const requiredPerms = Array.isArray(required) ? required : [required];
  return requiredPerms.every((p) => userPermissions.includes(p));
}

/**
 * Check if user has ANY of the specified permissions (OR logic)
 */
export function hasAnyPermission(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.some((p) => userPermissions.includes(p));
}

/**
 * Check if user has a specific role
 * Supports checking for single role or array of roles (OR logic)
 */
export function hasRole(
  userRoles: string[],
  required: string | string[]
): boolean {
  const requiredRoles = Array.isArray(required) ? required : [required];
  return requiredRoles.some((r) => userRoles.includes(r));
}

/**
 * Check if user has ALL specified roles (AND logic)
 */
export function hasAllRoles(userRoles: string[], required: string[]): boolean {
  return required.every((r) => userRoles.includes(r));
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(userRoles: string[]): boolean {
  return userRoles.includes(SYSTEM_ROLES.SUPER_ADMIN);
}

// ==================== USER PERMISSION GRANTS ====================
// Functions for handling user-specific permission grants that work
// additively with role-based permissions

/**
 * Get all permissions from user-specific grants
 * Filters grants based on validity and optional context
 */
export function getPermissionsFromGrants(
  grants: UserPermissionGrant[],
  context?: PermissionCheckContext
): Permission[] {
  const permissionSet = new Set<Permission>();

  for (const grant of grants) {
    // If context provided, check if grant matches context
    // If no context, we just check validity
    if (context) {
      // Check for each permission in context
      if (grantMatchesContext(grant, grant.permission, context)) {
        permissionSet.add(grant.permission);
      }
    } else {
      // No context - just check if grant is valid
      if (isGrantValid(grant)) {
        permissionSet.add(grant.permission);
      }
    }
  }

  return [...permissionSet];
}

/**
 * Get all permissions for a user including both role-based and user-specific grants
 * This is the primary function for getting a user's complete permission set
 *
 * @param userRoles - Array of role IDs the user has
 * @param permissionGrants - User-specific permission grants
 * @param context - Optional context for scoped grant checking
 * @returns Combined array of all permissions (deduplicated)
 */
export function getUserPermissionsWithGrants(
  userRoles: string[],
  permissionGrants: UserPermissionGrant[] = [],
  context?: PermissionCheckContext
): Permission[] {
  // Get role-based permissions
  const rolePermissions = getRolePermissions(userRoles);

  // Get permissions from user-specific grants
  const grantPermissions = getPermissionsFromGrants(permissionGrants, context);

  // Combine and deduplicate
  const allPermissions = new Set<Permission>([
    ...rolePermissions,
    ...grantPermissions,
  ]);

  return [...allPermissions];
}

/**
 * Check if user has a specific permission (considering both roles and grants)
 * Supports checking for single permission or array of permissions (AND logic)
 *
 * @param userRoles - Array of role IDs the user has
 * @param permissionGrants - User-specific permission grants
 * @param required - Permission(s) to check for
 * @param context - Optional context for scoped grant checking
 * @returns true if user has all required permissions
 */
export function hasPermissionWithGrants(
  userRoles: string[],
  permissionGrants: UserPermissionGrant[] = [],
  required: Permission | Permission[],
  context?: PermissionCheckContext
): boolean {
  const userPermissions = getUserPermissionsWithGrants(
    userRoles,
    permissionGrants,
    context
  );
  return hasPermission(userPermissions, required);
}

/**
 * Check if user has ANY of the specified permissions (OR logic)
 * Considers both role-based permissions and user-specific grants
 *
 * @param userRoles - Array of role IDs the user has
 * @param permissionGrants - User-specific permission grants
 * @param required - Array of permissions to check (OR logic)
 * @param context - Optional context for scoped grant checking
 * @returns true if user has at least one of the required permissions
 */
export function hasAnyPermissionWithGrants(
  userRoles: string[],
  permissionGrants: UserPermissionGrant[] = [],
  required: Permission[],
  context?: PermissionCheckContext
): boolean {
  const userPermissions = getUserPermissionsWithGrants(
    userRoles,
    permissionGrants,
    context
  );
  return hasAnyPermission(userPermissions, required);
}

/**
 * Check if a specific permission comes from a user grant (not role)
 * Useful for UI to indicate which permissions are granted beyond role
 *
 * @param permissionGrants - User-specific permission grants
 * @param permission - Permission to check
 * @param context - Optional context for scoped grant checking
 * @returns true if permission is granted via user-specific grant
 */
export function isPermissionFromGrant(
  permissionGrants: UserPermissionGrant[],
  permission: Permission,
  context?: PermissionCheckContext
): boolean {
  const grantPermissions = getPermissionsFromGrants(permissionGrants, context);
  return grantPermissions.includes(permission);
}

/**
 * Get breakdown of where each permission comes from
 * Useful for admin UI showing permission sources
 *
 * @param userRoles - Array of role IDs the user has
 * @param permissionGrants - User-specific permission grants
 * @param context - Optional context for scoped grant checking
 * @returns Object mapping permissions to their sources
 */
export function getPermissionSources(
  userRoles: string[],
  permissionGrants: UserPermissionGrant[] = [],
  context?: PermissionCheckContext
): Record<Permission, { fromRoles: boolean; fromGrants: boolean }> {
  const rolePermissions = getRolePermissions(userRoles);
  const grantPermissions = getPermissionsFromGrants(permissionGrants, context);

  const sources: Record<string, { fromRoles: boolean; fromGrants: boolean }> =
    {};

  // Mark role permissions
  for (const perm of rolePermissions) {
    sources[perm] = { fromRoles: true, fromGrants: false };
  }

  // Mark grant permissions
  for (const perm of grantPermissions) {
    if (sources[perm]) {
      sources[perm].fromGrants = true;
    } else {
      sources[perm] = { fromRoles: false, fromGrants: true };
    }
  }

  return sources as Record<
    Permission,
    { fromRoles: boolean; fromGrants: boolean }
  >;
}
