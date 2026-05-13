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
  | 'settings:manage';

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
