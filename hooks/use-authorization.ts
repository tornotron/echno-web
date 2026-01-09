'use client';

import { useSession } from 'next-auth/react';
import { hasRole, hasAllRoles } from '@/lib/rbac/permissions';
import { isSystemAdmin as checkSystemAdmin } from '@/lib/rbac/role-utils';
import {
  hasResourcePermission,
  hasAnyResourceScope,
  hasAllResourceScopes,
  hasResourceAccess,
  getResourceScopes,
} from '@/lib/rbac/resource-permissions';
import {
  isInGroup,
  isInAnyGroup,
  getPrimaryGroup,
  getDashboardForUser,
  type KeycloakGroup,
} from '@/lib/rbac/role-groups';

/**
 * Authorization hook for checking permissions, roles, and groups
 * Use this hook in client components to control UI based on user access
 *
 * Uses Keycloak Authorization Services for resource-based permissions.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { canResource, hasRoles, inGroup, isSystemAdmin } = useAuthorization();
 *
 *   // Resource-based permission check (Keycloak Authorization Services)
 *   if (canResource('project', 'create')) {
 *     return <CreateProjectButton />;
 *   }
 *
 *   // Role-based check
 *   if (hasRoles(['project-manager', 'site-manager'])) {
 *     return <ManagerControls />;
 *   }
 *
 *   // Group-based check
 *   if (inGroup('management')) {
 *     return <ManagerDashboard />;
 *   }
 *
 *   return null;
 * }
 * ```
 */
export function useAuthorization() {
  const { data: session, status } = useSession();

  // Get user data with defaults
  const userRoles = session?.user?.roles || [];
  const userGroups = session?.user?.groups || [];
  const userResourcePermissions = session?.user?.resourcePermissions || [];

  // ==================== RESOURCE PERMISSIONS (Keycloak Authorization Services) ====================

  /**
   * Check if user has a specific scope on a resource
   * This is the recommended way to check permissions with Keycloak Authorization Services
   * System admin always returns true
   *
   * @param resource - Resource name (e.g., "project", "organization")
   * @param scope - Scope/action (e.g., "read", "create", "update", "delete")
   * @returns boolean
   */
  const canResource = (resource: string, scope: string): boolean => {
    if (status !== 'authenticated') return false;
    if (checkSystemAdmin(userRoles)) return true;
    return hasResourcePermission(userResourcePermissions, resource, scope);
  };

  /**
   * Check if user has any of the specified scopes on a resource
   * System admin always returns true
   *
   * @param resource - Resource name
   * @param scopes - Array of scopes (OR logic)
   * @returns boolean
   */
  const canResourceAny = (resource: string, scopes: string[]): boolean => {
    if (status !== 'authenticated') return false;
    if (checkSystemAdmin(userRoles)) return true;
    return hasAnyResourceScope(userResourcePermissions, resource, scopes);
  };

  /**
   * Check if user has all of the specified scopes on a resource
   * System admin always returns true
   *
   * @param resource - Resource name
   * @param scopes - Array of scopes (AND logic)
   * @returns boolean
   */
  const canResourceAll = (resource: string, scopes: string[]): boolean => {
    if (status !== 'authenticated') return false;
    if (checkSystemAdmin(userRoles)) return true;
    return hasAllResourceScopes(userResourcePermissions, resource, scopes);
  };

  /**
   * Check if user has access to a resource (any scope)
   * System admin always returns true
   *
   * @param resource - Resource name
   * @returns boolean
   */
  const hasResource = (resource: string): boolean => {
    if (status !== 'authenticated') return false;
    if (checkSystemAdmin(userRoles)) return true;
    return hasResourceAccess(userResourcePermissions, resource);
  };

  /**
   * Get all scopes user has on a resource
   *
   * @param resource - Resource name
   * @returns Array of scopes
   */
  const getScopesForResource = (resource: string): string[] => {
    if (status !== 'authenticated') return [];
    if (checkSystemAdmin(userRoles)) {
      // System admin has all scopes
      return [
        'read',
        'create',
        'update',
        'delete',
        'manage',
        'approve',
        'assign',
      ];
    }
    return getResourceScopes(userResourcePermissions, resource);
  };

  // ==================== ROLE CHECKS ====================

  /**
   * Check if user has a specific role (or any role if array)
   * System admin always returns true
   *
   * @param role - Single role or array of roles (OR logic)
   * @returns boolean
   */
  const checkRoles = (role: string | string[]): boolean => {
    if (status !== 'authenticated') return false;
    if (checkSystemAdmin(userRoles)) return true;
    return hasRole(userRoles, role);
  };

  /**
   * Check if user has ALL specified roles (AND logic)
   * System admin always returns true
   *
   * @param roles - Array of roles
   * @returns boolean
   */
  const hasEveryRole = (roles: string[]): boolean => {
    if (status !== 'authenticated') return false;
    if (checkSystemAdmin(userRoles)) return true;
    return hasAllRoles(userRoles, roles);
  };

  // ==================== GROUP CHECKS ====================

  /**
   * Check if user is in a specific group
   *
   * @param group - Group name (e.g., "management", "engineering")
   * @returns boolean
   */
  const inGroup = (group: KeycloakGroup): boolean => {
    if (status !== 'authenticated') return false;
    return isInGroup(userGroups, group);
  };

  /**
   * Check if user is in any of the specified groups
   *
   * @param groups - Array of group names (OR logic)
   * @returns boolean
   */
  const inAnyGroup = (groups: KeycloakGroup[]): boolean => {
    if (status !== 'authenticated') return false;
    return isInAnyGroup(userGroups, groups);
  };

  /**
   * Get user's primary group (highest priority)
   */
  const primaryGroup = getPrimaryGroup(userGroups);

  /**
   * Get the dashboard route for the current user based on groups/roles
   */
  const dashboardRoute = getDashboardForUser(userGroups, userRoles);

  // ==================== STATUS CHECKS ====================

  /**
   * Check if current user is system admin
   */
  const isSystemAdmin = checkSystemAdmin(userRoles);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = status === 'authenticated';

  /**
   * Check if auth is loading
   */
  const isLoading = status === 'loading';

  // ==================== USER DATA ====================

  /**
   * Get user's roles
   */
  const roles = userRoles;

  /**
   * Get user's groups
   */
  const groups = userGroups;

  /**
   * Get user's resource permissions
   */
  const resourcePermissions = userResourcePermissions;

  /**
   * Get user info
   */
  const user = session?.user;

  return {
    // Resource permission checks (Keycloak Authorization Services)
    canResource,
    canResourceAny,
    canResourceAll,
    hasResource,
    getScopesForResource,

    // Role checks
    hasRoles: checkRoles,
    hasEveryRole,

    // Group checks
    inGroup,
    inAnyGroup,
    primaryGroup,
    dashboardRoute,

    // Status checks
    isSystemAdmin,
    isAuthenticated,
    isLoading,

    // User data
    roles,
    groups,
    resourcePermissions,
    user,
    session,
  };
}

/**
 * Alias for useAuthorization for convenience
 */
export const usePermissions = useAuthorization;
