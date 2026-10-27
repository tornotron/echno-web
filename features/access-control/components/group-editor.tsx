'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/shadcn/toggle-group';
import { toast } from '@/lib/styles/toast-styles';
import {
  useCreateAccessGroup,
  useDeleteAccessGroup,
  useUpdateAccessGroup,
} from '@/hooks/access-control';
import {
  ACCESS_GROUP_KIND_LABELS,
  type AccessGroup,
  type AccessGroupInput,
  type AccessGroupKind,
  type AccessRole,
  type AccessUser,
} from '@/types/access-control';
import { useDraft } from '../lib/use-draft';
import { ConfirmDialog } from './confirm-dialog';
import { EditorShell } from './editor-shell';
import { MemberChips, type IndirectMember } from './member-chips';
import { PermissionEditor } from './permission-editor';

const EMPTY_GROUP: AccessGroupInput = {
  name: '',
  description: '',
  kind: 'department',
  permissions: {},
  roleIds: [],
  userIds: [],
};

interface GroupEditorProps {
  /** The group to edit, or `null` for a new one. */
  group: AccessGroup | null;
  roles: AccessRole[];
  users: AccessUser[];
  onDirtyChange: (dirty: boolean) => void;
  onCreated: (id: number) => void;
  /** Leave this record: after a delete, or when a new draft is discarded. */
  onClose: () => void;
}

export function GroupEditor({
  group,
  roles,
  users,
  onDirtyChange,
  onCreated,
  onClose,
}: GroupEditorProps) {
  const { draft, update, reset, commit, dirty } = useDraft<AccessGroupInput>(
    () =>
      group
        ? {
            name: group.name,
            description: group.description,
            kind: group.kind,
            permissions: { ...group.permissions },
            roleIds: [...group.roleIds],
            userIds: [...group.userIds],
          }
        : structuredClone(EMPTY_GROUP),
    onDirtyChange
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const create = useCreateAccessGroup();
  const save = useUpdateAccessGroup();
  const remove = useDeleteAccessGroup();
  const isNew = group === null;
  const noun = ACCESS_GROUP_KIND_LABELS[draft.kind].toLowerCase();

  // People who hold one of the group's roles are in already.
  const viaRole = useMemo<IndirectMember[]>(() => {
    const seen = new Map<number, IndirectMember>();
    for (const r of roles) {
      if (!draft.roleIds.includes(r.id)) continue;
      for (const uid of r.userIds) {
        const u = users.find((x) => x.id === uid);
        if (u && !seen.has(uid))
          seen.set(uid, { id: uid, label: u.name, reason: `via ${r.name}` });
      }
    }
    return [...seen.values()];
  }, [roles, users, draft.roleIds]);

  async function handleSave() {
    if (!draft.name.trim()) {
      toast.error(`Enter a ${noun} name`);
      return;
    }
    try {
      if (group) {
        await save.mutateAsync({ id: group.id, input: draft });
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
        error instanceof Error ? error.message : `Could not save the ${noun}`
      );
    }
  }

  async function handleDelete() {
    if (!group) return;
    try {
      await remove.mutateAsync(group.id);
      toast.success(`${group.name} deleted`);
      onDirtyChange(false);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Could not delete the ${noun}`
      );
    }
  }

  return (
    <>
      <EditorShell
        dirty={isNew || dirty}
        saving={create.isPending || save.isPending}
        saveLabel={isNew ? `Create ${noun}` : 'Save changes'}
        onSave={handleSave}
        onDiscard={isNew ? onClose : reset}
        onDelete={group ? () => setConfirmDelete(true) : undefined}
        header={
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[2fr_auto]">
              <div className="space-y-1">
                <Label htmlFor="group-name" className="text-xs text-zinc-500">
                  Name
                </Label>
                <Input
                  id="group-name"
                  value={draft.name}
                  onChange={(e) =>
                    update((d) => ({ ...d, name: e.target.value }))
                  }
                  placeholder={
                    draft.kind === 'department'
                      ? 'e.g. Engineering'
                      : 'e.g. Site Leadership'
                  }
                  className="font-medium"
                  autoFocus={isNew}
                />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-medium text-zinc-500">
                  Type
                </span>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={draft.kind}
                  onValueChange={(v) =>
                    v && update((d) => ({ ...d, kind: v as AccessGroupKind }))
                  }
                  aria-label="Type"
                >
                  {(['department', 'group'] as const).map((kind) => (
                    <ToggleGroupItem
                      key={kind}
                      value={kind}
                      className="h-9 px-3 text-sm data-[state=on]:bg-zinc-900 data-[state=on]:text-white dark:data-[state=on]:bg-zinc-100 dark:data-[state=on]:text-zinc-900"
                    >
                      {ACCESS_GROUP_KIND_LABELS[kind]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="group-description"
                className="text-xs text-zinc-500"
              >
                Description
              </Label>
              <Textarea
                id="group-description"
                value={draft.description}
                onChange={(e) =>
                  update((d) => ({ ...d, description: e.target.value }))
                }
                rows={2}
              />
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
                sublabel: `${r.userIds.length} user${r.userIds.length === 1 ? '' : 's'}`,
              }))}
              selectedIds={draft.roleIds}
              onChange={(roleIds) => update((d) => ({ ...d, roleIds }))}
            />
            <MemberChips
              label="Users"
              noun="users"
              options={users.map((u) => ({
                id: u.id,
                label: u.name,
                sublabel: u.designation,
              }))}
              selectedIds={draft.userIds}
              onChange={(userIds) => update((d) => ({ ...d, userIds }))}
              indirect={viaRole}
            />
          </>
        }
      >
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Optional. Everyone in this {noun}, directly or through one of its
          roles, gets this on top of their own access.
        </p>
        <PermissionEditor
          permissions={draft.permissions}
          onChange={(permissions) => update((d) => ({ ...d, permissions }))}
          subject={draft.name || `New ${noun}`}
        />
      </EditorShell>

      {group && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete ${group.name}?`}
          description={`Its members keep their roles and their own access but lose what this ${noun} adds. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          pending={remove.isPending}
        />
      )}
    </>
  );
}
