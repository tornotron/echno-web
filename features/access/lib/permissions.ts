/**
 * The Roles & Permissions screen's view of the access matrix. The records
 * come from echno-core (`@tornotron/echno-core/access/types`); this file
 * turns a role's grant list into the per-area cells the matrix edits, and
 * works out which choices the screen may offer.
 *
 * A grant is one `<area>:<action>` at one scope. A cell is every action a
 * role holds on one area, each with its scope.
 *
 * The screen offers only what the backend enforces and what the caller may
 * give. The rest of a cell (a grant on an action no guard checks yet, or one
 * the caller does not hold) is kept exactly as it is, because a grant write
 * replaces the role's whole set and the backend refuses to add either kind.
 */

import {
  holdsPermission,
  offeredScopes,
  type AccessArea,
  type AccessCatalog,
  type AccessGrant,
  type AccessGrantRequest,
  type AccessRole,
  type AccessUser,
  type CurrentUserAccess,
} from '@tornotron/echno-core/access/types';

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

/** One cell of the matrix: each action held on an area, with its scope. */
export type AreaGrants = Record<string, string>;

/** Every cell of a role, keyed by area id. An area with nothing held is absent. */
export type PermissionMap = Record<string, AreaGrants>;

/** The scope a new grant gets: the widest. */
export const DEFAULT_SCOPE = 'ALL';

/** `assets:create` as `['assets', 'create']`. */
export function splitPermission(permission: string): [string, string] {
  const i = permission.indexOf(':');
  return i === -1
    ? [permission, '']
    : [permission.slice(0, i), permission.slice(i + 1)];
}

/**
 * Groups a grant list into cells. Should an action be held at two scopes,
 * the wider one (earlier in `scopes`) is kept.
 */
export function toPermissionMap(
  grants: readonly Pick<AccessGrant, 'permission' | 'scope'>[],
  scopes: readonly string[] = []
): PermissionMap {
  const rank = (s: string) => {
    const i = scopes.indexOf(s);
    return i === -1 ? scopes.length : i;
  };
  const map: PermissionMap = {};
  for (const { permission, scope } of grants) {
    const [area, action] = splitPermission(permission);
    const cell = (map[area] ??= {});
    const held = cell[action];
    if (held === undefined || rank(scope) < rank(held)) cell[action] = scope;
  }
  return map;
}

/** The grant list a write sends for `map`. */
export function toGrantRequests(map: PermissionMap): AccessGrantRequest[] {
  return Object.entries(map).flatMap(([area, cell]) =>
    Object.entries(cell).map(([action, scope]) => ({
      permission: `${area}:${action}`,
      scope,
    }))
  );
}

/** Whether two maps hold the same actions at the same scopes. */
export function samePermissions(a: PermissionMap, b: PermissionMap): boolean {
  const key = (m: PermissionMap) =>
    toGrantRequests(m)
      .map((g) => `${g.permission}@${g.scope}`)
      .toSorted()
      .join(',');
  return key(a) === key(b);
}

/** `map` with `area` set to `cell`, dropping the area when the cell is empty. */
export function setCell(
  map: PermissionMap,
  area: string,
  cell: AreaGrants
): PermissionMap {
  const next = { ...map };
  if (Object.keys(cell).length > 0) next[area] = cell;
  else delete next[area];
  return next;
}

/** The actions of `cell` the screen shows: the enforced ones, in the area's order. */
export function shownActions(
  area: Pick<AccessArea, 'enforcedActions'>,
  cell: AreaGrants | undefined
): string[] {
  if (!cell) return [];
  return area.enforcedActions.filter((a) => a in cell);
}

/** The one scope of `actions` in `cell`, `'MIXED'` when they differ, or undefined for none. */
export function cellScope(
  cell: AreaGrants | undefined,
  actions: readonly string[]
): string | undefined {
  const scopes = new Set(actions.map((a) => cell?.[a]).filter(Boolean));
  if (scopes.size === 0) return undefined;
  return scopes.size === 1 ? [...scopes][0] : 'MIXED';
}

/**
 * The cell after the caller picks `chosen` among the actions they were
 * `offered`. Everything else in the cell stays as it is. Any action brings
 * `read` with it when `read` is offered (the backend adds it anyway). An
 * action already held keeps its scope; a new one takes the cell's scope, or
 * `scope` when the cell holds no offered action or mixes scopes.
 */
export function withChosen(
  area: Pick<AccessArea, 'actions'>,
  cell: AreaGrants | undefined,
  chosen: readonly string[],
  offered: readonly string[],
  scope: string = DEFAULT_SCOPE
): AreaGrants {
  const next: AreaGrants = {};
  for (const [action, held] of Object.entries(cell ?? {})) {
    if (!offered.includes(action)) next[action] = held;
  }
  const wanted = new Set(chosen.filter((a) => offered.includes(a)));
  if (wanted.size > 0 && offered.includes('read')) wanted.add('read');
  const current = cellScope(cell, offered);
  const fallback = current && current !== 'MIXED' ? current : scope;
  for (const action of area.actions) {
    if (wanted.has(action)) next[action] = cell?.[action] ?? fallback;
  }
  return next;
}

/** The cell with every offered action it holds at `scope`; the rest stays. */
export function withScope(
  cell: AreaGrants,
  offered: readonly string[],
  scope: string
): AreaGrants {
  return Object.fromEntries(
    Object.entries(cell).map(([action, held]) => [
      action,
      offered.includes(action) ? scope : held,
    ])
  );
}

/** The areas the screen shows: those with at least one enforced action. */
export function shownAreas(catalog: AccessCatalog | undefined): AccessArea[] {
  return (catalog?.areas ?? []).filter((a) => a.enforcedActions.length > 0);
}

/** The catalog's sections that hold a shown area, in the catalog's order. */
export function shownSections(
  catalog: AccessCatalog | undefined,
  areas: readonly AccessArea[]
): string[] {
  return (catalog?.sections ?? []).filter((s) =>
    areas.some((a) => a.section === s)
  );
}

export { offeredScopes } from '@tornotron/echno-core/access/types';

// ---------------------------------------------------------------------------
// What the caller may do
// ---------------------------------------------------------------------------

/** The signed-in member's standing on the screen. */
export interface AccessStanding {
  access: CurrentUserAccess | undefined;
  /** May open the screen (`access:read`). */
  canRead: boolean;
  /** May change anything on it (`access:edit`). */
  canEdit: boolean;
  /** May change the baseline role's grants (`access:edit-employee-role`). */
  canEditBaseline: boolean;
  /** The roles the caller holds, the baseline included. */
  held: Set<string>;
  /** The roles the caller's roles may assign, and so change. */
  assignable: Set<string>;
}

/**
 * Works out the caller's standing from their access and their own row on the
 * Users tab. Mirrors the backend's rules 1 and 4; the backend still checks
 * every write.
 */
export function standingOf(
  access: CurrentUserAccess | undefined,
  users: readonly AccessUser[],
  roles: readonly AccessRole[]
): AccessStanding {
  const me = users.find((u) => u.employeeId === access?.employeeId);
  const held = new Set<string>(
    roles.filter((r) => r.baseline).map((r) => r.id)
  );
  for (const id of me?.roleIds ?? []) held.add(id);
  const assignable = new Set(
    roles.filter((r) => held.has(r.id)).flatMap((r) => r.grantableRoleIds)
  );
  return {
    access,
    canRead: holdsPermission(access, 'access', 'read'),
    canEdit: holdsPermission(access, 'access', 'edit'),
    canEditBaseline: holdsPermission(access, 'access', 'edit-employee-role'),
    held,
    assignable,
  };
}

/** System Admin: a fixed role whose grants nobody changes. */
export const isSystemAdmin = (role: AccessRole) =>
  role.system && !role.baseline;

/**
 * Whether the caller may change `role`'s grants. System Admin never; the
 * baseline only with `access:edit-employee-role`; any other role only when
 * the caller's roles may assign it and the caller does not hold it.
 */
export function mayChangeGrants(
  role: AccessRole,
  standing: AccessStanding
): boolean {
  if (!standing.canEdit || isSystemAdmin(role)) return false;
  if (role.baseline) return standing.canEditBaseline;
  return standing.assignable.has(role.id) && !standing.held.has(role.id);
}

/** Whether the caller may rename or delete `role`: never a system role. */
export function mayChangeDetails(
  role: AccessRole,
  standing: AccessStanding
): boolean {
  return mayChangeGrants(role, standing) && !role.system;
}

/** Whether the caller may give `role` to someone or take it away. */
export function mayAssign(role: AccessRole, standing: AccessStanding): boolean {
  return standing.canEdit && !role.baseline && standing.assignable.has(role.id);
}

/**
 * The grants of `grants` a new role can start with: on an enforced action
 * the caller holds across the organization, at a scope the area filters by.
 * Everything else would be refused, since every grant on a new role is added.
 */
export function copyableGrants(
  grants: readonly Pick<AccessGrant, 'permission' | 'scope'>[],
  catalog: AccessCatalog,
  standing: AccessStanding
): AccessGrantRequest[] {
  const areas = new Map(catalog.areas.map((a) => [a.id, a]));
  return grants
    .filter(({ permission, scope }) => {
      const [areaId, action] = splitPermission(permission);
      const area = areas.get(areaId);
      return (
        area !== undefined &&
        area.enforcedActions.includes(action) &&
        holdsPermission(standing.access, areaId, action, 'ALL') &&
        offeredScopes(catalog, area).includes(scope)
      );
    })
    .map(({ permission, scope }) => ({ permission, scope }));
}

/**
 * The actions of `area` the caller may switch on or off for `role`: those
 * the backend enforces and the caller holds across the organization. The
 * baseline never takes a grant on the `access` area.
 */
export function offeredActions(
  role: AccessRole,
  area: AccessArea,
  standing: AccessStanding
): string[] {
  if (!mayChangeGrants(role, standing)) return [];
  if (role.baseline && area.id === 'access') return [];
  return area.enforcedActions.filter((action) =>
    holdsPermission(standing.access, area.id, action, 'ALL')
  );
}

/**
 * Whether the organization page offers the screen: to a holder of
 * `access:read`, and only on the page of the organization the screen reads
 * and writes, which is the signed-in member's current one.
 */
export function mayOpenScreen(
  access: CurrentUserAccess | undefined,
  organizationId: number
): boolean {
  return (
    access?.organizationId === organizationId &&
    holdsPermission(access, 'access', 'read')
  );
}
