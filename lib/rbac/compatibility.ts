/**
 * Backward Compatibility Layer
 *
 * Provides legacy permission-based API that wraps the new module-action system
 * Allows existing code to continue working during migration
 *
 * USAGE:
 * - Existing code using hasPermission() will continue to work
 * - New code should use canUserPerformAction() directly
 * - Gradually migrate old code to new system
 *
 * DEPRECATION NOTICE:
 * These functions are deprecated and will be removed in a future version
 * Please migrate to the module-action system
 */

import { Permission } from '@/types/rbac/permission';
import { UserModuleEntitlement } from '@/types/rbac/module';
import { permissionToModuleAction } from './permission-module-mapping';
import { canUserPerformAction } from './policy-engine';
import { logger } from '@/lib/logger';

/**
 * @deprecated Use canUserPerformAction() instead
 *
 * Legacy permission check that wraps the new module-action system
 * Translates Permission to Module+Action and checks access
 *
 * @param permission - Legacy permission to check
 * @param context - User context
 * @param entitlements - User/org entitlements
 * @returns Whether user has the permission
 */
export async function hasPermission(
  permission: Permission,
  context: {
    userId: string;
    userRoles: string[];
    organizationId: string;
    resource?: {
      id: string;
      type: string;
      ownerId?: string;
      teamId?: string;
      metadata?: Record<string, unknown>;
    };
  },
  entitlements: UserModuleEntitlement[]
): Promise<boolean> {
  // Log deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    logger.warn('DEPRECATED: hasPermission() is deprecated', {
      permission,
      suggestion: 'Use canUserPerformAction() instead',
    });
  }

  // Convert permission to module+action
  const moduleAction = permissionToModuleAction(permission);

  if (!moduleAction) {
    logger.error('No module mapping found for permission', { permission });
    return false;
  }

  // Check access using new system
  const result = await canUserPerformAction(
    {
      ...context,
      module: moduleAction.module,
      action: moduleAction.action,
    },
    entitlements
  );

  return result.allowed;
}

/**
 * @deprecated Use canUserPerformActions() instead
 *
 * Check if user has ANY of the specified permissions (OR logic)
 */
export async function hasAnyPermission(
  permissions: Permission[],
  context: {
    userId: string;
    userRoles: string[];
    organizationId: string;
    resource?: {
      id: string;
      type: string;
      ownerId?: string;
      teamId?: string;
    };
  },
  entitlements: UserModuleEntitlement[]
): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    logger.warn('DEPRECATED: hasAnyPermission() is deprecated', {
      permissions,
      suggestion: 'Use canUserPerformActions() instead',
    });
  }

  for (const permission of permissions) {
    const hasAccess = await hasPermission(permission, context, entitlements);
    if (hasAccess) {
      return true;
    }
  }

  return false;
}

/**
 * @deprecated Use canUserPerformActions() instead
 *
 * Check if user has ALL of the specified permissions (AND logic)
 */
export async function hasAllPermissions(
  permissions: Permission[],
  context: {
    userId: string;
    userRoles: string[];
    organizationId: string;
    resource?: {
      id: string;
      type: string;
      ownerId?: string;
      teamId?: string;
    };
  },
  entitlements: UserModuleEntitlement[]
): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    logger.warn('DEPRECATED: hasAllPermissions() is deprecated', {
      permissions,
      suggestion: 'Use canUserPerformActions() instead',
    });
  }

  for (const permission of permissions) {
    const hasAccess = await hasPermission(permission, context, entitlements);
    if (!hasAccess) {
      return false;
    }
  }

  return true;
}

/**
 * Wrapper to maintain existing function signature
 * Maps old Permission[] array from session to new module-action checks
 *
 * @deprecated This maintains compatibility with session.user.permissions
 * New code should not use this pattern
 */
export function legacyPermissionsToRoles(): string[] {
  // This is a temporary bridge
  // In reality, roles should come from session.user.roles
  logger.warn('DEPRECATED: legacyPermissionsToRoles() called', {
    suggestion: 'Use session.user.roles directly',
  });

  // Return empty array - roles should be stored separately
  return [];
}

/**
 * Migration helper: Convert user data from permission-based to module-based
 *
 * This helps migrate existing user records that store permissions
 * to the new system that uses roles + entitlements
 */
export async function migrateUserPermissionsToRoles(userData: {
  id: string;
  permissions: Permission[];
  organizationId: string;
}): Promise<{
  roles: string[];
  requiredModules: Set<string>;
}> {
  const { permissions } = userData;

  // Analyze permissions to determine appropriate roles
  // This is a simplified heuristic - adjust based on your needs
  const roles: string[] = [];
  const requiredModules = new Set<string>();

  // Check for admin permissions
  if (permissions.includes(Permission.ADMIN_SUPER)) {
    roles.push('super-admin');
  }

  // Check for management permissions
  if (
    permissions.includes(Permission.PROJECT_MANAGE) &&
    permissions.includes(Permission.PROJECT_CREATE)
  ) {
    roles.push('project-manager');
  }

  if (
    permissions.includes(Permission.WORKFORCE_MANAGE) &&
    permissions.includes(Permission.EMPLOYEE_CREATE)
  ) {
    roles.push('hr-manager');
  }

  if (
    permissions.includes(Permission.FINANCE_APPROVE) &&
    permissions.includes(Permission.FINANCE_CREATE)
  ) {
    roles.push('accountant');
  }

  // Collect required modules
  for (const permission of permissions) {
    const moduleAction = permissionToModuleAction(permission);
    if (moduleAction) {
      requiredModules.add(moduleAction.module);
    }
  }

  logger.info('User permissions migrated to roles', {
    userId: userData.id,
    oldPermissions: permissions.length,
    newRoles: roles,
    requiredModules: requiredModules.size,
  });

  return {
    roles,
    requiredModules,
  };
}

/**
 * Helper to check if migration is needed
 */
export function needsMigration(user: unknown): boolean {
  const userData = user as {
    permissions?: Permission[];
    roles?: string[];
  };

  // If user has permissions but no roles, needs migration
  return Boolean(
    userData.permissions &&
      userData.permissions.length > 0 &&
      (!userData.roles || userData.roles.length === 0)
  );
}
