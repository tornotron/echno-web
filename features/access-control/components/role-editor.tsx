'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { toast } from '@/lib/styles/toast-styles';
import {
  useCreateAccessRole,
  useDeleteAccessRole,
  useUpdateAccessRole,
} from '@/hooks/access-control';
import {
  ACCESS_GROUP_KIND_LABELS,
  type AccessGroup,
  type AccessRole,
  type AccessRoleInput,
  type AccessUser,
} from '@/types/access-control';
import { useDraft } from '../lib/use-draft';
import { ConfirmDialog } from './confirm-dialog';
import { EditorShell } from './editor-shell';
import { MemberChips } from './member-chips';
import { PermissionEditor } from './permission-editor';

export const EMPTY_ROLE: AccessRoleInput = {
  name: '',
  subtitle: '',
  description: '',
  permissions: {},
  userIds: [],
  groupIds: [],
};

interface RoleEditorProps {
  /** The role to edit, or `null` for a new one seeded from `template`. */
  role: AccessRole | null;
  template?: AccessRoleInput;
  users: AccessUser[];
  groups: AccessGroup[];
  onDirtyChange: (dirty: boolean) => void;
  onCreated: (id: number) => void;
  /** Leave this record: after a delete, or when a new draft is discarded. */
  onClose: () => void;
}

export function RoleEditor({
  role,
  template = EMPTY_ROLE,
  users,
  groups,
  onDirtyChange,
  onCreated,
  onClose,
}: RoleEditorProps) {
  const { draft, update, reset, commit, dirty } = useDraft<AccessRoleInput>(
    () =>
      role
        ? {
            name: role.name,
            subtitle: role.subtitle ?? '',
            description: role.description,
            permissions: { ...role.permissions },
            userIds: [...role.userIds],
            groupIds: groups
              .filter((g) => g.roleIds.includes(role.id))
              .map((g) => g.id),
          }
        : structuredClone(template),
    onDirtyChange
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const create = useCreateAccessRole();
  const save = useUpdateAccessRole();
  const remove = useDeleteAccessRole();
  const isSystem = role?.isSystem ?? false;
  const isNew = role === null;

  async function handleSave() {
    if (!draft.name.trim()) {
      toast.error('Enter a role name');
      return;
    }
    try {
      if (role) {
        await save.mutateAsync({ id: role.id, input: draft });
        commit({ ...draft, name: draft.name.trim() });
        toast.success(`${draft.name.trim()} saved`);
      } else {
        const created = await create.mutateAsync(draft);
        onDirtyChange(false);
        toast.success(`${created.name} created`);
        onCreated(created.id);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save the role'
      );
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
      toast.error(
        error instanceof Error ? error.message : 'Could not delete the role'
      );
    }
  }

  return (
    <>
      <EditorShell
        dirty={isNew || dirty}
        saving={create.isPending || save.isPending}
        saveLabel={isNew ? 'Create role' : 'Save changes'}
        onSave={handleSave}
        onDiscard={isNew ? onClose : reset}
        onDelete={role && !isSystem ? () => setConfirmDelete(true) : undefined}
        header={
          <div className="space-y-3">
            {isSystem && (
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Lock className="size-3" />
                System role. Its name and access are fixed; you can change who
                holds it.
              </p>
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
                  disabled={isSystem}
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
                placeholder="What this role is responsible for"
              />
            </div>
          </div>
        }
        members={
          <>
            <MemberChips
              label="Members"
              noun="users"
              options={users.map((u) => ({
                id: u.id,
                label: u.name,
                sublabel: u.designation,
              }))}
              selectedIds={draft.userIds}
              onChange={(userIds) => update((d) => ({ ...d, userIds }))}
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
        <PermissionEditor
          permissions={draft.permissions}
          onChange={(permissions) => update((d) => ({ ...d, permissions }))}
          readOnly={isSystem}
          subject={draft.name || 'New role'}
        />
      </EditorShell>

      {role && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete ${role.name}?`}
          description={`${role.userIds.length} user${role.userIds.length === 1 ? '' : 's'} will lose the access this role gives them, and it will be removed from every group. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          pending={remove.isPending}
        />
      )}
    </>
  );
}
