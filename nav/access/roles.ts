/**
 * nav/access/roles.ts
 *
 * Role and permission type definitions for the navigation access control system.
 * Invalid roles/permissions fail at compile time via exhaustive literal types.
 */

import { OrgRole } from '@tornotron/echno-core/employee/types';

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
  | 'inspections:read'
  | 'inspections:manage'
  | 'bim:view'
  | 'bim:manage'
  | 'toolbox-talks:read'
  | 'toolbox-talks:manage';

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

  /**
   * Backend org roles (from `Employee.orgRoles`) at least one of which the
   * reader must hold. Use this when the backend gates a page on a specific
   * Keycloak role such as `store-keeper` that the coarse `Role` tiers cannot
   * name. Evaluated in addition to `allowRoles`, never instead of it, and
   * matched exactly: a tier does not imply an org role, so an admin-tier
   * DIRECTOR does not pass a STORE_KEEPER gate. Fail-closed: when the caller
   * supplies no `orgRoles` in its context, a config that names any is denied.
   */
  allowOrgRoles?: OrgRole[];

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

/**
 * The store documents (materials, goods receipts, purchase orders, indents,
 * site transfers, material consumptions). Mirrors the backend read threshold
 * settled on echno-backend #650: `store-keeper`, `project-manager` or
 * `system-admin`. Anyone else 403s on the list endpoint, so the sidebar must
 * not offer them the link.
 */
export const STORES_ACCESS: AccessConfig = {
  allowOrgRoles: [
    OrgRole.STORE_KEEPER,
    OrgRole.PROJECT_MANAGER,
    OrgRole.SYSTEM_ADMIN,
  ],
} as const;

/**
 * The billing surface. The backend gates every `/billing/subscriptions/web/*`
 * and `/billing/checkout/web/*` call to `system-admin` (echno-web #456), a
 * narrower set than the `admin` tier (which also holds directors), so this
 * names the org role exactly.
 */
export const BILLING_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN],
} as const;

// ---------------------------------------------------------------------------
// Roles-matrix gates (echno-backend #853)
// ---------------------------------------------------------------------------
//
// Each constant below names, as exact org roles, the guard the backend puts on
// one row of the roles matrix (echno-docs, admin guide, "Roles and
// permissions"). They are written against org roles rather than the coarse
// `Role` tiers because the tiers are lossy: `manager` also holds SITE_MANAGER
// and HR_ADMIN and `admin` also holds DIRECTOR, none of which the backend
// admits on these rows. A gate on the tier would offer a button that 403s.

/**
 * Writes on projects, tasks and issues: `hasAnyOrgRoleForCurrentTenant(
 * 'system-admin','project-manager')` on create, update and delete. Reads on
 * all three are open to any member, so this gates the affordance, not the page.
 */
export const PROJECT_WRITE_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN, OrgRole.PROJECT_MANAGER],
} as const;

/**
 * Construction invoices. Every mapping on `ConstructionInvoiceControllerWeb`,
 * the list and the PDF included, is `system-admin` or `project-manager`, so
 * this gates the whole surface: list, detail, forms and the download.
 */
export const CONSTRUCTION_INVOICES_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN, OrgRole.PROJECT_MANAGER],
} as const;

/**
 * Creating, editing and deleting a storage location is `system-admin` alone
 * on the backend. Reading the list is the stores tier ({@link STORES_ACCESS}).
 */
export const STORAGE_LOCATION_WRITE_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN],
} as const;

/**
 * Registering, editing and deleting an asset, and recording a movement on
 * one, is `system-admin` or `project-manager`. Any member reads the register.
 */
export const ASSET_WRITE_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN, OrgRole.PROJECT_MANAGER],
} as const;

/**
 * Approving, rejecting or deleting a stock adjustment. Raising and editing a
 * draft, and reading the list, is the stores tier ({@link STORES_ACCESS});
 * the decision is the narrower pair, and the backend also refuses the raiser.
 */
export const STOCK_ADJUSTMENT_DECIDE_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN, OrgRole.PROJECT_MANAGER],
} as const;

/**
 * Reading the vendor register (list, detail, search and contacts). The store
 * reads who delivers and how to reach them; the commercial detail on a vendor
 * (summary, tax identifiers, bank accounts, payment terms) and every write is
 * {@link VENDOR_WRITE_ACCESS}.
 */
export const VENDOR_READ_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN, OrgRole.STORE_KEEPER],
} as const;

/** Creating, editing and deleting a vendor, and its commercial detail. */
export const VENDOR_WRITE_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN],
} as const;

/**
 * The labour register, reads and writes alike: `system-admin` or `hr-admin`
 * on every mapping of `LabourControllerWeb`.
 */
export const LABOUR_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN, OrgRole.HR_ADMIN],
} as const;

/**
 * Creating, editing and deleting a sub-contract is `system-admin` or
 * `project-manager`. Any member reads them.
 */
export const SUB_CONTRACT_WRITE_ACCESS: AccessConfig = {
  allowOrgRoles: [OrgRole.SYSTEM_ADMIN, OrgRole.PROJECT_MANAGER],
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
 * authenticated role gets `inspections:read` since the actual gate for a
 * disabled/unentitled module is the moduleId check in `evaluate.ts`, backed
 * by the backend's enabled-module descriptor, not this permission. This
 * mapping only needs to be real business policy once a role or user should
 * be denied a permission other roles hold; today none is.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'inspections:read',
    'inspections:manage',
    'bim:view',
    'bim:manage',
    'toolbox-talks:read',
    'toolbox-talks:manage',
  ],
  manager: [
    'inspections:read',
    'inspections:manage',
    'bim:view',
    'bim:manage',
    'toolbox-talks:read',
    'toolbox-talks:manage',
  ],
  employee: ['inspections:read', 'bim:view', 'toolbox-talks:read'],
};

/** Returns the permissions granted to a role, or none for an unauthenticated user. */
export function getPermissionsForRole(role?: Role): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role];
}
