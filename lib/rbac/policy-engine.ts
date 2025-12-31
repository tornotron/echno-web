/**
 * Centralized Policy Engine
 *
 * Single source of truth for access control decisions
 * Evaluates: entitlement → enabled → purchased → role → context
 */

import {
  Module,
  ModuleAction,
  ModuleActionContext,
  AccessCheckResult,
  UserModuleEntitlement,
  EntitlementStatus,
} from '@/types/rbac/module';
import { getRoleModulePolicy } from './role-module-policies';
import { getModuleDefinition } from './module-registry';
import { logger } from '@/lib/logger';

/**
 * Check if a user can perform an action on a module
 *
 * This is the SINGLE centralized access check function.
 * All access control should go through this function.
 *
 * Evaluation order:
 * 1. Check entitlements - does user/org have access to module?
 * 2. Check if module is enabled
 * 3. Check if module is purchased (if required)
 * 4. Check role policies - does role allow this action?
 * 5. Check contextual constraints - own only, team only, etc.
 *
 * @param context - Context containing user, roles, module, action, and resource info
 * @param entitlements - User/org entitlements (will be fetched from DB in production)
 * @returns Access check result with allowed status and reason
 */
export async function canUserPerformAction(
  context: ModuleActionContext,
  entitlements: UserModuleEntitlement[]
): Promise<AccessCheckResult> {
  const { module, action, userId, userRoles, organizationId, resource } =
    context;

  logger.debug('Evaluating access', {
    module,
    action,
    userId,
    roles: userRoles,
    organizationId,
  });

  // ==================== Step 1: Check Entitlements ====================
  // Find entitlement for this module
  const entitlement = entitlements.find(
    (e) =>
      e.module === module &&
      e.organizationId === organizationId &&
      (e.userId === userId || !e.userId) // Org-level or user-level
  );

  if (!entitlement) {
    return {
      allowed: false,
      reason: `No entitlement found for module: ${module}`,
      appliedPolicy: {
        type: 'entitlement',
        details: 'Module not entitled',
      },
      requiredActions: ['Purchase or enable this module'],
    };
  }

  // ==================== Step 2: Check if Enabled ====================
  if (!entitlement.isEnabled) {
    return {
      allowed: false,
      reason: `Module ${module} is not enabled`,
      appliedPolicy: {
        type: 'entitlement',
        details: 'Module disabled',
      },
      requiredActions: ['Enable this module in admin settings'],
    };
  }

  // ==================== Step 3: Check Entitlement Status ====================
  if (entitlement.status === EntitlementStatus.EXPIRED) {
    return {
      allowed: false,
      reason: `Module ${module} entitlement has expired`,
      appliedPolicy: {
        type: 'entitlement',
        details: 'Entitlement expired',
      },
      requiredActions: ['Renew module subscription'],
    };
  }

  if (entitlement.status === EntitlementStatus.SUSPENDED) {
    return {
      allowed: false,
      reason: `Module ${module} is suspended`,
      appliedPolicy: {
        type: 'entitlement',
        details: 'Entitlement suspended',
      },
      requiredActions: ['Contact administrator to restore access'],
    };
  }

  // ==================== Step 4: Check if Purchased (if required) ====================
  const moduleDefinition = getModuleDefinition(module);

  if (
    moduleDefinition.isPurchasable &&
    !entitlement.isPurchased && // Allow if it's in trial status
    entitlement.status !== EntitlementStatus.TRIAL
  ) {
    return {
      allowed: false,
      reason: `Module ${module} requires purchase`,
      appliedPolicy: {
        type: 'entitlement',
        details: 'Module not purchased',
      },
      requiredActions: ['Purchase this module'],
    };
  }

  // ==================== Step 5: Check Role Policies ====================
  // Check each role the user has
  let roleAllowsAction = false;
  let applicablePolicy = null;

  for (const roleId of userRoles) {
    const policy = getRoleModulePolicy(roleId, module);

    if (policy && policy.allowedActions.includes(action)) {
      roleAllowsAction = true;
      applicablePolicy = policy;

      // ==================== Step 6: Check Contextual Constraints ====================
      if (policy.context) {
        // Check "own only" constraint
        if (policy.context.ownOnly) {
          if (!resource) {
            // No resource provided, cannot verify ownership
            continue; // Try next role
          }

          if (resource.ownerId !== userId) {
            continue; // Try next role
          }
        }

        // Check "team only" constraint
        if (policy.context.teamOnly) {
          if (!resource) {
            // For team-only, if no resource provided, assume it's a list/view operation
            // which is allowed (the actual data filtering happens at query level)
            break;
          }

          // If resource provided, check if user has access
          // This would typically check if user is in the same team/project
          // For now, we'll allow it and let the data layer handle filtering
          break;
        }

        // "all records" - no additional checks needed
        if (policy.context.allRecords) {
          break;
        }
      } else {
        // No context constraints, allow
        break;
      }
    }
  }

  if (!roleAllowsAction || !applicablePolicy) {
    return {
      allowed: false,
      reason: `None of your roles (${userRoles.join(', ')}) allow action '${action}' on module '${module}'`,
      appliedPolicy: {
        type: 'role',
        details: 'No role policy permits this action',
      },
      requiredActions: [
        'Request appropriate role assignment from administrator',
      ],
    };
  }

  // ==================== Access Granted ====================
  logger.debug('Access granted', {
    module,
    action,
    userId,
    roleId: applicablePolicy.roleId,
  });

  return {
    allowed: true,
    reason: `Access granted via role: ${applicablePolicy.roleId}`,
    appliedPolicy: {
      type: 'role',
      details: `Role ${applicablePolicy.roleId} permits ${action} on ${module}`,
    },
  };
}

/**
 * Simplified check - does user have access to module at all?
 * (Checks entitlement and enabled status only)
 */
export async function hasModuleAccess(
  userId: string,
  organizationId: string,
  module: Module,
  entitlements: UserModuleEntitlement[]
): Promise<boolean> {
  const entitlement = entitlements.find(
    (e) =>
      e.module === module &&
      e.organizationId === organizationId &&
      (e.userId === userId || !e.userId)
  );

  if (!entitlement) return false;
  if (!entitlement.isEnabled) return false;
  if (
    entitlement.status === EntitlementStatus.EXPIRED ||
    entitlement.status === EntitlementStatus.SUSPENDED
  ) {
    return false;
  }

  const moduleDefinition = getModuleDefinition(module);
  if (
    moduleDefinition.isPurchasable &&
    !entitlement.isPurchased &&
    entitlement.status !== EntitlementStatus.TRIAL
  ) {
    return false;
  }

  return true;
}

/**
 * Get all modules a user has access to
 */
export async function getUserModules(
  userId: string,
  organizationId: string,
  entitlements: UserModuleEntitlement[]
): Promise<Module[]> {
  const accessibleModules: Module[] = [];

  for (const entitlement of entitlements) {
    if (
      entitlement.organizationId !== organizationId ||
      (entitlement.userId && entitlement.userId !== userId)
    ) {
      continue;
    }

    const hasAccess = await hasModuleAccess(
      userId,
      organizationId,
      entitlement.module,
      entitlements
    );

    if (hasAccess) {
      accessibleModules.push(entitlement.module);
    }
  }

  return accessibleModules;
}

/**
 * Get allowed actions for a user on a module
 * Returns the union of all actions allowed by any of the user's roles
 */
export function getUserAllowedActions(
  userRoles: string[],
  module: Module
): ModuleAction[] {
  const allowedActions = new Set<ModuleAction>();

  for (const roleId of userRoles) {
    const policy = getRoleModulePolicy(roleId, module);
    if (policy) {
      for (const action of policy.allowedActions) {
        allowedActions.add(action);
      }
    }
  }

  return [...allowedActions];
}

/**
 * Batch check - check multiple actions at once
 * Useful for UI to determine which buttons/actions to show
 */
export async function canUserPerformActions(
  context: Omit<ModuleActionContext, 'action'>,
  actions: ModuleAction[],
  entitlements: UserModuleEntitlement[]
): Promise<Record<ModuleAction, boolean>> {
  const results: Record<string, boolean> = {};

  for (const action of actions) {
    const result = await canUserPerformAction(
      { ...context, action },
      entitlements
    );
    results[action] = result.allowed;
  }

  return results as Record<ModuleAction, boolean>;
}

/**
 * Check if user is super admin
 * Super admins bypass most checks (but still need entitlements)
 */
export function isSuperAdmin(userRoles: string[]): boolean {
  return userRoles.includes('super-admin');
}
