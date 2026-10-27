/**
 * Access control: roles, groups (departments and ad-hoc groups) and users.
 *
 * In-memory stand-in for the backend, which today only assigns the fixed
 * org roles (`/keycloakGroup/web/assignRole`). Every method is async and
 * returns copies, so swapping each body for an `api` call leaves the hooks
 * and pages untouched. State lives for the page session and resets on reload.
 */
import {
  normalizeActions,
  type AccessGroup,
  type AccessAction,
  type AccessGroupInput,
  type AccessModuleId,
  type AccessRole,
  type AccessRoleInput,
  type AccessUser,
  type AccessUserAssignmentInput,
  type PermissionMap,
} from '@/types/access-control';
import { seedGroups, seedRoles, seedUsers } from './access-control-mock-data';

const store = {
  roles: structuredClone(seedRoles),
  groups: structuredClone(seedGroups),
  users: structuredClone(seedUsers),
};

const nextId = (rows: { id: number }[]) =>
  Math.max(0, ...rows.map((r) => r.id)) + 1;

function findRole(id: number): AccessRole {
  const role = store.roles.find((r) => r.id === id);
  if (!role) throw new Error('Role not found');
  return role;
}

function findGroup(id: number): AccessGroup {
  const group = store.groups.find((g) => g.id === id);
  if (!group) throw new Error('Group not found');
  return group;
}

function assertUniqueName(
  rows: { id: number; name: string }[],
  name: string,
  selfId?: number
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Name is required');
  const clash = rows.some(
    (r) => r.id !== selfId && r.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (clash) throw new Error(`"${trimmed}" already exists`);
}

const knownUserIds = (ids: number[]) =>
  [...new Set(ids)].filter((id) => store.users.some((u) => u.id === id));

const knownRoleIds = (ids: number[]) =>
  [...new Set(ids)].filter((id) => store.roles.some((r) => r.id === id));

/** Normalises each module's actions and drops modules that grant nothing. */
function cleanPermissions(map: PermissionMap): PermissionMap {
  const out: PermissionMap = {};
  for (const [id, actions] of Object.entries(map) as [
    keyof PermissionMap,
    PermissionMap[keyof PermissionMap],
  ][]) {
    const clean = normalizeActions(actions ?? []);
    if (clean.length > 0) out[id] = clean;
  }
  return out;
}

/** Makes exactly the groups in `groupIds` list `roleId`. */
function syncRoleGroups(roleId: number, groupIds: number[]) {
  const wanted = new Set(groupIds);
  for (const group of store.groups) {
    const has = group.roleIds.includes(roleId);
    if (wanted.has(group.id) && !has) group.roleIds.push(roleId);
    if (!wanted.has(group.id) && has)
      group.roleIds = group.roleIds.filter((id) => id !== roleId);
  }
}

function toRole(input: AccessRoleInput) {
  const { groupIds: _groupIds, ...rest } = structuredClone(input);
  return {
    ...rest,
    name: input.name.trim(),
    permissions: cleanPermissions(input.permissions),
    userIds: knownUserIds(input.userIds),
  };
}

export const accessControlService = {
  // ── Roles ──────────────────────────────────────────────────────────────

  async getRoles(): Promise<AccessRole[]> {
    // TODO: replace with api.get<AccessRole[]>('/roles/web') when backend is ready
    return structuredClone(store.roles);
  },

  async createRole(input: AccessRoleInput): Promise<AccessRole> {
    assertUniqueName(store.roles, input.name);
    const role: AccessRole = {
      ...toRole(input),
      id: nextId(store.roles),
      isSystem: false,
    };
    store.roles.push(role);
    syncRoleGroups(role.id, input.groupIds);
    return structuredClone(role);
  },

  async updateRole(id: number, input: AccessRoleInput): Promise<AccessRole> {
    const role = findRole(id);
    if (role.isSystem && input.name.trim() !== role.name) {
      throw new Error('A system role cannot be renamed');
    }
    assertUniqueName(store.roles, input.name, id);
    const next = toRole(input);
    // A system role's permissions are fixed; only its people and groups move.
    if (role.isSystem) next.permissions = role.permissions;
    Object.assign(role, next);
    syncRoleGroups(id, input.groupIds);
    return structuredClone(role);
  },

  /** Sets one module's actions on a role: one cell of the roles matrix. */
  async setRolePermission(
    id: number,
    moduleId: AccessModuleId,
    actions: AccessAction[]
  ): Promise<AccessRole> {
    const role = findRole(id);
    if (role.isSystem) throw new Error('A system role cannot be changed');
    role.permissions = cleanPermissions({
      ...role.permissions,
      [moduleId]: actions,
    });
    return structuredClone(role);
  },

  async deleteRole(id: number): Promise<void> {
    const role = findRole(id);
    if (role.isSystem) throw new Error('A system role cannot be deleted');
    store.roles = store.roles.filter((r) => r.id !== id);
    for (const group of store.groups) {
      group.roleIds = group.roleIds.filter((rid) => rid !== id);
    }
  },

  // ── Groups ─────────────────────────────────────────────────────────────

  async getGroups(): Promise<AccessGroup[]> {
    // TODO: replace with api.get<AccessGroup[]>('/access-groups/web') when backend is ready
    return structuredClone(store.groups);
  },

  async createGroup(input: AccessGroupInput): Promise<AccessGroup> {
    assertUniqueName(store.groups, input.name);
    const group: AccessGroup = {
      ...structuredClone(input),
      name: input.name.trim(),
      permissions: cleanPermissions(input.permissions),
      id: nextId(store.groups),
      roleIds: knownRoleIds(input.roleIds),
      userIds: knownUserIds(input.userIds),
    };
    store.groups.push(group);
    return structuredClone(group);
  },

  async updateGroup(id: number, input: AccessGroupInput): Promise<AccessGroup> {
    const group = findGroup(id);
    assertUniqueName(store.groups, input.name, id);
    Object.assign(group, structuredClone(input), {
      name: input.name.trim(),
      permissions: cleanPermissions(input.permissions),
      roleIds: knownRoleIds(input.roleIds),
      userIds: knownUserIds(input.userIds),
    });
    return structuredClone(group);
  },

  async deleteGroup(id: number): Promise<void> {
    findGroup(id);
    store.groups = store.groups.filter((g) => g.id !== id);
  },

  // ── Users ──────────────────────────────────────────────────────────────

  async getUsers(): Promise<AccessUser[]> {
    // TODO: replace with the employees list once the backend joins access data onto it
    return structuredClone(store.users);
  },

  /**
   * Sets a user's roles, direct group memberships and direct permissions in
   * one write. Group memberships a user holds only through a role are left
   * alone; `groupIds` names the groups that list the user themselves.
   */
  async updateUserAccess(
    userId: number,
    input: AccessUserAssignmentInput
  ): Promise<AccessUser> {
    const user = store.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const roleIds = new Set(input.roleIds);
    for (const role of store.roles) {
      const has = role.userIds.includes(userId);
      if (roleIds.has(role.id) && !has) role.userIds.push(userId);
      if (!roleIds.has(role.id) && has)
        role.userIds = role.userIds.filter((id) => id !== userId);
    }

    const groupIds = new Set(input.groupIds);
    for (const group of store.groups) {
      const has = group.userIds.includes(userId);
      if (groupIds.has(group.id) && !has) group.userIds.push(userId);
      if (!groupIds.has(group.id) && has)
        group.userIds = group.userIds.filter((id) => id !== userId);
    }

    user.permissions = cleanPermissions(input.permissions);
    return structuredClone(user);
  },
};

/** Restores the seed data. For tests. */
export function resetAccessControlStore() {
  store.roles = structuredClone(seedRoles);
  store.groups = structuredClone(seedGroups);
  store.users = structuredClone(seedUsers);
}
