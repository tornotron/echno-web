import { auth } from '@/auth';
import { Permission } from '@/types/rbac/permission';
import {
  hasPermission,
  hasAnyPermission,
  hasRole,
  hasAllRoles,
  getRolePermissions,
} from './permissions';
import { isSystemAdmin } from './role-utils';
import { redirect } from 'next/navigation';

/**
 * Server-side authorization utilities
 * Use these in Server Components, Server Actions, and API Routes
 */

/**
 * Helper: Get permissions from user roles
 * Permissions are computed from roles to reduce session cookie size
 */
function getUserPermissions(roles: string[] | undefined): Permission[] {
  if (!roles) return [];
  return getRolePermissions(roles);
}

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
 * Require specific permission(s)
 * System admin bypasses this check
 *
 * @param permission - Single permission or array of permissions (AND logic)
 * @throws Error if user doesn't have required permission
 */
export async function requirePermission(permission: Permission | Permission[]) {
  const session = await requireAuth();

  // System admin has all permissions
  if (isSystemAdmin(session.user.roles)) {
    return session;
  }

  const permissions = getUserPermissions(session.user.roles);
  if (!hasPermission(permissions, permission)) {
    const permList = Array.isArray(permission)
      ? permission.join(', ')
      : permission;
    throw new Error(`Forbidden - Required permission(s): ${permList}`);
  }

  return session;
}

/**
 * Require ANY of the specified permissions (OR logic)
 * System admin bypasses this check
 *
 * @param permissions - Array of permissions
 * @throws Error if user doesn't have any of the required permissions
 */
export async function requireAnyPermission(permissions: Permission[]) {
  const session = await requireAuth();

  // System admin has all permissions
  if (isSystemAdmin(session.user.roles)) {
    return session;
  }

  const userPermissions = getUserPermissions(session.user.roles);
  if (!hasAnyPermission(userPermissions, permissions)) {
    throw new Error(`Forbidden - Required one of: ${permissions.join(', ')}`);
  }

  return session;
}

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

/**
 * Check if current user has permission (without throwing)
 * Returns true/false
 */
export async function canUser(
  permission: Permission | Permission[]
): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user) return false;
    if (isSystemAdmin(session.user.roles)) return true;
    const permissions = getUserPermissions(session.user.roles);
    return hasPermission(permissions, permission);
  } catch {
    return false;
  }
}

/**
 * Check if current user has role (without throwing)
 * Returns true/false
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
 * Check if current user is system admin (without throwing)
 * Returns true/false
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
 * Redirect-based authorization for pages
 * Redirects to login if not authenticated
 * Redirects to dashboard if doesn't have permission
 */
export async function requireAuthPage(options?: {
  permission?: Permission | Permission[];
  role?: string | string[];
  requireSystemAdmin?: boolean;
}) {
  const session = await auth();

  // Not authenticated - redirect to login
  if (!session?.user) {
    redirect('/login');
  }

  const userIsSystemAdmin = isSystemAdmin(session.user.roles);

  // System admin check
  if (options?.requireSystemAdmin && !userIsSystemAdmin) {
    redirect('/users/dashboard?error=forbidden');
  }

  // Permission check
  if (options?.permission && !userIsSystemAdmin) {
    const permissions = getUserPermissions(session.user.roles);
    if (!hasPermission(permissions, options.permission)) {
      redirect('/users/dashboard?error=forbidden');
    }
  }

  // Role check
  if (
    options?.role &&
    !userIsSystemAdmin &&
    !hasRole(session.user.roles, options.role)
  ) {
    redirect('/users/dashboard?error=forbidden');
  }

  return session;
}

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
