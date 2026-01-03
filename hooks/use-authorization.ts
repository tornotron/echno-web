'use client';

import { useSession } from 'next-auth/react';
import { Permission } from '@/types/rbac/permission';
import {
  hasPermission,
  hasAnyPermission,
  hasRole,
  hasAllRoles,
  getRolePermissions,
} from '@/lib/rbac/permissions';
import { isSystemAdmin as checkSystemAdmin } from '@/lib/rbac/role-utils';

/**
 * Authorization hook for checking permissions and roles
 * Use this hook in client components to control UI based on user permissions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { can, hasRoles, isSystemAdmin } = useAuthorization();
 *
 *   if (can(Permission.PROJECT_CREATE)) {
 *     return <CreateProjectButton />;
 *   }
 *
 *   if (hasRoles(['projectManager', 'siteManager'])) {
 *     return <ManagerDashboard />;
 *   }
 *
 *   return null;
 * }
 * ```
 */
export function useAuthorization() {
  const { data: session, status } = useSession();

  /**
   * Check if user has a specific permission (or all permissions if array)
   * System admin always returns true
   *
   * @param permission - Single permission or array of permissions (AND logic)
   * @returns boolean
   */
  const can = (permission: Permission | Permission[]): boolean => {
    if (status !== 'authenticated' || !session?.user.roles) return false;
    if (checkSystemAdmin(session.user.roles)) return true;
    const permissions = getRolePermissions(session.user.roles);
    return hasPermission(permissions, permission);
  };

  /**
   * Check if user has ANY of the specified permissions (OR logic)
   * System admin always returns true
   *
   * @param permissions - Array of permissions
   * @returns boolean
   */
  const canAny = (permissions: Permission[]): boolean => {
    if (status !== 'authenticated' || !session?.user.roles) return false;
    if (checkSystemAdmin(session.user.roles)) return true;
    const userPermissions = getRolePermissions(session.user.roles);
    return hasAnyPermission(userPermissions, permissions);
  };

  /**
   * Check if user has a specific role (or any role if array)
   * System admin always returns true
   *
   * @param role - Single role or array of roles (OR logic)
   * @returns boolean
   */
  const hasRoles = (role: string | string[]): boolean => {
    if (status !== 'authenticated' || !session?.user.roles) return false;
    if (checkSystemAdmin(session.user.roles)) return true;
    return hasRole(session.user.roles, role);
  };

  /**
   * Check if user has ALL specified roles (AND logic)
   * System admin always returns true
   *
   * @param roles - Array of roles
   * @returns boolean
   */
  const hasEveryRole = (roles: string[]): boolean => {
    if (status !== 'authenticated' || !session?.user.roles) return false;
    if (checkSystemAdmin(session.user.roles)) return true;
    return hasAllRoles(session.user.roles, roles);
  };

  /**
   * Check if current user is system admin
   */
  const isSystemAdmin = checkSystemAdmin(session?.user.roles);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = status === 'authenticated';

  /**
   * Check if auth is loading
   */
  const isLoading = status === 'loading';

  /**
   * Get user's roles
   */
  const roles = session?.user.roles || [];

  /**
   * Get user's permissions (computed from roles)
   */
  const permissions = session?.user.roles
    ? getRolePermissions(session.user.roles)
    : [];

  /**
   * Get user info
   */
  const user = session?.user;

  return {
    // Permission checks
    can,
    canAny,

    // Role checks
    hasRoles,
    hasEveryRole,

    // Status checks
    isSystemAdmin,
    isAuthenticated,
    isLoading,

    // User data
    roles,
    permissions,
    user,
    session,
  };
}

/**
 * Alias for useAuthorization for convenience
 */
export const usePermissions = useAuthorization;
