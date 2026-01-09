import { auth } from '@/auth';
import { hasRole, hasAllRoles } from './permissions';
import { isSystemAdmin } from './role-utils';
import {
  hasResourcePermission,
  hasAnyResourceScope,
  hasAllResourceScopes,
} from './resource-permissions';
import {
  isInGroup,
  isInAnyGroup,
  getDashboardForUser,
  type KeycloakGroup,
} from './role-groups';
import { redirect } from 'next/navigation';
import type { KeycloakResourcePermission } from '@/types/keycloak';

/**
 * Server-side authorization utilities
 *
 * Use these in Server Components, Server Actions, and API Routes.
 * All functions use Keycloak Authorization Services for resource-based permissions.
 */

// ==================== AUTHENTICATION ====================

/**
 * Get current session or throw error
 * @throws Error if user is not authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized - Authentication required');
  }

  return session;
}

/**
 * Require system admin access
 * @throws Error if user is not a system admin
 */
export async function requireSystemAdmin() {
  const session = await requireAuth();

  if (!isSystemAdmin(session.user.roles)) {
    throw new Error('Forbidden - System admin access required');
  }

  return session;
}

// ==================== RESOURCE PERMISSIONS (Keycloak Authorization Services) ====================

/**
 * Require specific resource permission
 * System admin bypasses this check
 *
 * @param resource - Resource name (e.g., "project", "organization")
 * @param scope - Scope/action (e.g., "read", "create", "update", "delete")
 * @throws Error if user doesn't have the required permission
 */
export async function requireResourcePermission(
  resource: string,
  scope: string
) {
  const session = await requireAuth();

  // System admin has all permissions
  if (isSystemAdmin(session.user.roles)) {
    return session;
  }

  const permissions = session.user.resourcePermissions || [];
  if (!hasResourcePermission(permissions, resource, scope)) {
    throw new Error(`Forbidden - Required permission: ${resource}:${scope}`);
  }

  return session;
}

/**
 * Require ANY of the specified scopes on a resource (OR logic)
 * System admin bypasses this check
 *
 * @param resource - Resource name
 * @param scopes - Array of scopes
 * @throws Error if user doesn't have any of the required scopes
 */
export async function requireAnyResourceScope(
  resource: string,
  scopes: string[]
) {
  const session = await requireAuth();

  // System admin has all permissions
  if (isSystemAdmin(session.user.roles)) {
    return session;
  }

  const permissions = session.user.resourcePermissions || [];
  if (!hasAnyResourceScope(permissions, resource, scopes)) {
    throw new Error(
      `Forbidden - Required one of: ${scopes.map((s) => `${resource}:${s}`).join(', ')}`
    );
  }

  return session;
}

/**
 * Require ALL of the specified scopes on a resource (AND logic)
 * System admin bypasses this check
 *
 * @param resource - Resource name
 * @param scopes - Array of scopes
 * @throws Error if user doesn't have all required scopes
 */
export async function requireAllResourceScopes(
  resource: string,
  scopes: string[]
) {
  const session = await requireAuth();

  // System admin has all permissions
  if (isSystemAdmin(session.user.roles)) {
    return session;
  }

  const permissions = session.user.resourcePermissions || [];
  if (!hasAllResourceScopes(permissions, resource, scopes)) {
    throw new Error(
      `Forbidden - Required all: ${scopes.map((s) => `${resource}:${s}`).join(', ')}`
    );
  }

  return session;
}

// ==================== ROLE CHECKS ====================

/**
 * Require specific role(s)
 * System admin bypasses this check
 *
 * @param role - Single role or array of roles (OR logic)
 * @throws Error if user doesn't have required role
 */
export async function requireRole(role: string | string[]) {
  const session = await requireAuth();

  // System admin bypasses role checks
  if (isSystemAdmin(session.user.roles)) {
    return session;
  }

  if (!hasRole(session.user.roles, role)) {
    const roleList = Array.isArray(role) ? role.join(', ') : role;
    throw new Error(`Forbidden - Required role(s): ${roleList}`);
  }

  return session;
}

/**
 * Require ALL specified roles (AND logic)
 * System admin bypasses this check
 *
 * @param roles - Array of roles
 * @throws Error if user doesn't have all required roles
 */
export async function requireAllRoles(roles: string[]) {
  const session = await requireAuth();

  // System admin bypasses role checks
  if (isSystemAdmin(session.user.roles)) {
    return session;
  }

  if (!hasAllRoles(session.user.roles, roles)) {
    throw new Error(`Forbidden - Required all roles: ${roles.join(', ')}`);
  }

  return session;
}

// ==================== GROUP CHECKS ====================

/**
 * Require membership in a specific group
 * System admin bypasses this check
 *
 * @param group - Group name
 * @throws Error if user is not in the group
 */
export async function requireGroup(group: KeycloakGroup) {
  const session = await requireAuth();

  // System admin bypasses group checks
  if (isSystemAdmin(session.user.roles)) {
    return session;
  }

  if (!isInGroup(session.user.groups, group)) {
    throw new Error(`Forbidden - Required group: ${group}`);
  }

  return session;
}

/**
 * Require membership in ANY of the specified groups (OR logic)
 * System admin bypasses this check
 *
 * @param groups - Array of group names
 * @throws Error if user is not in any of the groups
 */
export async function requireAnyGroup(groups: KeycloakGroup[]) {
  const session = await requireAuth();

  // System admin bypasses group checks
  if (isSystemAdmin(session.user.roles)) {
    return session;
  }

  if (!isInAnyGroup(session.user.groups, groups)) {
    throw new Error(`Forbidden - Required one of groups: ${groups.join(', ')}`);
  }

  return session;
}

// ==================== NON-THROWING CHECKS ====================

/**
 * Check if current user has resource permission (without throwing)
 */
export async function canUserResource(
  resource: string,
  scope: string
): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user) return false;
    if (isSystemAdmin(session.user.roles)) return true;
    const permissions = session.user.resourcePermissions || [];
    return hasResourcePermission(permissions, resource, scope);
  } catch {
    return false;
  }
}

/**
 * Check if current user has role (without throwing)
 */
export async function userHasRole(role: string | string[]): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user) return false;
    if (isSystemAdmin(session.user.roles)) return true;
    return hasRole(session.user.roles, role);
  } catch {
    return false;
  }
}

/**
 * Check if current user is in a group (without throwing)
 */
export async function userInGroup(group: KeycloakGroup): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user) return false;
    if (isSystemAdmin(session.user.roles)) return true;
    return isInGroup(session.user.groups, group);
  } catch {
    return false;
  }
}

/**
 * Check if current user is system admin (without throwing)
 */
export async function isUserSystemAdmin(): Promise<boolean> {
  try {
    const session = await auth();
    return isSystemAdmin(session?.user.roles);
  } catch {
    return false;
  }
}

/**
 * Get user's resource permissions
 */
export async function getUserResourcePermissions(): Promise<
  KeycloakResourcePermission[]
> {
  try {
    const session = await auth();
    return session?.user?.resourcePermissions || [];
  } catch {
    return [];
  }
}

/**
 * Get user's dashboard route based on groups/roles
 */
export async function getUserDashboard(): Promise<string> {
  try {
    const session = await auth();
    if (!session?.user) return '/login';
    return getDashboardForUser(session.user.groups, session.user.roles);
  } catch {
    return '/login';
  }
}

// ==================== PAGE AUTHORIZATION ====================

/**
 * Redirect-based authorization for pages
 * Redirects to login if not authenticated
 * Redirects to dashboard if doesn't have permission
 */
export async function requireAuthPage(options?: {
  resource?: { name: string; scope: string };
  role?: string | string[];
  group?: KeycloakGroup;
  requireSystemAdmin?: boolean;
}) {
  const session = await auth();

  // Not authenticated - redirect to login
  if (!session?.user) {
    redirect('/login');
  }

  const userIsSystemAdmin = isSystemAdmin(session.user.roles);
  const userDashboard = getDashboardForUser(
    session.user.groups,
    session.user.roles
  );

  // System admin check
  if (options?.requireSystemAdmin && !userIsSystemAdmin) {
    redirect(`${userDashboard}?error=forbidden`);
  }

  // Resource permission check
  if (options?.resource && !userIsSystemAdmin) {
    const permissions = session.user.resourcePermissions || [];
    if (
      !hasResourcePermission(
        permissions,
        options.resource.name,
        options.resource.scope
      )
    ) {
      redirect(`${userDashboard}?error=forbidden`);
    }
  }

  // Role check
  if (
    options?.role &&
    !userIsSystemAdmin &&
    !hasRole(session.user.roles, options.role)
  ) {
    redirect(`${userDashboard}?error=forbidden`);
  }

  // Group check
  if (
    options?.group &&
    !userIsSystemAdmin &&
    !isInGroup(session.user.groups, options.group)
  ) {
    redirect(`${userDashboard}?error=forbidden`);
  }

  return session;
}

// ==================== API RESPONSE HELPERS ====================

/**
 * API Route helper - returns standardized error response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return Response.json(
    { error: message },
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * API Route helper - returns forbidden response
 */
export function forbiddenResponse(
  message = 'Forbidden - Insufficient permissions'
) {
  return Response.json(
    { error: message },
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
