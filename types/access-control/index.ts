/**
 * types/access-control
 *
 * The Roles & Permissions screen's view of the access matrix. The records
 * come from echno-core (`@tornotron/echno-core/access/types`); this file
 * turns their grant lists into the per-area cells the tables edit, and works
 * out what a person holds and which roles the caller may change.
 *
 * - A role holds grants and is assigned to people directly. Everyone holds
 *   the baseline role (Member) without being assigned it.
 * - A department or group holds grants and roles, and gives both to its
 *   members.
 * - A person holds roles, groups and grants of their own.
 *
 * A grant is one `<area>:<action>` at one scope. The tables show one scope
 * per cell, applied to every action in it.
 */

import type {
  AccessArea,
  AccessGrant,
  AccessGrantRequest,
  AccessGroup,
  AccessGroupKind,
  AccessRole,
  AccessUser,
} from '@tornotron/echno-core/access/types';

export type {
  AccessArea,
  AccessCatalog,
  AccessGrant,
  AccessGroup,
  AccessGroupKind,
  AccessRole,
  AccessUser,
} from '@tornotron/echno-core/access/types';

// ---------------------------------------------------------------------------
// Actions and scopes
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  approve: 'Approve',
  delete: 'Delete',
};

const ACTION_DESCRIPTIONS: Record<string, string> = {
  view: 'See the module and read its records',
  create: 'Add new records',
  edit: 'Change existing records',
  approve: 'Approve or reject items waiting for sign-off',
  delete: 'Remove records',
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "View", or a named action such as `certify` as "Certify". */
export const actionLabel = (action: string) =>
  ACTION_LABELS[action] ?? capitalize(action.replaceAll('-', ' '));

export const actionDescription = (action: string) =>
  ACTION_DESCRIPTIONS[action] ?? `${actionLabel(action)} records`;

const SCOPE_LABELS: Record<string, string> = {
  ALL: 'All',
  ASSIGNED_PROJECTS: 'Assigned projects',
  RELATED: 'Related',
  OWN: 'Own',
};

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  ALL: 'Every record in the organization',
  ASSIGNED_PROJECTS: 'Records of the projects they are assigned to',
  RELATED: 'Records linked to them',
  OWN: 'Only their own records',
};

export const scopeLabel = (scope: string) =>
  SCOPE_LABELS[scope] ?? capitalize(scope.toLowerCase().replaceAll('_', ' '));

export const scopeDescription = (scope: string) =>
  SCOPE_DESCRIPTIONS[scope] ?? scopeLabel(scope);

/** The scope a new grant gets: the widest. */
export const DEFAULT_SCOPE = 'ALL';

export const ACCESS_GROUP_KIND_LABELS: Record<AccessGroupKind, string> = {
  DEPARTMENT: 'Department',
  GROUP: 'Group',
};

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

/** One cell of the matrix: each action held on an area, with its scope. */
export type AreaGrants = Record<string, string>;

/** Every cell of a role, group or person, keyed by area id. An area with nothing held is absent. */
export type PermissionMap = Record<string, AreaGrants>;

/** `assets:create` → `['assets', 'create']`. */
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
  grants: readonly AccessGrant[],
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

/** The actions of each area that cannot be taken away, such as everyone's own leave. */
export function lockedActions(
  grants: readonly AccessGrant[]
): Record<string, string[]> {
  const locked: Record<string, string[]> = {};
  for (const g of grants) {
    if (!g.locked) continue;
    const [area, action] = splitPermission(g.permission);
    (locked[area] ??= []).push(action);
  }
  return locked;
}

/** The cell's actions in the area's order. */
export function cellActions(
  area: Pick<AccessArea, 'actions'>,
  cell: AreaGrants | undefined
): string[] {
  if (!cell) return [];
  const known = area.actions.filter((a) => a in cell);
  const unknown = Object.keys(cell).filter((a) => !area.actions.includes(a));
  return [...known, ...unknown];
}

/** The cell's one scope, `'MIXED'` when its actions differ, or undefined when it holds nothing. */
export function cellScope(cell: AreaGrants | undefined): string | undefined {
  const scopes = new Set(Object.values(cell ?? {}));
  if (scopes.size === 0) return undefined;
  return scopes.size === 1 ? [...scopes][0] : 'MIXED';
}

/**
 * Puts `actions` in the area's order and adds `view` when anything else is
 * there: nobody can change what they cannot see. The server does the same.
 */
export function normalizeActions(
  area: Pick<AccessArea, 'actions'>,
  actions: readonly string[]
): string[] {
  const set = new Set(actions);
  if (set.size > 0 && area.actions.includes('view')) set.add('view');
  return area.actions.filter((a) => set.has(a));
}

/**
 * The cell holding `actions`. An action already held keeps its scope; a new
 * one takes the cell's scope, or `scope` when the cell is empty or mixed.
 */
export function withActions(
  area: Pick<AccessArea, 'actions'>,
  cell: AreaGrants | undefined,
  actions: readonly string[],
  scope: string = DEFAULT_SCOPE
): AreaGrants {
  const current = cellScope(cell);
  const fallback = current && current !== 'MIXED' ? current : scope;
  const next: AreaGrants = {};
  for (const action of normalizeActions(area, actions)) {
    next[action] = cell?.[action] ?? fallback;
  }
  return next;
}

/** The cell with every action at `scope`. */
export function withScope(cell: AreaGrants, scope: string): AreaGrants {
  return Object.fromEntries(Object.keys(cell).map((a) => [a, scope]));
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

/** Whether two maps hold the same actions at the same scopes. */
export function samePermissions(a: PermissionMap, b: PermissionMap): boolean {
  const key = (m: PermissionMap) =>
    toGrantRequests(m)
      .map((g) => `${g.permission}@${g.scope}`)
      .toSorted()
      .join(',');
  return key(a) === key(b);
}

// ---------------------------------------------------------------------------
// What a person holds
// ---------------------------------------------------------------------------

/** The roles a person holds: the baseline, their own, and their groups'. */
export function rolesOf(
  user: Pick<AccessUser, 'roleIds' | 'groupIds'>,
  roles: readonly AccessRole[],
  groups: readonly AccessGroup[]
): AccessRole[] {
  const ids = new Set(user.roleIds);
  for (const g of groups) {
    if (!user.groupIds.includes(g.id)) continue;
    for (const id of g.roleIds) ids.add(id);
  }
  return roles.filter((r) => r.baseline || ids.has(r.id));
}

export type AccessSourceKind = 'direct' | 'role' | 'group';

/** One contribution to a person's actions on an area. */
export interface AccessSource {
  kind: AccessSourceKind;
  /** Role or group name; "Direct" for their own grants. */
  name: string;
  actions: string[];
}

export interface EffectiveAccess {
  actions: string[];
  sources: AccessSource[];
}

/**
 * A person's actions on every area: the union of their own grants (when
 * `user.grants` is given), each role they hold, and each group they are in.
 */
export function resolveEffectiveAccess(
  user: Pick<AccessUser, 'roleIds' | 'groupIds'> & {
    grants?: readonly AccessGrant[];
  },
  areas: readonly AccessArea[],
  roles: readonly AccessRole[],
  groups: readonly AccessGroup[]
): Record<string, EffectiveAccess> {
  const contributions: {
    kind: AccessSourceKind;
    name: string;
    map: PermissionMap;
  }[] = [
    ...(user.grants
      ? [
          {
            kind: 'direct' as const,
            name: 'Direct',
            map: toPermissionMap(user.grants),
          },
        ]
      : []),
    ...rolesOf(user, roles, groups).map((r) => ({
      kind: 'role' as const,
      name: r.name,
      map: toPermissionMap(r.grants),
    })),
    ...groups
      .filter((g) => user.groupIds.includes(g.id))
      .map((g) => ({
        kind: 'group' as const,
        name: g.name,
        map: toPermissionMap(g.grants),
      })),
  ];

  const result: Record<string, EffectiveAccess> = {};
  for (const area of areas) {
    const sources: AccessSource[] = [];
    for (const c of contributions) {
      const actions = cellActions(area, c.map[area.id]);
      if (actions.length > 0)
        sources.push({ kind: c.kind, name: c.name, actions });
    }
    result[area.id] = {
      actions: normalizeActions(
        area,
        sources.flatMap((s) => s.actions)
      ),
      sources,
    };
  }
  return result;
}

/**
 * The roles the caller may assign, and so change: those the baseline role
 * and the caller's own roles list as assignable. Mirrors the server's
 * `assignableBy`; the server still checks every write.
 */
export function assignableRoleIds(
  caller: Pick<AccessUser, 'roleIds' | 'groupIds'> | undefined,
  roles: readonly AccessRole[],
  groups: readonly AccessGroup[]
): Set<string> {
  const held = caller
    ? rolesOf(caller, roles, groups)
    : roles.filter((r) => r.baseline);
  return new Set(held.flatMap((r) => r.grantableRoleIds));
}

/** Whether the caller may change `role`: the baseline role, or one they may assign. */
export const mayChangeRole = (role: AccessRole, assignable: Set<string>) =>
  role.baseline || assignable.has(role.id);

// ---------------------------------------------------------------------------
// Editor drafts
// ---------------------------------------------------------------------------

/** What the role editor edits; saved through several endpoints. */
export interface RoleDraft {
  name: string;
  subtitle: string;
  description: string;
  permissions: PermissionMap;
  /** People assigned the role directly. Not used for the baseline role. */
  memberIds: number[];
  /** Departments and groups that give the role to their members. */
  groupIds: string[];
}

export interface GroupDraft {
  name: string;
  description: string;
  kind: AccessGroupKind;
  permissions: PermissionMap;
  roleIds: string[];
  memberIds: number[];
}

export interface UserDraft {
  roleIds: string[];
  groupIds: string[];
  permissions: PermissionMap;
}
