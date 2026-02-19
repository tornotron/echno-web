import { auth } from '@/auth';
import { hasRole, hasAllRoles } from './permissions';
import { isSystemAdmin } from './role-utils';
import { redirect } from 'next/navigation';
import { parseEmployee } from '@/types/employee/employee';

/**
 * lib/rbac/server-auth
 *
 * Server-side authorization helpers used by Server Components, Server
 * Actions, and API routes. Authorization is now based on employee.orgRoles
 * fetched from the backend API instead of JWT claims.
 */

// ==================== HELPERS ====================

/**
 * Fetch the current employee's orgRoles from the backend.
 * Uses the session access token for authentication.
 */
async function fetchEmployeeRoles(
  accessToken: string
): Promise<{ orgRoles: string[] }> {
  try {
    const backendUrl =
      process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
    const response = await fetch(`${backendUrl}/user/web/employees`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { orgRoles: [] };
    }

    const data = await response.json();

    // The endpoint returns an array of employee objects.
    // We need the one matching the user's default organization.
    // For server-side, we pick the first employee or the one matching.
    if (Array.isArray(data) && data.length > 0) {
      const employee = parseEmployee(data[0]);
      return {
        orgRoles: employee.orgRoles ?? [],
      };
    }

    return { orgRoles: [] };
  } catch {
    return { orgRoles: [] };
  }
}

// ==================== AUTHENTICATION ====================

/**
 * Ensure there is an authenticated session.
 * @throws {Error} when the request is not authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized - Authentication required');
  }

  return session;
}

// ==================== ROLE CHECKS (Employee-Based) ====================

/**
 * Require system admin access.
 * Fetches employee orgRoles from backend to verify.
 * @throws {Error} when the user is not a system admin
 */
export async function requireSystemAdmin() {
  const session = await requireAuth();

  if (!session.accessToken) {
    throw new Error('Forbidden - No access token available');
  }

  const { orgRoles } = await fetchEmployeeRoles(session.accessToken);

  if (!isSystemAdmin(orgRoles)) {
    throw new Error('Forbidden - System admin access required');
  }

  return session;
}

/**
 * Require specific role(s) (OR logic).
 * Fetches employee orgRoles from backend.
 * @throws {Error} when the user doesn't have any required role
 */
export async function requireRole(role: string | string[]) {
  const session = await requireAuth();

  if (!session.accessToken) {
    throw new Error('Forbidden - No access token available');
  }

  const { orgRoles } = await fetchEmployeeRoles(session.accessToken);

  // System admin bypasses role checks
  if (isSystemAdmin(orgRoles)) {
    return session;
  }

  if (!hasRole(orgRoles, role)) {
    const roleList = Array.isArray(role) ? role.join(', ') : role;
    throw new Error(`Forbidden - Required role(s): ${roleList}`);
  }

  return session;
}

/**
 * Require ALL specified roles (AND logic).
 * Fetches employee orgRoles from backend.
 * @throws {Error} when the user doesn't have all required roles
 */
export async function requireAllRoles(roles: string[]) {
  const session = await requireAuth();

  if (!session.accessToken) {
    throw new Error('Forbidden - No access token available');
  }

  const { orgRoles } = await fetchEmployeeRoles(session.accessToken);

  // System admin bypasses role checks
  if (isSystemAdmin(orgRoles)) {
    return session;
  }

  if (!hasAllRoles(orgRoles, roles)) {
    throw new Error(`Forbidden - Required all roles: ${roles.join(', ')}`);
  }

  return session;
}

// ==================== NON-THROWING CHECKS ====================

/**
 * Check if current user has a role (without throwing).
 */
export async function userHasRole(role: string | string[]): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user || !session.accessToken) return false;

    const { orgRoles } = await fetchEmployeeRoles(session.accessToken);
    if (isSystemAdmin(orgRoles)) return true;
    return hasRole(orgRoles, role);
  } catch {
    return false;
  }
}

/**
 * Check if current user is system admin (without throwing).
 */
export async function isUserSystemAdmin(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.accessToken) return false;

    const { orgRoles } = await fetchEmployeeRoles(session.accessToken);
    return isSystemAdmin(orgRoles);
  } catch {
    return false;
  }
}

// ==================== PAGE AUTHORIZATION ====================

/**
 * Page-level authorization helper.
 * Redirects to home when unauthenticated and to dashboard when forbidden.
 */
export async function requireAuthPage(options?: {
  role?: string | string[];
  requireSystemAdmin?: boolean;
}) {
  const session = await auth();

  // Not authenticated - redirect to home
  if (!session?.user) {
    redirect('/');
  }

  if (!options) return session;

  const accessToken = session.accessToken;
  if (!accessToken) {
    redirect('/users/dashboard?error=forbidden');
  }

  const { orgRoles } = await fetchEmployeeRoles(accessToken);
  const userIsSystemAdmin = isSystemAdmin(orgRoles);

  // System admin check
  if (options.requireSystemAdmin && !userIsSystemAdmin) {
    redirect('/users/dashboard?error=forbidden');
  }

  // Role check
  if (options.role && !userIsSystemAdmin && !hasRole(orgRoles, options.role)) {
    redirect('/users/dashboard?error=forbidden');
  }

  return session;
}

// ==================== API RESPONSE HELPERS ====================

/**
 * Standardized 401 JSON response.
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
 * Standardized 403 JSON response.
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
