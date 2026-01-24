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
 * lib/rbac/server-auth
 *
 * Server-side authorization helpers used by Server Components, Server
 * Actions, and API routes. Functions throw descriptive errors that callers
 * can catch and translate into HTTP responses. System admin users bypass
 * scoped checks by design.
 */

// ==================== AUTHENTICATION ====================

/**
 * Get current session or throw error
 * @throws Error if user is not authenticated
 */
/**
 * requireAuth
 *
 * Ensure there is an authenticated session. Throws when no user is
 * authenticated. Use in server-side handlers to enforce authentication.
 *
 * @throws {Error} when the request is not authenticated
 * @returns The current session object when authenticated
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
/**
 * requireSystemAdmin
 *
 * Ensure the current user has system administrator privileges. Throws
 * when the authenticated user is not a system admin.
 *
 * @throws {Error} when the user is not a system administrator
 * @returns The current session when the caller is a system admin
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
/**
 * requireResourcePermission
 *
 * Ensure the authenticated user has the specified resource:scope
 * permission. System admins bypass this check.
 *
 * @param resource - Resource name (e.g., "project")
 * @param scope - Scope/action name (e.g., "read")
 * @throws {Error} when the user lacks the required permission
 * @returns The current session when permitted
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
/**
 * requireAnyResourceScope
 *
 * Require that the user has at least one of the specified scopes on a
 * resource. System admins bypass this check.
 *
 * @param resource - Resource name
 * @param scopes - Array of scope names
 * @throws {Error} when none of the scopes are available for the user
 * @returns The current session when permitted
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
/**
 * requireAllResourceScopes
 *
 * Require that the user has all listed scopes on a resource (AND logic).
 * System admins bypass this check.
 *
 * @param resource - Resource name
 * @param scopes - Array of scope names
 * @throws {Error} when the user lacks any required scope
 * @returns The current session when permitted
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
/**
 * requireRole
 *
 * Require that the current user has at least one of the provided role(s)
 * (OR logic). System admins bypass role checks.
 *
 * @param role - Single role string or array of role strings
 * @throws {Error} when the user does not have any of the required roles
 * @returns The current session when permitted
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
/**
 * requireAllRoles
 *
 * Require that the user has all roles provided (AND logic). System admin
 * bypasses role checks.
 *
 * @param roles - Array of roles required
 * @throws {Error} when the user lacks any required role
 * @returns The current session when permitted
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
/**
 * requireGroup
 *
 * Require membership in a Keycloak group. System admins bypass group
 * checks.
 *
 * @param group - Group name
 * @throws {Error} when the user is not a member of the group
 * @returns The current session when permitted
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
/**
 * requireAnyGroup
 *
 * Require membership in any one of the supplied groups (OR logic).
 * System admins bypass group checks.
 *
 * @param groups - Array of group names
 * @throws {Error} when the user is not in any of the groups
 * @returns The current session when permitted
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
/**
 * canUserResource
 *
 * Non-throwing check for a specific resource:scope permission. Returns
 * `true` when the user has the permission or is a system admin.
 *
 * @param resource - Resource name
 * @param scope - Scope/action name
 * @returns boolean indicating permission presence
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
/**
 * userHasRole
 *
 * Non-throwing role check. Returns `true` when the current user has the
 * requested role(s) or is a system admin.
 *
 * @param role - Role string or array of roles
 * @returns boolean indicating whether user has the role
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
/**
 * userInGroup
 *
 * Non-throwing group membership check. Returns `true` when the user is a
 * member of the provided group or is a system admin.
 *
 * @param group - Group name
 * @returns boolean indicating group membership
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
/**
 * isUserSystemAdmin
 *
 * Non-throwing convenience to determine if the current user is a
 * system administrator.
 *
 * @returns boolean indicating system admin status
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
/**
 * getUserResourcePermissions
 *
 * Retrieve the current user's resource permissions (Keycloak
 * Authorization Services). Returns an empty array on error or when not
 * authenticated.
 *
 * @returns Array of `KeycloakResourcePermission`
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
/**
 * getUserDashboard
 *
 * Determine a user's dashboard route based on groups and roles. Returns
 * `'/'` when the user is not authenticated or on error.
 *
 * @returns Dashboard route string
 */
export async function getUserDashboard(): Promise<string> {
  try {
    const session = await auth();
    if (!session?.user) return '/';
    return getDashboardForUser(session.user.groups, session.user.roles);
  } catch {
    return '/';
  }
}

// ==================== PAGE AUTHORIZATION ====================

/**
 * Redirect-based authorization for pages
 * Redirects to login if not authenticated
 * Redirects to dashboard if doesn't have permission
 */
/**
 * requireAuthPage
 *
 * Page-level authorization helper intended for Server Components that
 * should redirect to the appropriate location when the user lacks
 * authentication or authorization. Redirects to home when unauthenticated
 * and to the user's dashboard with an error query when forbidden.
 *
 * @param options - Optional authorization requirements (resource/role/group)
 * @returns The current session when access is permitted
 */
export async function requireAuthPage(options?: {
  resource?: { name: string; scope: string };
  role?: string | string[];
  group?: KeycloakGroup;
  requireSystemAdmin?: boolean;
}) {
  const session = await auth();

  // Not authenticated - redirect to home
  if (!session?.user) {
    redirect('/');
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
/**
 * unauthorizedResponse
 *
 * Small helper that produces a standardized 401 JSON response usable in
 * API route handlers.
 *
 * @param message - Optional error message
 * @returns `Response` with JSON body and 401 status
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
/**
 * forbiddenResponse
 *
 * Small helper that produces a standardized 403 JSON response usable in
 * API route handlers.
 *
 * @param message - Optional error message
 * @returns `Response` with JSON body and 403 status
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
