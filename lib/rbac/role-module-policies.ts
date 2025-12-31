/**
 * Role-Module Policy Definitions
 *
 * Maps roles to their allowed actions on each module
 * This replaces the direct permission mapping with a module-action based approach
 */

import { SYSTEM_ROLES } from '@/types/rbac/role';
import { Module, ModuleAction, RoleModulePolicy } from '@/types/rbac/module';

/**
 * Complete role-module policy mapping
 * Defines what actions each role can perform on each module
 */
export const ROLE_MODULE_POLICIES: RoleModulePolicy[] = [
  // ==================== SUPER ADMIN ====================
  // Has ALL actions on ALL modules
  ...Object.values(Module).flatMap((module) => ({
    roleId: SYSTEM_ROLES.SUPER_ADMIN,
    module,
    allowedActions: [
      'view',
      'create',
      'update',
      'delete',
      'assign',
      'approve',
    ] as ModuleAction[],
    context: { allRecords: true },
  })),

  // ==================== PROJECT MANAGER ====================
  // Project - Full access
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.PROJECT,
    allowedActions: ['view', 'create', 'update', 'delete', 'assign'],
    context: { allRecords: true },
  },
  // Task - Full access
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.TASK,
    allowedActions: ['view', 'create', 'update', 'delete', 'assign'],
    context: { allRecords: true },
  },
  // Issue - Full access except delete
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.ISSUE,
    allowedActions: ['view', 'create', 'update', 'assign'],
    context: { allRecords: true },
  },
  // User - View only
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.USER,
    allowedActions: ['view', 'update'],
    context: { allRecords: true },
  },
  // Finance - View and create
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.FINANCE,
    allowedActions: ['view', 'create'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.EXPENSE,
    allowedActions: ['view', 'create'],
    context: { allRecords: true },
  },
  // Workforce - View and manage
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.WORKFORCE,
    allowedActions: ['view', 'assign'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.ATTENDANCE,
    allowedActions: ['view'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.LEAVE,
    allowedActions: ['view', 'approve'],
    context: { allRecords: true },
  },
  // Resources
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.RESOURCE,
    allowedActions: ['view', 'create', 'assign'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.INVENTORY,
    allowedActions: ['view'],
    context: { allRecords: true },
  },
  // Inspection
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.INSPECTION,
    allowedActions: ['view', 'create', 'approve'],
    context: { allRecords: true },
  },
  // Reports
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.REPORT,
    allowedActions: ['view', 'create'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.PROJECT_MANAGER,
    module: Module.ANALYTICS,
    allowedActions: ['view'],
    context: { allRecords: true },
  },

  // ==================== SITE MANAGER ====================
  {
    roleId: SYSTEM_ROLES.SITE_MANAGER,
    module: Module.PROJECT,
    allowedActions: ['view', 'update', 'assign'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_MANAGER,
    module: Module.TASK,
    allowedActions: ['view', 'create', 'update', 'assign'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_MANAGER,
    module: Module.ISSUE,
    allowedActions: ['view', 'create', 'update', 'assign'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_MANAGER,
    module: Module.WORKFORCE,
    allowedActions: ['view', 'assign'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_MANAGER,
    module: Module.EMPLOYEE,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_MANAGER,
    module: Module.ATTENDANCE,
    allowedActions: ['view', 'update'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_MANAGER,
    module: Module.LEAVE,
    allowedActions: ['view', 'approve'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_MANAGER,
    module: Module.RESOURCE,
    allowedActions: ['view', 'assign'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_MANAGER,
    module: Module.INVENTORY,
    allowedActions: ['view', 'update'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_MANAGER,
    module: Module.INSPECTION,
    allowedActions: ['view', 'create', 'update'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_MANAGER,
    module: Module.USER,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },

  // ==================== HR MANAGER ====================
  {
    roleId: SYSTEM_ROLES.HR_MANAGER,
    module: Module.USER,
    allowedActions: ['view', 'create', 'update'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.HR_MANAGER,
    module: Module.WORKFORCE,
    allowedActions: ['view', 'create', 'update', 'delete', 'assign'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.HR_MANAGER,
    module: Module.EMPLOYEE,
    allowedActions: ['view', 'create', 'update', 'delete'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.HR_MANAGER,
    module: Module.ATTENDANCE,
    allowedActions: ['view', 'update'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.HR_MANAGER,
    module: Module.LEAVE,
    allowedActions: ['view', 'create', 'update', 'approve'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.HR_MANAGER,
    module: Module.PROJECT,
    allowedActions: ['view'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.HR_MANAGER,
    module: Module.REPORT,
    allowedActions: ['view', 'create'],
    context: { allRecords: true },
  },

  // ==================== ACCOUNTANT ====================
  {
    roleId: SYSTEM_ROLES.ACCOUNTANT,
    module: Module.FINANCE,
    allowedActions: ['view', 'create', 'update', 'delete', 'approve'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.ACCOUNTANT,
    module: Module.INVOICE,
    allowedActions: ['view', 'create', 'update', 'delete', 'approve'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.ACCOUNTANT,
    module: Module.EXPENSE,
    allowedActions: ['view', 'create', 'update', 'delete', 'approve'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.ACCOUNTANT,
    module: Module.VENDOR,
    allowedActions: ['view', 'create', 'update'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.ACCOUNTANT,
    module: Module.PROJECT,
    allowedActions: ['view'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.ACCOUNTANT,
    module: Module.USER,
    allowedActions: ['view'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.ACCOUNTANT,
    module: Module.REPORT,
    allowedActions: ['view', 'create'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.ACCOUNTANT,
    module: Module.ANALYTICS,
    allowedActions: ['view'],
    context: { allRecords: true },
  },

  // ==================== ENGINEERS ====================
  {
    roleId: SYSTEM_ROLES.CIVIL_ENGINEER,
    module: Module.PROJECT,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CIVIL_ENGINEER,
    module: Module.TASK,
    allowedActions: ['view', 'create', 'update'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CIVIL_ENGINEER,
    module: Module.ISSUE,
    allowedActions: ['view', 'create', 'update'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CIVIL_ENGINEER,
    module: Module.INSPECTION,
    allowedActions: ['view', 'create', 'update'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CIVIL_ENGINEER,
    module: Module.RESOURCE,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CIVIL_ENGINEER,
    module: Module.REPORT,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CIVIL_ENGINEER,
    module: Module.USER,
    allowedActions: ['update'],
    context: { ownOnly: true },
  },

  {
    roleId: SYSTEM_ROLES.SITE_ENGINEER,
    module: Module.PROJECT,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_ENGINEER,
    module: Module.TASK,
    allowedActions: ['view', 'create', 'update'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_ENGINEER,
    module: Module.ISSUE,
    allowedActions: ['view', 'create', 'update'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_ENGINEER,
    module: Module.INSPECTION,
    allowedActions: ['view', 'create', 'update'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_ENGINEER,
    module: Module.RESOURCE,
    allowedActions: ['view', 'assign'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_ENGINEER,
    module: Module.WORKFORCE,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_ENGINEER,
    module: Module.ATTENDANCE,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_ENGINEER,
    module: Module.REPORT,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SITE_ENGINEER,
    module: Module.USER,
    allowedActions: ['update'],
    context: { ownOnly: true },
  },

  // ==================== SUPERVISORY ====================
  {
    roleId: SYSTEM_ROLES.SUPERVISOR,
    module: Module.PROJECT,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SUPERVISOR,
    module: Module.TASK,
    allowedActions: ['view', 'update'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SUPERVISOR,
    module: Module.ISSUE,
    allowedActions: ['view', 'create'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SUPERVISOR,
    module: Module.WORKFORCE,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SUPERVISOR,
    module: Module.ATTENDANCE,
    allowedActions: ['view', 'update'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SUPERVISOR,
    module: Module.RESOURCE,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.SUPERVISOR,
    module: Module.USER,
    allowedActions: ['update'],
    context: { ownOnly: true },
  },

  {
    roleId: SYSTEM_ROLES.SAFETY_OFFICER,
    module: Module.PROJECT,
    allowedActions: ['view'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.SAFETY_OFFICER,
    module: Module.ISSUE,
    allowedActions: ['view', 'create', 'update'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.SAFETY_OFFICER,
    module: Module.INSPECTION,
    allowedActions: ['view', 'create', 'update', 'approve'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.SAFETY_OFFICER,
    module: Module.WORKFORCE,
    allowedActions: ['view'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.SAFETY_OFFICER,
    module: Module.REPORT,
    allowedActions: ['view', 'create'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.SAFETY_OFFICER,
    module: Module.USER,
    allowedActions: ['update'],
    context: { ownOnly: true },
  },

  // ==================== PROCUREMENT ====================
  {
    roleId: SYSTEM_ROLES.QUANTITY_SURVEYOR,
    module: Module.PROJECT,
    allowedActions: ['view'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.QUANTITY_SURVEYOR,
    module: Module.FINANCE,
    allowedActions: ['view', 'create'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.QUANTITY_SURVEYOR,
    module: Module.RESOURCE,
    allowedActions: ['view'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.QUANTITY_SURVEYOR,
    module: Module.INVENTORY,
    allowedActions: ['view'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.QUANTITY_SURVEYOR,
    module: Module.VENDOR,
    allowedActions: ['view'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.QUANTITY_SURVEYOR,
    module: Module.REPORT,
    allowedActions: ['view', 'create'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.QUANTITY_SURVEYOR,
    module: Module.USER,
    allowedActions: ['update'],
    context: { ownOnly: true },
  },

  {
    roleId: SYSTEM_ROLES.PROCUREMENT_OFFICER,
    module: Module.RESOURCE,
    allowedActions: ['view', 'create', 'update'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.PROCUREMENT_OFFICER,
    module: Module.INVENTORY,
    allowedActions: ['view', 'update'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.PROCUREMENT_OFFICER,
    module: Module.VENDOR,
    allowedActions: ['view', 'create', 'update'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.PROCUREMENT_OFFICER,
    module: Module.EXPENSE,
    allowedActions: ['view', 'create'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.PROCUREMENT_OFFICER,
    module: Module.REPORT,
    allowedActions: ['view'],
    context: { allRecords: true },
  },
  {
    roleId: SYSTEM_ROLES.PROCUREMENT_OFFICER,
    module: Module.USER,
    allowedActions: ['update'],
    context: { ownOnly: true },
  },

  // ==================== SKILLED WORKERS ====================
  // Electrician, Plumber, Carpenter, etc. - Similar permissions
  ...[
    SYSTEM_ROLES.ELECTRICIAN,
    SYSTEM_ROLES.PLUMBER,
    SYSTEM_ROLES.CARPENTER,
    SYSTEM_ROLES.MASON,
    SYSTEM_ROLES.WELDER,
  ].flatMap((roleId) => [
    {
      roleId,
      module: Module.TASK,
      allowedActions: ['view', 'update'] as ModuleAction[],
      context: { ownOnly: true },
    },
    {
      roleId,
      module: Module.ISSUE,
      allowedActions: ['view', 'create'] as ModuleAction[],
      context: { ownOnly: true },
    },
    {
      roleId,
      module: Module.RESOURCE,
      allowedActions: ['view'] as ModuleAction[],
      context: { teamOnly: true },
    },
    {
      roleId,
      module: Module.ATTENDANCE,
      allowedActions: ['view'] as ModuleAction[],
      context: { ownOnly: true },
    },
    {
      roleId,
      module: Module.LEAVE,
      allowedActions: ['create'] as ModuleAction[],
      context: { ownOnly: true },
    },
    {
      roleId,
      module: Module.USER,
      allowedActions: ['update'] as ModuleAction[],
      context: { ownOnly: true },
    },
  ]),

  // ==================== GENERAL WORKERS ====================
  {
    roleId: SYSTEM_ROLES.LABORER,
    module: Module.TASK,
    allowedActions: ['view', 'update'],
    context: { ownOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.LABORER,
    module: Module.ATTENDANCE,
    allowedActions: ['view'],
    context: { ownOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.LABORER,
    module: Module.LEAVE,
    allowedActions: ['create'],
    context: { ownOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.LABORER,
    module: Module.USER,
    allowedActions: ['update'],
    context: { ownOnly: true },
  },

  // ==================== THIRD PARTY ====================
  {
    roleId: SYSTEM_ROLES.CONTRACTOR,
    module: Module.PROJECT,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CONTRACTOR,
    module: Module.TASK,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CONTRACTOR,
    module: Module.ISSUE,
    allowedActions: ['view', 'create'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CONTRACTOR,
    module: Module.REPORT,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CONTRACTOR,
    module: Module.USER,
    allowedActions: ['update'],
    context: { ownOnly: true },
  },

  {
    roleId: SYSTEM_ROLES.CLIENT,
    module: Module.PROJECT,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CLIENT,
    module: Module.REPORT,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CLIENT,
    module: Module.ANALYTICS,
    allowedActions: ['view'],
    context: { teamOnly: true },
  },
  {
    roleId: SYSTEM_ROLES.CLIENT,
    module: Module.USER,
    allowedActions: ['update'],
    context: { ownOnly: true },
  },
];

/**
 * Get all policies for a specific role
 */
export function getRolePolicies(roleId: string): RoleModulePolicy[] {
  return ROLE_MODULE_POLICIES.filter((policy) => policy.roleId === roleId);
}

/**
 * Get policy for a specific role and module
 */
export function getRoleModulePolicy(
  roleId: string,
  module: Module
): RoleModulePolicy | undefined {
  return ROLE_MODULE_POLICIES.find(
    (policy) => policy.roleId === roleId && policy.module === module
  );
}

/**
 * Get allowed actions for a role on a module
 */
export function getAllowedActions(
  roleId: string,
  module: Module
): ModuleAction[] {
  const policy = getRoleModulePolicy(roleId, module);
  return policy?.allowedActions || [];
}

/**
 * Check if a role can perform an action on a module
 */
export function canRolePerformAction(
  roleId: string,
  module: Module,
  action: ModuleAction
): boolean {
  const allowedActions = getAllowedActions(roleId, module);
  return allowedActions.includes(action);
}

/**
 * Get all modules a role has access to
 */
export function getRoleModules(roleId: string): Module[] {
  const policies = getRolePolicies(roleId);
  return [...new Set(policies.map((p) => p.module))];
}
