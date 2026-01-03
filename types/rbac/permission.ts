/**
 * Granular permissions for RBAC system
 * Format: resource:action
 */
export enum Permission {
  // ==================== User Management ====================
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_UPDATE_OWN = 'user:update_own',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',
  USER_VIEW_ALL = 'user:view_all',

  // ==================== Project Management ====================
  PROJECT_VIEW = 'project:view',
  PROJECT_VIEW_ALL = 'project:view_all',
  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  PROJECT_MANAGE = 'project:manage',
  PROJECT_ASSIGN_MEMBERS = 'project:assign_members',

  // ==================== Task Management ====================
  TASK_VIEW = 'task:view',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',

  // ==================== Issue Management ====================
  ISSUE_VIEW = 'issue:view',
  ISSUE_CREATE = 'issue:create',
  ISSUE_UPDATE = 'issue:update',
  ISSUE_DELETE = 'issue:delete',
  ISSUE_RESOLVE = 'issue:resolve',

  // ==================== Finance ====================
  FINANCE_VIEW = 'finance:view',
  FINANCE_VIEW_ALL = 'finance:view_all',
  FINANCE_CREATE = 'finance:create',
  FINANCE_UPDATE = 'finance:update',
  FINANCE_DELETE = 'finance:delete',
  FINANCE_APPROVE = 'finance:approve',
  FINANCE_MANAGE_BUDGET = 'finance:manage_budget',

  // Invoices
  INVOICE_VIEW = 'invoice:view',
  INVOICE_CREATE = 'invoice:create',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',
  INVOICE_APPROVE = 'invoice:approve',

  // Expenses
  EXPENSE_VIEW = 'expense:view',
  EXPENSE_CREATE = 'expense:create',
  EXPENSE_UPDATE = 'expense:update',
  EXPENSE_DELETE = 'expense:delete',
  EXPENSE_APPROVE = 'expense:approve',

  // ==================== Workforce Management ====================
  WORKFORCE_VIEW = 'workforce:view',
  WORKFORCE_VIEW_ALL = 'workforce:view_all',
  WORKFORCE_MANAGE = 'workforce:manage',

  // Employees
  EMPLOYEE_VIEW = 'employee:view',
  EMPLOYEE_CREATE = 'employee:create',
  EMPLOYEE_UPDATE = 'employee:update',
  EMPLOYEE_DELETE = 'employee:delete',

  // Attendance
  ATTENDANCE_VIEW = 'attendance:view',
  ATTENDANCE_VIEW_ALL = 'attendance:view_all',
  ATTENDANCE_MANAGE = 'attendance:manage',

  // Leaves
  LEAVE_VIEW = 'leave:view',
  LEAVE_CREATE = 'leave:create',
  LEAVE_UPDATE = 'leave:update',
  LEAVE_APPROVE = 'leave:approve',
  LEAVE_REJECT = 'leave:reject',

  // ==================== Resource Management ====================
  RESOURCE_VIEW = 'resource:view',
  RESOURCE_CREATE = 'resource:create',
  RESOURCE_UPDATE = 'resource:update',
  RESOURCE_DELETE = 'resource:delete',
  RESOURCE_ALLOCATE = 'resource:allocate',

  // Inventory
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_MANAGE = 'inventory:manage',

  // Assets
  ASSET_VIEW = 'asset:view',
  ASSET_CREATE = 'asset:create',
  ASSET_UPDATE = 'asset:update',
  ASSET_DELETE = 'asset:delete',

  // ==================== Inspection ====================
  INSPECTION_VIEW = 'inspection:view',
  INSPECTION_CREATE = 'inspection:create',
  INSPECTION_UPDATE = 'inspection:update',
  INSPECTION_DELETE = 'inspection:delete',
  INSPECTION_APPROVE = 'inspection:approve',

  // ==================== Third Party Management ====================
  VENDOR_VIEW = 'vendor:view',
  VENDOR_CREATE = 'vendor:create',
  VENDOR_UPDATE = 'vendor:update',
  VENDOR_DELETE = 'vendor:delete',

  CONTRACTOR_VIEW = 'contractor:view',
  CONTRACTOR_CREATE = 'contractor:create',
  CONTRACTOR_UPDATE = 'contractor:update',
  CONTRACTOR_DELETE = 'contractor:delete',

  // ==================== Organization ====================
  ORGANIZATION_VIEW = 'organization:view',
  ORGANIZATION_UPDATE = 'organization:update',
  ORGANIZATION_MANAGE = 'organization:manage',

  // ==================== Reports & Analytics ====================
  REPORT_VIEW = 'report:view',
  REPORT_CREATE = 'report:create',
  REPORT_EXPORT = 'report:export',
  ANALYTICS_VIEW = 'analytics:view',

  // ==================== System Administration ====================
  ADMIN_SUPER = 'admin:super',
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_USERS = 'admin:users',
  ADMIN_ROLES = 'admin:roles',
  ADMIN_AUDIT_LOG = 'admin:audit_log',
}

/**
 * Get human-readable label for permission
 */
export function getPermissionLabel(permission: Permission): string {
  const labels: Record<Permission, string> = {
    // Users
    [Permission.USER_VIEW]: 'View Users',
    [Permission.USER_CREATE]: 'Create Users',
    [Permission.USER_UPDATE]: 'Update Users',
    [Permission.USER_UPDATE_OWN]: 'Update Own Profile',
    [Permission.USER_DELETE]: 'Delete Users',
    [Permission.USER_MANAGE_ROLES]: 'Manage User Roles',
    [Permission.USER_VIEW_ALL]: 'View All Users',

    // Projects
    [Permission.PROJECT_VIEW]: 'View Projects',
    [Permission.PROJECT_VIEW_ALL]: 'View All Projects',
    [Permission.PROJECT_CREATE]: 'Create Projects',
    [Permission.PROJECT_UPDATE]: 'Update Projects',
    [Permission.PROJECT_DELETE]: 'Delete Projects',
    [Permission.PROJECT_MANAGE]: 'Manage Projects',
    [Permission.PROJECT_ASSIGN_MEMBERS]: 'Assign Project Members',

    // Tasks
    [Permission.TASK_VIEW]: 'View Tasks',
    [Permission.TASK_CREATE]: 'Create Tasks',
    [Permission.TASK_UPDATE]: 'Update Tasks',
    [Permission.TASK_DELETE]: 'Delete Tasks',
    [Permission.TASK_ASSIGN]: 'Assign Tasks',

    // Issues
    [Permission.ISSUE_VIEW]: 'View Issues',
    [Permission.ISSUE_CREATE]: 'Create Issues',
    [Permission.ISSUE_UPDATE]: 'Update Issues',
    [Permission.ISSUE_DELETE]: 'Delete Issues',
    [Permission.ISSUE_RESOLVE]: 'Resolve Issues',

    // Finance
    [Permission.FINANCE_VIEW]: 'View Finance',
    [Permission.FINANCE_VIEW_ALL]: 'View All Finance Records',
    [Permission.FINANCE_CREATE]: 'Create Finance Records',
    [Permission.FINANCE_UPDATE]: 'Update Finance Records',
    [Permission.FINANCE_DELETE]: 'Delete Finance Records',
    [Permission.FINANCE_APPROVE]: 'Approve Finance Transactions',
    [Permission.FINANCE_MANAGE_BUDGET]: 'Manage Budgets',

    // Invoices
    [Permission.INVOICE_VIEW]: 'View Invoices',
    [Permission.INVOICE_CREATE]: 'Create Invoices',
    [Permission.INVOICE_UPDATE]: 'Update Invoices',
    [Permission.INVOICE_DELETE]: 'Delete Invoices',
    [Permission.INVOICE_APPROVE]: 'Approve Invoices',

    // Expenses
    [Permission.EXPENSE_VIEW]: 'View Expenses',
    [Permission.EXPENSE_CREATE]: 'Create Expenses',
    [Permission.EXPENSE_UPDATE]: 'Update Expenses',
    [Permission.EXPENSE_DELETE]: 'Delete Expenses',
    [Permission.EXPENSE_APPROVE]: 'Approve Expenses',

    // Workforce
    [Permission.WORKFORCE_VIEW]: 'View Workforce',
    [Permission.WORKFORCE_VIEW_ALL]: 'View All Workforce Data',
    [Permission.WORKFORCE_MANAGE]: 'Manage Workforce',

    // Employees
    [Permission.EMPLOYEE_VIEW]: 'View Employees',
    [Permission.EMPLOYEE_CREATE]: 'Create Employees',
    [Permission.EMPLOYEE_UPDATE]: 'Update Employees',
    [Permission.EMPLOYEE_DELETE]: 'Delete Employees',

    // Attendance
    [Permission.ATTENDANCE_VIEW]: 'View Attendance',
    [Permission.ATTENDANCE_VIEW_ALL]: 'View All Attendance',
    [Permission.ATTENDANCE_MANAGE]: 'Manage Attendance',

    // Leaves
    [Permission.LEAVE_VIEW]: 'View Leaves',
    [Permission.LEAVE_CREATE]: 'Create Leave Requests',
    [Permission.LEAVE_UPDATE]: 'Update Leave Requests',
    [Permission.LEAVE_APPROVE]: 'Approve Leaves',
    [Permission.LEAVE_REJECT]: 'Reject Leaves',

    // Resources
    [Permission.RESOURCE_VIEW]: 'View Resources',
    [Permission.RESOURCE_CREATE]: 'Create Resources',
    [Permission.RESOURCE_UPDATE]: 'Update Resources',
    [Permission.RESOURCE_DELETE]: 'Delete Resources',
    [Permission.RESOURCE_ALLOCATE]: 'Allocate Resources',

    // Inventory
    [Permission.INVENTORY_VIEW]: 'View Inventory',
    [Permission.INVENTORY_MANAGE]: 'Manage Inventory',

    // Assets
    [Permission.ASSET_VIEW]: 'View Assets',
    [Permission.ASSET_CREATE]: 'Create Assets',
    [Permission.ASSET_UPDATE]: 'Update Assets',
    [Permission.ASSET_DELETE]: 'Delete Assets',

    // Inspection
    [Permission.INSPECTION_VIEW]: 'View Inspections',
    [Permission.INSPECTION_CREATE]: 'Create Inspections',
    [Permission.INSPECTION_UPDATE]: 'Update Inspections',
    [Permission.INSPECTION_DELETE]: 'Delete Inspections',
    [Permission.INSPECTION_APPROVE]: 'Approve Inspections',

    // Vendors
    [Permission.VENDOR_VIEW]: 'View Vendors',
    [Permission.VENDOR_CREATE]: 'Create Vendors',
    [Permission.VENDOR_UPDATE]: 'Update Vendors',
    [Permission.VENDOR_DELETE]: 'Delete Vendors',

    // Contractors
    [Permission.CONTRACTOR_VIEW]: 'View Contractors',
    [Permission.CONTRACTOR_CREATE]: 'Create Contractors',
    [Permission.CONTRACTOR_UPDATE]: 'Update Contractors',
    [Permission.CONTRACTOR_DELETE]: 'Delete Contractors',

    // Organization
    [Permission.ORGANIZATION_VIEW]: 'View Organization',
    [Permission.ORGANIZATION_UPDATE]: 'Update Organization',
    [Permission.ORGANIZATION_MANAGE]: 'Manage Organization',

    // Reports
    [Permission.REPORT_VIEW]: 'View Reports',
    [Permission.REPORT_CREATE]: 'Create Reports',
    [Permission.REPORT_EXPORT]: 'Export Reports',
    [Permission.ANALYTICS_VIEW]: 'View Analytics',

    // Admin
    [Permission.ADMIN_SUPER]: 'System Admin Access',
    [Permission.ADMIN_SETTINGS]: 'System Settings',
    [Permission.ADMIN_USERS]: 'Administer Users',
    [Permission.ADMIN_ROLES]: 'Administer Roles',
    [Permission.ADMIN_AUDIT_LOG]: 'View Audit Logs',
  };

  return labels[permission] || permission;
}

/**
 * Get permission category
 */
export function getPermissionCategory(permission: Permission): string {
  const prefix = permission.split(':')[0];
  const categories: Record<string, string> = {
    user: 'User Management',
    project: 'Project Management',
    task: 'Task Management',
    issue: 'Issue Management',
    finance: 'Finance',
    invoice: 'Invoicing',
    expense: 'Expenses',
    workforce: 'Workforce',
    employee: 'Employees',
    attendance: 'Attendance',
    leave: 'Leave Management',
    resource: 'Resource Management',
    inventory: 'Inventory',
    asset: 'Asset Management',
    inspection: 'Inspections',
    vendor: 'Vendor Management',
    contractor: 'Contractor Management',
    organization: 'Organization',
    report: 'Reporting',
    analytics: 'Analytics',
    admin: 'Administration',
  };

  return categories[prefix] || 'Other';
}

/**
 * Group permissions by category
 */
export function groupPermissionsByCategory(): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {};

  for (const permission of Object.values(Permission)) {
    const category = getPermissionCategory(permission);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(permission);
  }

  return grouped;
}
