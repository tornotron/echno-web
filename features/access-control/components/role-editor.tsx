'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { toast } from '@/lib/styles/toast-styles';
import { useDeleteAccessRole, useSaveRole } from '@/hooks/access-control';
import {
  ACCESS_GROUP_KIND_LABELS,
  lockedActions,
  mayChangeRole,
  toPermissionMap,
  type AccessCatalog,
  type AccessGroup,
  type AccessRole,
  type AccessUser,
  type RoleDraft,
} from '@/types/access-control';
import { errorMessage } from '../lib/error-message';
import { useDraft } from '../lib/use-draft';
import { ConfirmDialog } from './confirm-dialog';
import { EditorShell } from './editor-shell';
import { MemberChips } from './member-chips';
import { PermissionEditor } from './permission-editor';

export const EMPTY_ROLE: RoleDraft = {
  name: '',
  subtitle: '',
  description: '',
  permissions: {},
  memberIds: [],
  groupIds: [],
};

interface RoleEditorProps {
  /** The role to edit, or `null` for a new one seeded from `template`. */
  role: AccessRole | null;
  template?: RoleDraft;
  catalog: AccessCatalog;
  users: AccessUser[];
  groups: AccessGroup[];
  /** Roles the caller may assign, and so change. */
  assignable: Set<string>;
  onDirtyChange: (dirty: boolean) => void;
  onCreated: (id: string) => void;
  /** Leave this record: after a delete, or when a new draft is discarded. */
  onClose: () => void;
}

export function RoleEditor({
  role,
  template = EMPTY_ROLE,
  catalog,
  users,
  groups,
  assignable,
  onDirtyChange,
  onCreated,
  onClose,
}: RoleEditorProps) {
  const { draft, update, reset, commit, dirty } = useDraft<RoleDraft>(
    () =>
      role
        ? {
            name: role.name,
            subtitle: role.subtitle ?? '',
            description: role.description ?? '',
            permissions: toPermissionMap(role.grants, catalog.scopes),
            memberIds: [...role.memberIds],
            groupIds: groups
              .filter((g) => g.roleIds.includes(role.id))
              .map((g) => g.id),
          }
        : structuredClone(template),
    onDirtyChange
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = useSaveRole();
  const remove = useDeleteAccessRole();
  const isSystem = role?.system ?? false;
  const isBaseline = role?.baseline ?? false;
  const readOnly = role !== null && !mayChangeRole(role, assignable);
  const isNew = role === null;
  const locked = role ? lockedActions(role.grants) : {};

  async function handleSave() {
    if (!draft.name.trim()) {
      toast.error('Enter a role name');
      return;
    }
    try {
      const saved = await save.mutateAsync({ role, draft, users, groups });
      if (role) {
        commit({ ...draft, name: draft.name.trim() });
        toast.success(`${saved.name} saved`);
      } else {
        onDirtyChange(false);
        toast.success(`${saved.name} created`);
        onCreated(saved.id);
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save the role'));
    }
  }

  async function handleDelete() {
    if (!role) return;
    try {
      await remove.mutateAsync(role.id);
      toast.success(`${role.name} deleted`);
      onDirtyChange(false);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete the role'));
    }
  }

  return (
    <>
      <EditorShell
        dirty={!readOnly && (isNew || dirty)}
        saving={save.isPending}
        saveLabel={isNew ? 'Create role' : 'Save changes'}
        onSave={handleSave}
        onDiscard={isNew ? onClose : reset}
        onDelete={
          role && !isSystem && !readOnly
            ? () => setConfirmDelete(true)
            : undefined
        }
        header={
          <div className="space-y-3">
            {readOnly ? (
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Lock className="size-3" />
                Your roles may not assign this role, so you can see it but not
                change it.
              </p>
            ) : isBaseline ? (
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Lock className="size-3" />
                Everyone in the organization holds this role. Locked access,
                such as their own leave, cannot be taken away.
              </p>
            ) : (
              isSystem && (
                <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Lock className="size-3" />
                  Starting role. It can be changed but not deleted.
                </p>
              )
            )}
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <div className="space-y-1">
                <Label htmlFor="role-name" className="text-xs text-zinc-500">
                  Role name
                </Label>
                <Input
                  id="role-name"
                  value={draft.name}
                  onChange={(e) =>
                    update((d) => ({ ...d, name: e.target.value }))
                  }
                  disabled={readOnly}
                  placeholder="e.g. Planning Engineer"
                  className="font-medium"
                  autoFocus={isNew}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="role-subtitle"
                  className="text-xs text-zinc-500"
                >
                  Function
                </Label>
                <Input
                  id="role-subtitle"
                  value={draft.subtitle ?? ''}
                  onChange={(e) =>
                    update((d) => ({ ...d, subtitle: e.target.value }))
                  }
                  disabled={readOnly}
                  placeholder="e.g. Site Execution"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="role-description"
                className="text-xs text-zinc-500"
              >
                Description
              </Label>
              <Textarea
                id="role-description"
                value={draft.description}
                onChange={(e) =>
                  update((d) => ({ ...d, description: e.target.value }))
                }
                rows={2}
                disabled={readOnly}
                placeholder="What this role is responsible for"
              />
            </div>
          </div>
        }
        members={
          isBaseline ? undefined : (
            <>
              <MemberChips
                label="Members"
                noun="users"
                options={users.map((u) => ({
                  id: u.employeeId,
                  label: u.name,
                  sublabel: u.designation,
                }))}
                selectedIds={draft.memberIds}
                onChange={(memberIds) => update((d) => ({ ...d, memberIds }))}
                disabled={readOnly}
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
                disabled={readOnly}
              />
            </>
          )
        }
      >
        <PermissionEditor
          catalog={catalog}
          permissions={draft.permissions}
          onChange={(permissions) => update((d) => ({ ...d, permissions }))}
          locked={locked}
          readOnly={readOnly}
          subject={draft.name || 'New role'}
        />
      </EditorShell>

      {role && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete ${role.name}?`}
          description={`${role.memberIds.length} user${role.memberIds.length === 1 ? '' : 's'} will lose the access this role gives them, and it will be removed from every group. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          pending={remove.isPending}
        />
      )}
    </>
  );
}
