'use client';

import { useAuthorization } from '@/hooks/use-authorization';
import { Permission } from '@/types/rbac/permission';
import { ReactNode } from 'react';

interface ProtectedProps {
  /**
   * Permission(s) required to view content
   * - Single permission: User must have this permission
   * - Array of permissions: User must have ALL permissions (AND logic)
   */
  permission?: Permission | Permission[];

  /**
   * Alternative: Check for ANY permission (OR logic)
   * User needs at least one of these permissions
   */
  anyPermission?: Permission[];

  /**
   * Role(s) required to view content
   * - Single role: User must have this role
   * - Array of roles: User needs ANY role (OR logic)
   */
  role?: string | string[];

  /**
   * Alternative: User must have ALL specified roles (AND logic)
   */
  allRoles?: string[];

  /**
   * Require system admin access
   */
  requireSystemAdmin?: boolean;

  /**
   * Combination logic when both permission and role are provided
   * - 'AND': User must meet both permission AND role requirements
   * - 'OR': User must meet permission OR role requirements
   * @default 'OR'
   */
  requireAll?: boolean;

  /**
   * Content to show when user has access
   */
  children: ReactNode;

  /**
   * Content to show when user doesn't have access
   * @default null
   */
  fallback?: ReactNode;

  /**
   * Content to show while checking authorization
   * @default null
   */
  loading?: ReactNode;
}

/**
 * Protected component for conditionally rendering based on permissions/roles
 *
 * @example
 * ```tsx
 * // Show only to users with specific permission
 * <Protected permission={Permission.PROJECT_CREATE}>
 *   <CreateProjectButton />
 * </Protected>
 *
 * // Show to users with ANY of these permissions
 * <Protected anyPermission={[Permission.PROJECT_VIEW, Permission.TASK_VIEW]}>
 *   <Dashboard />
 * </Protected>
 *
 * // Show to users with specific role
 * <Protected role="projectManager">
 *   <ManagerControls />
 * </Protected>
 *
 * // Show to users with permission AND role
 * <Protected
 *   permission={Permission.PROJECT_DELETE}
 *   role="projectManager"
 *   requireAll={true}
 * >
 *   <DeleteButton />
 * </Protected>
 *
 * // Show only to system admin
 * <Protected requireSystemAdmin>
 *   <AdminPanel />
 * </Protected>
 *
 * // With custom fallback
 * <Protected
 *   permission={Permission.FINANCE_VIEW}
 *   fallback={<div>You don't have access to finance data</div>}
 * >
 *   <FinanceReport />
 * </Protected>
 * ```
 */
export function Protected({
  permission,
  anyPermission,
  role,
  allRoles,
  requireSystemAdmin = false,
  requireAll = false,
  fallback = null,
  loading = null,
  children,
}: ProtectedProps) {
  const {
    can,
    canAny,
    hasRoles,
    hasEveryRole,
    isSystemAdmin,
    isLoading,
    isAuthenticated,
  } = useAuthorization();

  // Show loading state
  if (isLoading) {
    return <>{loading}</>;
  }

  // Not authenticated = no access
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // System admin always has access (unless specifically checking for system admin role)
  if (isSystemAdmin && !requireSystemAdmin) {
    return <>{children}</>;
  }

  // Check system admin requirement
  if (requireSystemAdmin && !isSystemAdmin) {
    return <>{fallback}</>;
  }

  // If only system admin check, and user is system admin, show content
  if (requireSystemAdmin && isSystemAdmin) {
    return <>{children}</>;
  }

  // Check permissions
  let hasPermissionAccess = true;
  if (permission !== undefined) {
    hasPermissionAccess = can(permission);
  } else if (anyPermission !== undefined) {
    hasPermissionAccess = canAny(anyPermission);
  }

  // Check roles
  let hasRoleAccess = true;
  if (role !== undefined) {
    hasRoleAccess = hasRoles(role);
  } else if (allRoles !== undefined) {
    hasRoleAccess = hasEveryRole(allRoles);
  }

  // Determine access based on combination logic
  let hasAccess = false;

  if (permission !== undefined || anyPermission !== undefined) {
    if (role !== undefined || allRoles !== undefined) {
      // Both permission and role checks
      hasAccess = requireAll
        ? hasPermissionAccess && hasRoleAccess
        : hasPermissionAccess || hasRoleAccess;
    } else {
      // Only permission check
      hasAccess = hasPermissionAccess;
    }
  } else if (role !== undefined || allRoles !== undefined) {
    // Only role check
    hasAccess = hasRoleAccess;
  } else if (!requireSystemAdmin) {
    // No checks specified, allow if authenticated
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Require component - shows children only if user is authenticated
 * Useful for protecting entire sections without specific permission checks
 */
export function RequireAuth({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuthorization();

  if (isLoading) return <>{fallback}</>;
  if (!isAuthenticated) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * SystemAdminOnly component - shows children only to system admins
 */
export function SystemAdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Protected requireSystemAdmin fallback={fallback}>
      {children}
    </Protected>
  );
}
