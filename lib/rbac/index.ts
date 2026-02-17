/**
 * Module-Centric RBAC System
 *
 * Central export point for the RBAC architecture.
 *
 * NOTE: Module entitlements are temporarily disabled.
 * Entitlement management will move to the backend / Keycloak.
 * Only role-based policy checks are currently enforced.
 *
 * QUICK START:
 *
 * 1. Check user access:
 * ```ts
 * import { canUserPerformAction } from '@/lib/rbac';
 *
 * const result = await canUserPerformAction({
 *   userId: user.id,
 *   userRoles: user.roles,
 *   organizationId: user.organizationId,
 *   module: Module.TASK,
 *   action: 'create',
 * });
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
 */

// ==================== Types ====================
export type {
  ModuleAction,
  ModuleDefinition,
  RoleModulePolicy,
  AccessContext,
  AccessCheckResult,
  ModuleActionContext,
} from '@/types/rbac/module';

export { Module, ModuleCategory } from '@/types/rbac/module';

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
  isSystemAdmin,
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

// ==================== Role Types ====================
export {
  SYSTEM_ROLES,
  type SystemRoleKey,
  type SystemRoleValue,
} from '@/types/rbac/role';
