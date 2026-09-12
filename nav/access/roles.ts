/**
 * nav/access/roles.ts
 *
 * Role and permission type definitions for the navigation access control system.
 * Invalid roles/permissions fail at compile time via exhaustive literal types.
 */

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export type Role = 'admin' | 'manager' | 'employee';

export const ROLES = ['admin', 'manager', 'employee'] as const satisfies Role[];

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export type Permission =
  | 'attendance:view'
  | 'attendance:manage'
  | 'employees:view'
  | 'employees:manage'
  | 'leaves:view'
  | 'leaves:manage'
  | 'leaves:approve'
  | 'projects:view'
  | 'projects:manage'
  | 'finance:view'
  | 'finance:manage'
  | 'resources:view'
  | 'resources:manage'
  | 'third-party:view'
  | 'third-party:manage'
  | 'organizations:view'
  | 'organizations:manage'
  | 'chat:view'
  | 'settings:view'
  | 'settings:manage'
  | 'inspections:view'
  | 'inspections:manage';

// ---------------------------------------------------------------------------
// Access config
// ---------------------------------------------------------------------------

export interface AccessConfig {
  /**
   * Roles explicitly allowed. If empty or undefined, all authenticated
   * users are allowed (subject to denyRoles).
   */
  allowRoles?: Role[];

  /** Roles explicitly denied. Takes precedence over allowRoles. */
  denyRoles?: Role[];

  /** All listed permissions must be satisfied. */
  permissions?: Permission[];

  /** Requires authentication but no specific role. Defaults to true for all nav items. */
  requireAuth?: boolean;
}

/** Open-access config constant (no restrictions). */
export const OPEN_ACCESS: AccessConfig = {} as const;

/** Admin-only access config constant. */
export const ADMIN_ONLY: AccessConfig = { allowRoles: ['admin'] } as const;

/** Manager and above access config constant. */
export const MANAGER_AND_ABOVE: AccessConfig = {
  allowRoles: ['admin', 'manager'],
} as const;

// ---------------------------------------------------------------------------
// Role -> permission mapping
// ---------------------------------------------------------------------------

/**
 * The permissions each role grants, so `AccessConfig.permissions` has real
 * data to check against instead of always seeing an empty set (the bug this
 * closes: `permissions` was declared on `AccessConfig` but nothing ever
 * populated `AccessContext.permissions`, so it silently never gated anything).
 *
 * There is no fine-grained per-user permission source yet (only `orgRoles`
 * from the employee record) — the backend has no permissions endpoint or
 * claim to read. Until that exists, this is a role-derived stand-in: every
 * authenticated role gets `inspections:view` since the actual gate for a
 * disabled/unentitled module is the moduleId check in `evaluate.ts`, backed
 * by the backend's enabled-module descriptor, not this permission. This
 * mapping only needs to be real business policy once a role or user should
 * be denied a permission other roles hold; today none is.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['inspections:view', 'inspections:manage'],
  manager: ['inspections:view', 'inspections:manage'],
  employee: ['inspections:view'],
};

/** Returns the permissions granted to a role, or none for an unauthenticated user. */
export function getPermissionsForRole(role?: Role): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role];
}
