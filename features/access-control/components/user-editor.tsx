'use client';

import { useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/shadcn/avatar';
import { Badge } from '@/components/shadcn/badge';
import { toast } from '@/lib/styles/toast-styles';
import { useSaveUserAccess } from '@/hooks/access-control';
import {
  ACCESS_GROUP_KIND_LABELS,
  resolveEffectiveAccess,
  toPermissionMap,
  type AccessCatalog,
  type AccessGroup,
  type AccessRole,
  type AccessUser,
  type UserDraft,
} from '@/types/access-control';
import { errorMessage } from '../lib/error-message';
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
  catalog: AccessCatalog;
  roles: AccessRole[];
  groups: AccessGroup[];
  /** Roles the caller may assign; only these can be added or taken off. */
  assignable: Set<string>;
  onDirtyChange: (dirty: boolean) => void;
}

export function UserEditor({
  user,
  catalog,
  roles,
  groups,
  assignable,
  onDirtyChange,
}: UserEditorProps) {
  const { draft, update, reset, commit, dirty } = useDraft<UserDraft>(
    () => ({
      roleIds: [...user.roleIds],
      groupIds: [...user.groupIds],
      permissions: toPermissionMap(user.grants, catalog.scopes),
    }),
    onDirtyChange
  );
  const save = useSaveUserAccess();

  // What the unsaved roles and groups would give, without the person's own
  // grants: the part their own grants need not cover.
  const inherited = useMemo(
    () =>
      resolveEffectiveAccess(
        { roleIds: draft.roleIds, groupIds: draft.groupIds },
        catalog.areas,
        roles,
        groups
      ),
    [draft.roleIds, draft.groupIds, catalog.areas, roles, groups]
  );

  // The baseline, and the roles their groups give them, which this editor
  // cannot take away.
  const indirectRoles = useMemo<IndirectMember<string>[]>(() => {
    const out: IndirectMember<string>[] = roles
      .filter((r) => r.baseline)
      .map((r) => ({ id: r.id, label: r.name, reason: 'everyone' }));
    for (const g of groups) {
      if (!draft.groupIds.includes(g.id)) continue;
      for (const id of g.roleIds) {
        const r = roles.find((x) => x.id === id);
        if (r && !out.some((m) => m.id === id))
          out.push({ id, label: r.name, reason: `via ${g.name}` });
      }
    }
    return out;
  }, [roles, groups, draft.groupIds]);

  const roleOptions = roles.filter(
    (r) => !r.baseline && (assignable.has(r.id) || draft.roleIds.includes(r.id))
  );

  async function handleSave() {
    try {
      await save.mutateAsync({ user, draft, groups });
      commit();
      toast.success(`Access saved for ${user.name}`);
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save access'));
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
              {!user.active && (
                <Badge className="bg-zinc-100 font-normal text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Inactive
                </Badge>
              )}
            </p>
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {[user.designation, user.email].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      }
      members={
        <>
          <MemberChips
            label="Roles"
            noun="roles"
            options={roleOptions.map((r) => ({
              id: r.id,
              label: r.name,
              sublabel: r.subtitle,
            }))}
            selectedIds={draft.roleIds}
            onChange={(roleIds) => update((d) => ({ ...d, roleIds }))}
            indirect={indirectRoles}
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
        catalog={catalog}
        permissions={draft.permissions}
        onChange={(permissions) => update((d) => ({ ...d, permissions }))}
        inherited={inherited}
        subject={user.name}
      />
    </EditorShell>
  );
}
