'use client';

import { useAuthorization } from '@/hooks/use-authorization';
import { KeycloakGroup } from '@/lib/rbac/role-groups';
import { ReactNode } from 'react';

/**
 * Resource permission specification
 * @example { resource: 'project', scope: 'create' }
 * @example { resource: 'project', scopes: ['read', 'update'], requireAll: false }
 */
interface ResourcePermission {
  /** Resource name (e.g., "project", "organization") */
  resource: string;
  /** Single scope to check */
  scope?: string;
  /** Multiple scopes to check */
  scopes?: string[];
  /** If true, require all scopes (AND). If false, require any scope (OR). Default: false */
  requireAll?: boolean;
}

interface ProtectedProps {
  /**
   * Resource permission check (Keycloak Authorization Services)
   * @example resource={{ resource: 'project', scope: 'create' }}
   * @example resource={{ resource: 'project', scopes: ['read', 'update'] }}
   */
  resource?: ResourcePermission;

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
   * Group(s) required to view content
   * - Single group: User must be in this group
   * - Array of groups: User needs to be in ANY group (OR logic)
   */
  group?: KeycloakGroup | KeycloakGroup[];

  /**
   * Require system admin access
   */
  requireSystemAdmin?: boolean;

  /**
   * Combination logic when multiple checks are provided
   * If true: User must meet ALL requirements (AND logic)
   * If false: User must meet ANY requirement (OR logic)
   * @default false
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
 * Protected component for conditionally rendering based on permissions, roles, or groups
 *
 * Uses Keycloak Authorization Services for resource-based permissions.
 *
 * @example
 * ```tsx
 * // Show only to users with specific resource permission
 * <Protected resource={{ resource: 'project', scope: 'create' }}>
 *   <CreateProjectButton />
 * </Protected>
 *
 * // Show to users with ANY of these scopes on a resource
 * <Protected resource={{ resource: 'project', scopes: ['read', 'update'] }}>
 *   <ProjectEditor />
 * </Protected>
 *
 * // Show to users with ALL scopes on a resource
 * <Protected resource={{ resource: 'project', scopes: ['read', 'update'], requireAll: true }}>
 *   <ProjectEditor />
 * </Protected>
 *
 * // Show to users with specific role
 * <Protected role="project-manager">
 *   <ManagerControls />
 * </Protected>
 *
 * // Show to users in a specific group
 * <Protected group="management">
 *   <ManagerDashboard />
 * </Protected>
 *
 * // Show only to system admin
 * <Protected requireSystemAdmin>
 *   <AdminPanel />
 * </Protected>
 *
 * // Combine resource permission AND role
 * <Protected
 *   resource={{ resource: 'project', scope: 'delete' }}
 *   role="project-manager"
 *   requireAll={true}
 * >
 *   <DeleteButton />
 * </Protected>
 *
 * // With custom fallback
 * <Protected
 *   resource={{ resource: 'finance', scope: 'read' }}
 *   fallback={<div>You don't have access to finance data</div>}
 * >
 *   <FinanceReport />
 * </Protected>
 * ```
 */
export function Protected({
  resource,
  role,
  allRoles,
  group,
  requireSystemAdmin = false,
  requireAll = false,
  fallback = null,
  loading = null,
  children,
}: ProtectedProps) {
  const {
    canResource,
    canResourceAny,
    canResourceAll,
    hasRoles,
    hasEveryRole,
    inGroup,
    inAnyGroup,
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

  // Collect all access checks
  const accessChecks: boolean[] = [];

  // Check resource permissions
  if (resource !== undefined) {
    let hasResourceAccess = false;

    if (resource.scope) {
      // Single scope check
      hasResourceAccess = canResource(resource.resource, resource.scope);
    } else if (resource.scopes && resource.scopes.length > 0) {
      // Multiple scopes check
      hasResourceAccess = resource.requireAll
        ? canResourceAll(resource.resource, resource.scopes)
        : canResourceAny(resource.resource, resource.scopes);
    }

    accessChecks.push(hasResourceAccess);
  }

  // Check roles
  if (role !== undefined) {
    accessChecks.push(hasRoles(role));
  } else if (allRoles !== undefined) {
    accessChecks.push(hasEveryRole(allRoles));
  }

  // Check groups
  if (group !== undefined) {
    if (Array.isArray(group)) {
      accessChecks.push(inAnyGroup(group));
    } else {
      accessChecks.push(inGroup(group));
    }
  }

  // Determine final access
  let hasAccess = false;

  if (accessChecks.length === 0) {
    // No checks specified, allow if authenticated
    hasAccess = true;
  } else if (requireAll) {
    // AND logic: all checks must pass
    hasAccess = accessChecks.every(Boolean);
  } else {
    // OR logic: any check must pass
    hasAccess = accessChecks.some(Boolean);
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
