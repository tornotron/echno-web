/**
 * Module-Centric RBAC System
 *
 * Central export point for the new RBAC architecture
 *
 * QUICK START:
 *
 * 1. Check user access:
 * ```ts
 * import { canUserPerformAction } from '@/lib/rbac';
 *
 * const result = await canUserPerformAction(
 *   {
 *     userId: user.id,
 *     userRoles: user.roles,
 *     organizationId: user.organizationId,
 *     module: Module.TASK,
 *     action: 'create',
 *   },
 *   entitlements
 * );
 *
 * if (result.allowed) {
 *   // User can create tasks
 * }
 * ```
 *
 * 2. Get user's allowed actions:
 * ```ts
 * import { getUserAllowedActions, Module } from '@/lib/rbac';
 *
 * const actions = getUserAllowedActions(user.roles, Module.TASK);
 * // Returns: ['view', 'create', 'update']
 * ```
 *
 * 3. Manage entitlements:
 * ```ts
 * import { enableModule, purchaseModule } from '@/lib/rbac';
 *
 * await enableModule(organizationId, Module.FINANCE);
 * await purchaseModule(organizationId, Module.FINANCE);
 * ```
 */

// ==================== Types ====================
export type {
  ModuleAction,
  ModuleDefinition,
  RoleModulePolicy,
  UserModuleEntitlement,
  AccessContext,
  AccessCheckResult,
  ModuleActionContext,
} from '@/types/rbac/module';

export { Module, ModuleCategory, EntitlementStatus } from '@/types/rbac/module';

// ==================== Module Registry ====================
export {
  MODULE_REGISTRY,
  getModuleDefinition,
  getModulesByCategory,
  getPurchasableModules,
  getFreeModules,
  getModuleDependencies,
  hasModuleDependencies,
  getModuleName,
  getAllModules,
  groupModulesByCategory,
} from './module-registry';

// ==================== Policy Engine ====================
export {
  canUserPerformAction,
  hasModuleAccess,
  getUserModules,
  getUserAllowedActions,
  canUserPerformActions,
  isSuperAdmin,
} from './policy-engine';

// ==================== Role-Module Policies ====================
export {
  ROLE_MODULE_POLICIES,
  getRolePolicies,
  getRoleModulePolicy,
  getAllowedActions,
  canRolePerformAction,
  getRoleModules,
} from './role-module-policies';

// ==================== Entitlement Service ====================
export {
  createEntitlement,
  getEntitlement,
  getOrganizationEntitlements,
  getUserEntitlements,
  enableModule,
  disableModule,
  purchaseModule,
  startTrial,
  updateEntitlementStatus,
  checkExpiredEntitlements,
  deleteEntitlement,
  initializeOrganizationEntitlements,
  getEntitlementSummary,
} from './entitlement-service';

// ==================== Backward Compatibility ====================
// NOTE: These are deprecated - use new module-action system instead
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  legacyPermissionsToRoles,
  migrateUserPermissionsToRoles,
  needsMigration,
} from './compatibility';

// ==================== Permission-Module Mapping ====================
export {
  PERMISSION_MODULE_MAPPINGS,
  permissionToModuleAction,
  moduleActionToPermission,
  getModulePermissions,
  permissionsToModules,
} from './permission-module-mapping';

// Re-export legacy permission system for compatibility
export { Permission } from '@/types/rbac/permission';
export {
  SYSTEM_ROLES,
  type SystemRoleKey,
  type SystemRoleValue,
} from '@/types/rbac/role';
