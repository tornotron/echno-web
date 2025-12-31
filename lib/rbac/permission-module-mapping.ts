/**
 * Permission-to-Module Mapping
 *
 * Maps legacy Permission enum values to new Module + Action system
 * Enables backward compatibility during migration
 *
 * IMPORTANT: This is a TEMPORARY compatibility layer
 * New code should use the module-action system directly
 */

import { Permission } from '@/types/rbac/permission';
import { Module, ModuleAction } from '@/types/rbac/module';

/**
 * Maps a Permission to its equivalent Module + Action
 */
export interface PermissionModuleMapping {
  permission: Permission;
  module: Module;
  action: ModuleAction;
  /** Additional context for the mapping */
  context?: {
    /** Maps to "own only" context */
    ownOnly?: boolean;
    /** Maps to "all records" context */
    viewAll?: boolean;
  };
}

/**
 * Complete permission-to-module mapping
 * Each old permission maps to a module + action combination
 */
export const PERMISSION_MODULE_MAPPINGS: PermissionModuleMapping[] = [
  // ==================== User Management ====================
  {
    permission: Permission.USER_VIEW,
    module: Module.USER,
    action: 'view',
  },
  {
    permission: Permission.USER_CREATE,
    module: Module.USER,
    action: 'create',
  },
  {
    permission: Permission.USER_UPDATE,
    module: Module.USER,
    action: 'update',
  },
  {
    permission: Permission.USER_UPDATE_OWN,
    module: Module.USER,
    action: 'update',
    context: { ownOnly: true },
  },
  {
    permission: Permission.USER_DELETE,
    module: Module.USER,
    action: 'delete',
  },
  {
    permission: Permission.USER_MANAGE_ROLES,
    module: Module.ADMIN,
    action: 'assign',
  },
  {
    permission: Permission.USER_VIEW_ALL,
    module: Module.USER,
    action: 'view',
    context: { viewAll: true },
  },

  // ==================== Project Management ====================
  {
    permission: Permission.PROJECT_VIEW,
    module: Module.PROJECT,
    action: 'view',
  },
  {
    permission: Permission.PROJECT_VIEW_ALL,
    module: Module.PROJECT,
    action: 'view',
    context: { viewAll: true },
  },
  {
    permission: Permission.PROJECT_CREATE,
    module: Module.PROJECT,
    action: 'create',
  },
  {
    permission: Permission.PROJECT_UPDATE,
    module: Module.PROJECT,
    action: 'update',
  },
  {
    permission: Permission.PROJECT_DELETE,
    module: Module.PROJECT,
    action: 'delete',
  },
  {
    permission: Permission.PROJECT_MANAGE,
    module: Module.PROJECT,
    action: 'assign',
  },
  {
    permission: Permission.PROJECT_ASSIGN_MEMBERS,
    module: Module.PROJECT,
    action: 'assign',
  },

  // ==================== Task Management ====================
  {
    permission: Permission.TASK_VIEW,
    module: Module.TASK,
    action: 'view',
  },
  {
    permission: Permission.TASK_CREATE,
    module: Module.TASK,
    action: 'create',
  },
  {
    permission: Permission.TASK_UPDATE,
    module: Module.TASK,
    action: 'update',
  },
  {
    permission: Permission.TASK_DELETE,
    module: Module.TASK,
    action: 'delete',
  },
  {
    permission: Permission.TASK_ASSIGN,
    module: Module.TASK,
    action: 'assign',
  },

  // ==================== Issue Management ====================
  {
    permission: Permission.ISSUE_VIEW,
    module: Module.ISSUE,
    action: 'view',
  },
  {
    permission: Permission.ISSUE_CREATE,
    module: Module.ISSUE,
    action: 'create',
  },
  {
    permission: Permission.ISSUE_UPDATE,
    module: Module.ISSUE,
    action: 'update',
  },
  {
    permission: Permission.ISSUE_DELETE,
    module: Module.ISSUE,
    action: 'delete',
  },
  {
    permission: Permission.ISSUE_RESOLVE,
    module: Module.ISSUE,
    action: 'approve',
  },

  // ==================== Finance ====================
  {
    permission: Permission.FINANCE_VIEW,
    module: Module.FINANCE,
    action: 'view',
  },
  {
    permission: Permission.FINANCE_VIEW_ALL,
    module: Module.FINANCE,
    action: 'view',
    context: { viewAll: true },
  },
  {
    permission: Permission.FINANCE_CREATE,
    module: Module.FINANCE,
    action: 'create',
  },
  {
    permission: Permission.FINANCE_UPDATE,
    module: Module.FINANCE,
    action: 'update',
  },
  {
    permission: Permission.FINANCE_DELETE,
    module: Module.FINANCE,
    action: 'delete',
  },
  {
    permission: Permission.FINANCE_APPROVE,
    module: Module.FINANCE,
    action: 'approve',
  },
  {
    permission: Permission.FINANCE_MANAGE_BUDGET,
    module: Module.FINANCE,
    action: 'assign',
  },

  // Invoices
  {
    permission: Permission.INVOICE_VIEW,
    module: Module.INVOICE,
    action: 'view',
  },
  {
    permission: Permission.INVOICE_CREATE,
    module: Module.INVOICE,
    action: 'create',
  },
  {
    permission: Permission.INVOICE_UPDATE,
    module: Module.INVOICE,
    action: 'update',
  },
  {
    permission: Permission.INVOICE_DELETE,
    module: Module.INVOICE,
    action: 'delete',
  },
  {
    permission: Permission.INVOICE_APPROVE,
    module: Module.INVOICE,
    action: 'approve',
  },

  // Expenses
  {
    permission: Permission.EXPENSE_VIEW,
    module: Module.EXPENSE,
    action: 'view',
  },
  {
    permission: Permission.EXPENSE_CREATE,
    module: Module.EXPENSE,
    action: 'create',
  },
  {
    permission: Permission.EXPENSE_UPDATE,
    module: Module.EXPENSE,
    action: 'update',
  },
  {
    permission: Permission.EXPENSE_DELETE,
    module: Module.EXPENSE,
    action: 'delete',
  },
  {
    permission: Permission.EXPENSE_APPROVE,
    module: Module.EXPENSE,
    action: 'approve',
  },

  // ==================== Workforce Management ====================
  {
    permission: Permission.WORKFORCE_VIEW,
    module: Module.WORKFORCE,
    action: 'view',
  },
  {
    permission: Permission.WORKFORCE_VIEW_ALL,
    module: Module.WORKFORCE,
    action: 'view',
    context: { viewAll: true },
  },
  {
    permission: Permission.WORKFORCE_MANAGE,
    module: Module.WORKFORCE,
    action: 'assign',
  },

  // Employees
  {
    permission: Permission.EMPLOYEE_VIEW,
    module: Module.EMPLOYEE,
    action: 'view',
  },
  {
    permission: Permission.EMPLOYEE_CREATE,
    module: Module.EMPLOYEE,
    action: 'create',
  },
  {
    permission: Permission.EMPLOYEE_UPDATE,
    module: Module.EMPLOYEE,
    action: 'update',
  },
  {
    permission: Permission.EMPLOYEE_DELETE,
    module: Module.EMPLOYEE,
    action: 'delete',
  },

  // Attendance
  {
    permission: Permission.ATTENDANCE_VIEW,
    module: Module.ATTENDANCE,
    action: 'view',
  },
  {
    permission: Permission.ATTENDANCE_VIEW_ALL,
    module: Module.ATTENDANCE,
    action: 'view',
    context: { viewAll: true },
  },
  {
    permission: Permission.ATTENDANCE_MANAGE,
    module: Module.ATTENDANCE,
    action: 'update',
  },

  // Leaves
  {
    permission: Permission.LEAVE_VIEW,
    module: Module.LEAVE,
    action: 'view',
  },
  {
    permission: Permission.LEAVE_CREATE,
    module: Module.LEAVE,
    action: 'create',
  },
  {
    permission: Permission.LEAVE_UPDATE,
    module: Module.LEAVE,
    action: 'update',
  },
  {
    permission: Permission.LEAVE_APPROVE,
    module: Module.LEAVE,
    action: 'approve',
  },
  {
    permission: Permission.LEAVE_REJECT,
    module: Module.LEAVE,
    action: 'approve', // Mapped to approve with different result
  },

  // ==================== Resource Management ====================
  {
    permission: Permission.RESOURCE_VIEW,
    module: Module.RESOURCE,
    action: 'view',
  },
  {
    permission: Permission.RESOURCE_CREATE,
    module: Module.RESOURCE,
    action: 'create',
  },
  {
    permission: Permission.RESOURCE_UPDATE,
    module: Module.RESOURCE,
    action: 'update',
  },
  {
    permission: Permission.RESOURCE_DELETE,
    module: Module.RESOURCE,
    action: 'delete',
  },
  {
    permission: Permission.RESOURCE_ALLOCATE,
    module: Module.RESOURCE,
    action: 'assign',
  },

  // Inventory
  {
    permission: Permission.INVENTORY_VIEW,
    module: Module.INVENTORY,
    action: 'view',
  },
  {
    permission: Permission.INVENTORY_MANAGE,
    module: Module.INVENTORY,
    action: 'update',
  },

  // Assets
  {
    permission: Permission.ASSET_VIEW,
    module: Module.ASSET,
    action: 'view',
  },
  {
    permission: Permission.ASSET_CREATE,
    module: Module.ASSET,
    action: 'create',
  },
  {
    permission: Permission.ASSET_UPDATE,
    module: Module.ASSET,
    action: 'update',
  },
  {
    permission: Permission.ASSET_DELETE,
    module: Module.ASSET,
    action: 'delete',
  },

  // ==================== Inspection ====================
  {
    permission: Permission.INSPECTION_VIEW,
    module: Module.INSPECTION,
    action: 'view',
  },
  {
    permission: Permission.INSPECTION_CREATE,
    module: Module.INSPECTION,
    action: 'create',
  },
  {
    permission: Permission.INSPECTION_UPDATE,
    module: Module.INSPECTION,
    action: 'update',
  },
  {
    permission: Permission.INSPECTION_DELETE,
    module: Module.INSPECTION,
    action: 'delete',
  },
  {
    permission: Permission.INSPECTION_APPROVE,
    module: Module.INSPECTION,
    action: 'approve',
  },

  // ==================== Third Party Management ====================
  {
    permission: Permission.VENDOR_VIEW,
    module: Module.VENDOR,
    action: 'view',
  },
  {
    permission: Permission.VENDOR_CREATE,
    module: Module.VENDOR,
    action: 'create',
  },
  {
    permission: Permission.VENDOR_UPDATE,
    module: Module.VENDOR,
    action: 'update',
  },
  {
    permission: Permission.VENDOR_DELETE,
    module: Module.VENDOR,
    action: 'delete',
  },

  {
    permission: Permission.CONTRACTOR_VIEW,
    module: Module.CONTRACTOR,
    action: 'view',
  },
  {
    permission: Permission.CONTRACTOR_CREATE,
    module: Module.CONTRACTOR,
    action: 'create',
  },
  {
    permission: Permission.CONTRACTOR_UPDATE,
    module: Module.CONTRACTOR,
    action: 'update',
  },
  {
    permission: Permission.CONTRACTOR_DELETE,
    module: Module.CONTRACTOR,
    action: 'delete',
  },

  // ==================== Organization ====================
  {
    permission: Permission.ORGANIZATION_VIEW,
    module: Module.ORGANIZATION,
    action: 'view',
  },
  {
    permission: Permission.ORGANIZATION_UPDATE,
    module: Module.ORGANIZATION,
    action: 'update',
  },
  {
    permission: Permission.ORGANIZATION_MANAGE,
    module: Module.ORGANIZATION,
    action: 'assign',
  },

  // ==================== Reports & Analytics ====================
  {
    permission: Permission.REPORT_VIEW,
    module: Module.REPORT,
    action: 'view',
  },
  {
    permission: Permission.REPORT_CREATE,
    module: Module.REPORT,
    action: 'create',
  },
  {
    permission: Permission.REPORT_EXPORT,
    module: Module.REPORT,
    action: 'update',
  },
  {
    permission: Permission.ANALYTICS_VIEW,
    module: Module.ANALYTICS,
    action: 'view',
  },

  // ==================== System Administration ====================
  {
    permission: Permission.ADMIN_SUPER,
    module: Module.ADMIN,
    action: 'assign',
  },
  {
    permission: Permission.ADMIN_SETTINGS,
    module: Module.ADMIN,
    action: 'update',
  },
  {
    permission: Permission.ADMIN_USERS,
    module: Module.USER,
    action: 'assign',
  },
  {
    permission: Permission.ADMIN_ROLES,
    module: Module.ADMIN,
    action: 'assign',
  },
  {
    permission: Permission.ADMIN_AUDIT_LOG,
    module: Module.ADMIN,
    action: 'view',
  },
];

/**
 * Convert Permission to Module + Action
 */
export function permissionToModuleAction(permission: Permission): {
  module: Module;
  action: ModuleAction;
  context?: { ownOnly?: boolean; viewAll?: boolean };
} | null {
  const mapping = PERMISSION_MODULE_MAPPINGS.find(
    (m) => m.permission === permission
  );

  if (!mapping) {
    return null;
  }

  return {
    module: mapping.module,
    action: mapping.action,
    context: mapping.context,
  };
}

/**
 * Convert Module + Action to Permission (reverse mapping)
 * Note: This is lossy - multiple permissions may map to same module+action
 */
export function moduleActionToPermission(
  module: Module,
  action: ModuleAction
): Permission[] {
  return PERMISSION_MODULE_MAPPINGS.filter(
    (m) => m.module === module && m.action === action
  ).map((m) => m.permission);
}

/**
 * Get all permissions that map to a specific module
 */
export function getModulePermissions(module: Module): Permission[] {
  return PERMISSION_MODULE_MAPPINGS.filter((m) => m.module === module).map(
    (m) => m.permission
  );
}

/**
 * Get all modules that a set of permissions covers
 */
export function permissionsToModules(permissions: Permission[]): Module[] {
  const modules = new Set<Module>();

  for (const permission of permissions) {
    const mapping = permissionToModuleAction(permission);
    if (mapping) {
      modules.add(mapping.module);
    }
  }

  return [...modules];
}
