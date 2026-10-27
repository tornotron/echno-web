'use client';

import { useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/shadcn/avatar';
import { Badge } from '@/components/shadcn/badge';
import { toast } from '@/lib/styles/toast-styles';
import { useUpdateUserAccess } from '@/hooks/access-control';
import {
  ACCESS_GROUP_KIND_LABELS,
  resolveEffectiveAccess,
  type AccessGroup,
  type AccessRole,
  type AccessUser,
  type AccessUserAssignmentInput,
} from '@/types/access-control';
import { useDraft } from '../lib/use-draft';
import { EditorShell } from './editor-shell';
import { MemberChips, type IndirectMember } from './member-chips';
import { PermissionEditor } from './permission-editor';

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

interface UserEditorProps {
  user: AccessUser;
  roles: AccessRole[];
  groups: AccessGroup[];
  onDirtyChange: (dirty: boolean) => void;
}

export function UserEditor({
  user,
  roles,
  groups,
  onDirtyChange,
}: UserEditorProps) {
  const { draft, update, reset, commit, dirty } =
    useDraft<AccessUserAssignmentInput>(
      () => ({
        roleIds: roles
          .filter((r) => r.userIds.includes(user.id))
          .map((r) => r.id),
        groupIds: groups
          .filter((g) => g.userIds.includes(user.id))
          .map((g) => g.id),
        permissions: { ...user.permissions },
      }),
      onDirtyChange
    );
  const save = useUpdateUserAccess();

  // Apply the unsaved roles and groups to copies, then resolve without the
  // direct grants: what the user would get from everything else.
  const inherited = useMemo(() => {
    const roleIds = new Set(draft.roleIds);
    const groupIds = new Set(draft.groupIds);
    const without = (ids: number[]) => ids.filter((id) => id !== user.id);
    return resolveEffectiveAccess(
      user.id,
      undefined,
      roles.map((r) => ({
        ...r,
        userIds: roleIds.has(r.id)
          ? [...without(r.userIds), user.id]
          : without(r.userIds),
      })),
      groups.map((g) => ({
        ...g,
        userIds: groupIds.has(g.id)
          ? [...without(g.userIds), user.id]
          : without(g.userIds),
      }))
    );
  }, [draft.roleIds, draft.groupIds, roles, groups, user.id]);

  const viaRole = useMemo<IndirectMember[]>(
    () =>
      groups.flatMap((g) => {
        const r = roles.find(
          (x) => draft.roleIds.includes(x.id) && g.roleIds.includes(x.id)
        );
        return r ? [{ id: g.id, label: g.name, reason: `via ${r.name}` }] : [];
      }),
    [groups, roles, draft.roleIds]
  );

  async function handleSave() {
    try {
      await save.mutateAsync({ userId: user.id, input: draft });
      commit();
      toast.success(`Access saved for ${user.name}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save access'
      );
    }
  }

  return (
    <EditorShell
      dirty={dirty}
      saving={save.isPending}
      onSave={handleSave}
      onDiscard={reset}
      header={
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback className="bg-blue-50 text-sm font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
              {initialsOf(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              <span className="truncate">{user.name}</span>
              {!user.isActive && (
                <Badge className="bg-zinc-100 font-normal text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Inactive
                </Badge>
              )}
            </p>
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {user.designation} · {user.email}
            </p>
          </div>
        </div>
      }
      members={
        <>
          <MemberChips
            label="Roles"
            noun="roles"
            options={roles.map((r) => ({
              id: r.id,
              label: r.name,
              sublabel: r.subtitle,
            }))}
            selectedIds={draft.roleIds}
            onChange={(roleIds) => update((d) => ({ ...d, roleIds }))}
          />
          <MemberChips
            label="Groups"
            noun="groups"
            options={groups.map((g) => ({
              id: g.id,
              label: g.name,
              sublabel: ACCESS_GROUP_KIND_LABELS[g.kind],
            }))}
            selectedIds={draft.groupIds}
            onChange={(groupIds) => update((d) => ({ ...d, groupIds }))}
            indirect={viaRole}
          />
        </>
      }
    >
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Extra access
      </h3>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Grey, locked actions come from this user&apos;s roles and groups. Switch
        on more only where they need it; a role is easier to audit.
      </p>
      <PermissionEditor
        permissions={draft.permissions}
        onChange={(permissions) => update((d) => ({ ...d, permissions }))}
        inherited={inherited}
        subject={user.name}
      />
    </EditorShell>
  );
}
