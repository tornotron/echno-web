/**
 * Centralized Policy Engine
 *
 * Single source of truth for access control decisions.
 *
 * NOTE: Entitlement checks (steps 1-4) are temporarily disabled.
 * Module entitlements will be managed by the backend / Keycloak.
 * Currently only role-based policy checks are enforced.
 */

import {
  Module,
  ModuleAction,
  ModuleActionContext,
  AccessCheckResult,
} from '@/types/rbac/module';
import { getRoleModulePolicy } from './role-module-policies';
import { logger } from '@/lib/logger';

/**
 * Check if a user can perform an action on a module
 *
 * This is the SINGLE centralized access check function.
 * All access control should go through this function.
 *
 * Currently only evaluates role policies (entitlement checks disabled —
 * will be moved to backend / Keycloak).
 *
 * @param context - Context containing user, roles, module, action, and resource info
 * @returns Access check result with allowed status and reason
 */
export async function canUserPerformAction(
  context: ModuleActionContext
): Promise<AccessCheckResult> {
  const { module, action, userId, userRoles, resource } = context;

  logger.debug('Evaluating access', {
    module,
    action,
    userId,
    roles: userRoles,
  });

  // ==================== Check Role Policies ====================
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
 *
 * NOTE: Entitlement checks temporarily disabled — all modules are accessible.
 * Will be replaced by backend / Keycloak entitlement checks.
 */
export async function hasModuleAccess(
  _userId: string,
  _organizationId: string,
  _module: Module
): Promise<boolean> {
  return true;
}

/**
 * Get all modules a user has access to
 *
 * NOTE: Entitlement checks temporarily disabled — returns all modules.
 * Will be replaced by backend / Keycloak entitlement checks.
 */
export async function getUserModules(): Promise<Module[]> {
  return Object.values(Module);
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
  actions: ModuleAction[]
): Promise<Record<ModuleAction, boolean>> {
  const results: Record<string, boolean> = {};

  for (const action of actions) {
    const result = await canUserPerformAction({ ...context, action });
    results[action] = result.allowed;
  }

  return results as Record<ModuleAction, boolean>;
}

/**
 * Check if user is system admin
 * System admins bypass most checks (but still need entitlements)
 * Re-exported from role-utils for backwards compatibility
 */
export { isSystemAdmin } from './role-utils';
