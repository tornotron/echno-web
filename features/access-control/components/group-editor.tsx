'use client';

import { useState } from 'react';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/shadcn/toggle-group';
import { toast } from '@/lib/styles/toast-styles';
import { useDeleteAccessGroup, useSaveGroup } from '@/hooks/access-control';
import {
  ACCESS_GROUP_KIND_LABELS,
  toPermissionMap,
  type AccessCatalog,
  type AccessGroup,
  type AccessGroupKind,
  type AccessRole,
  type AccessUser,
  type GroupDraft,
} from '@/types/access-control';
import { errorMessage } from '../lib/error-message';
import { useDraft } from '../lib/use-draft';
import { ConfirmDialog } from './confirm-dialog';
import { EditorShell } from './editor-shell';
import { MemberChips } from './member-chips';
import { PermissionEditor } from './permission-editor';

const EMPTY_GROUP: GroupDraft = {
  name: '',
  description: '',
  kind: 'DEPARTMENT',
  permissions: {},
  roleIds: [],
  memberIds: [],
};

interface GroupEditorProps {
  /** The group to edit, or `null` for a new one. */
  group: AccessGroup | null;
  catalog: AccessCatalog;
  roles: AccessRole[];
  users: AccessUser[];
  /** Roles the caller may assign; only these can be added or taken off. */
  assignable: Set<string>;
  onDirtyChange: (dirty: boolean) => void;
  onCreated: (id: string) => void;
  /** Leave this record: after a delete, or when a new draft is discarded. */
  onClose: () => void;
}

export function GroupEditor({
  group,
  catalog,
  roles,
  users,
  assignable,
  onDirtyChange,
  onCreated,
  onClose,
}: GroupEditorProps) {
  const { draft, update, reset, commit, dirty } = useDraft<GroupDraft>(
    () =>
      group
        ? {
            name: group.name,
            description: group.description ?? '',
            kind: group.kind,
            permissions: toPermissionMap(group.grants, catalog.scopes),
            roleIds: [...group.roleIds],
            memberIds: [...group.memberIds],
          }
        : structuredClone(EMPTY_GROUP),
    onDirtyChange
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = useSaveGroup();
  const remove = useDeleteAccessGroup();
  const isNew = group === null;
  const noun = ACCESS_GROUP_KIND_LABELS[draft.kind].toLowerCase();
  // The baseline is never listed: everyone holds it already.
  const roleOptions = roles.filter(
    (r) => !r.baseline && (assignable.has(r.id) || draft.roleIds.includes(r.id))
  );

  async function handleSave() {
    if (!draft.name.trim()) {
      toast.error(`Enter a ${noun} name`);
      return;
    }
    try {
      const saved = await save.mutateAsync({ group, draft });
      if (group) {
        commit({ ...draft, name: draft.name.trim() });
        toast.success(`${saved.name} saved`);
      } else {
        onDirtyChange(false);
        toast.success(`${saved.name} created`);
        onCreated(saved.id);
      }
    } catch (error) {
      toast.error(errorMessage(error, `Could not save the ${noun}`));
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
      toast.error(errorMessage(error, `Could not delete the ${noun}`));
    }
  }

  return (
    <>
      <EditorShell
        dirty={isNew || dirty}
        saving={save.isPending}
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
                    draft.kind === 'DEPARTMENT'
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
                  {(['DEPARTMENT', 'GROUP'] as const).map((kind) => (
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
              options={roleOptions.map((r) => ({
                id: r.id,
                label: r.name,
                sublabel: r.subtitle,
              }))}
              selectedIds={draft.roleIds}
              onChange={(roleIds) => update((d) => ({ ...d, roleIds }))}
            />
            <MemberChips
              label="Users"
              noun="users"
              options={users.map((u) => ({
                id: u.employeeId,
                label: u.name,
                sublabel: u.designation,
              }))}
              selectedIds={draft.memberIds}
              onChange={(memberIds) => update((d) => ({ ...d, memberIds }))}
            />
          </>
        }
      >
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Optional. Everyone in this {noun} gets its roles and this access on
          top of their own.
        </p>
        <PermissionEditor
          catalog={catalog}
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
          description={`Its members keep their own roles and access but lose the roles and access this ${noun} gives them. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          pending={remove.isPending}
        />
      )}
    </>
  );
}
