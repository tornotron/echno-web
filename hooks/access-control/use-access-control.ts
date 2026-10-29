/**
 * The Roles & Permissions screen's reads and saves, on echno-core's access
 * hooks and service.
 *
 * An editor's Save can touch several endpoints: a role's people are set on
 * each person (`PUT users/{id}/roles`) and its groups on each group
 * (`PUT groups/{id}/roles`). The save hooks make those calls in turn, only
 * for what changed, and then refresh the whole access namespace, the
 * caller's own access included. A refused call stops the save; what was
 * already saved stays, and the refresh shows it.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accessKeys } from '@tornotron/echno-core/access/hooks';
import { accessService } from '@tornotron/echno-core/access/services';
import {
  samePermissions,
  toGrantRequests,
  toPermissionMap,
  type AccessGroup,
  type AccessRole,
  type AccessUser,
  type AreaGrants,
  type GroupDraft,
  type RoleDraft,
  type UserDraft,
} from '@/types/access-control';

export {
  useAccessCatalog,
  useAccessGroups,
  useAccessRoles,
  useAccessUsers,
  useCurrentUserAccess,
  useDeleteAccessGroup,
  useDeleteAccessRole,
} from '@tornotron/echno-core/access/hooks';

const toggled = <T>(ids: readonly T[], id: T, on: boolean): T[] =>
  on ? [...ids.filter((x) => x !== id), id] : ids.filter((x) => x !== id);

/** Trimmed, or left out when blank. */
const optional = (s: string) => s.trim() || undefined;

function useRefreshAccess() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: accessKeys.all });
}

/**
 * Sets one cell of the roles matrix by sending the role's whole grant list.
 * Patches the roles cache first so the cell settles at once, and rolls back
 * if the write is refused.
 */
export const useSetRoleCell = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      role,
      area,
      cell,
    }: {
      role: AccessRole;
      area: string;
      cell: AreaGrants;
    }) => {
      const map = { ...toPermissionMap(role.grants), [area]: cell };
      return accessService.setRoleGrants(role.id, toGrantRequests(map));
    },
    onMutate: async ({ role, area, cell }) => {
      await queryClient.cancelQueries({ queryKey: accessKeys.roles() });
      const previous = queryClient.getQueryData<AccessRole[]>(
        accessKeys.roles()
      );
      const others = role.grants.filter(
        (g) => !g.permission.startsWith(`${area}:`)
      );
      const kept = role.grants.filter(
        (g) => g.permission.startsWith(`${area}:`) && g.locked
      );
      const added = Object.entries(cell)
        .map(([action, scope]) => ({
          permission: `${area}:${action}`,
          scope,
          locked: false,
        }))
        .filter(
          (g) =>
            !kept.some(
              (k) => k.permission === g.permission && k.scope === g.scope
            )
        );
      queryClient.setQueryData<AccessRole[]>(accessKeys.roles(), (rows) =>
        rows?.map((r) =>
          r.id === role.id
            ? { ...r, grants: [...others, ...kept, ...added] }
            : r
        )
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(accessKeys.roles(), context.previous);
    },
    onSuccess: (updated) => {
      // PUT /access/web/roles/{roleId}/grants → AccessRoleDto (full)
      queryClient.setQueryData<AccessRole[]>(accessKeys.roles(), (rows) =>
        rows?.map((r) => (r.id === updated.id ? updated : r))
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: accessKeys.currentUser() }),
  });
};

/**
 * Creates or saves a role: its details, its grants, the people assigned it
 * and the groups that give it. Resolves to the saved role.
 */
export const useSaveRole = () => {
  const refresh = useRefreshAccess();
  return useMutation({
    mutationFn: async ({
      role,
      draft,
      users,
      groups,
    }: {
      role: AccessRole | null;
      draft: RoleDraft;
      users: readonly AccessUser[];
      groups: readonly AccessGroup[];
    }): Promise<AccessRole> => {
      const body = {
        name: draft.name.trim(),
        subtitle: optional(draft.subtitle),
        description: optional(draft.description),
      };
      let saved: AccessRole;
      if (!role) saved = await accessService.createRole(body);
      else if (
        body.name !== role.name ||
        body.subtitle !== role.subtitle ||
        body.description !== role.description
      )
        saved = await accessService.updateRole(role.id, body);
      else saved = role;

      const before = role ? toPermissionMap(role.grants) : {};
      if (!samePermissions(before, draft.permissions))
        saved = await accessService.setRoleGrants(
          saved.id,
          toGrantRequests(draft.permissions)
        );
      if (saved.baseline) return saved;

      const wasMember = new Set(role?.memberIds);
      const isMember = new Set(draft.memberIds);
      for (const u of users) {
        const has = isMember.has(u.employeeId);
        if (wasMember.has(u.employeeId) === has) continue;
        await accessService.setUserRoles(
          u.employeeId,
          toggled(u.roleIds, saved.id, has)
        );
      }
      const inGroups = new Set(draft.groupIds);
      for (const g of groups) {
        const has = inGroups.has(g.id);
        if ((role !== null && g.roleIds.includes(role.id)) === has) continue;
        await accessService.setGroupRoles(
          g.id,
          toggled(g.roleIds, saved.id, has)
        );
      }
      return saved;
    },
    onSettled: refresh,
  });
};

/**
 * Creates or saves a department or group: its details, grants, roles and
 * members. Resolves to the saved group.
 */
export const useSaveGroup = () => {
  const refresh = useRefreshAccess();
  return useMutation({
    mutationFn: async ({
      group,
      draft,
    }: {
      group: AccessGroup | null;
      draft: GroupDraft;
    }): Promise<AccessGroup> => {
      const body = {
        name: draft.name.trim(),
        kind: draft.kind,
        description: optional(draft.description),
      };
      let saved: AccessGroup;
      if (!group) saved = await accessService.createGroup(body);
      else if (
        body.name !== group.name ||
        body.kind !== group.kind ||
        body.description !== group.description
      )
        saved = await accessService.updateGroup(group.id, body);
      else saved = group;

      const before = group ? toPermissionMap(group.grants) : {};
      if (!samePermissions(before, draft.permissions))
        saved = await accessService.setGroupGrants(
          saved.id,
          toGrantRequests(draft.permissions)
        );
      if (!sameSet(saved.roleIds, draft.roleIds))
        saved = await accessService.setGroupRoles(saved.id, draft.roleIds);
      if (!sameSet(saved.memberIds, draft.memberIds))
        saved = await accessService.setGroupMembers(saved.id, draft.memberIds);
      return saved;
    },
    onSettled: refresh,
  });
};

/** Saves a person's roles, groups and grants of their own. */
export const useSaveUserAccess = () => {
  const refresh = useRefreshAccess();
  return useMutation({
    mutationFn: async ({
      user,
      draft,
      groups,
    }: {
      user: AccessUser;
      draft: UserDraft;
      groups: readonly AccessGroup[];
    }): Promise<void> => {
      if (!sameSet(user.roleIds, draft.roleIds))
        await accessService.setUserRoles(user.employeeId, draft.roleIds);
      if (!samePermissions(toPermissionMap(user.grants), draft.permissions))
        await accessService.setUserGrants(
          user.employeeId,
          toGrantRequests(draft.permissions)
        );
      const inGroups = new Set(draft.groupIds);
      for (const g of groups) {
        const has = inGroups.has(g.id);
        if (user.groupIds.includes(g.id) === has) continue;
        await accessService.setGroupMembers(
          g.id,
          toggled(g.memberIds, user.employeeId, has)
        );
      }
    },
    onSettled: refresh,
  });
};

function sameSet<T>(a: readonly T[], b: readonly T[]): boolean {
  const set = new Set(a);
  return set.size === new Set(b).size && b.every((x) => set.has(x));
}
