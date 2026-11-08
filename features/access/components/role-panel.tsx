'use client';

import { useState } from 'react';
import { Copy, Lock, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import type {
  AccessArea,
  AccessAssignment,
  AccessCatalog,
  AccessRole,
  AccessUser,
} from '@tornotron/echno-core/access/types';
import { areaIcon } from '../lib/module-icons';
import { peopleCount } from '../lib/labels';
import {
  mayAssign,
  mayChangeDetails,
  mayChangeGrants,
  offeredActions,
  offeredScopes,
  type AccessStanding,
  type AreaGrants,
  type PermissionMap,
} from '../lib/permissions';
import { ActionSelect } from './action-select';
import { AddPicker } from './add-picker';
import { ConfirmDialog } from './confirm-dialog';

export type RolePanelTab = 'permissions' | 'users';

interface RolePanelProps {
  role: AccessRole;
  catalog: AccessCatalog;
  areas: AccessArea[];
  sections: string[];
  standing: AccessStanding;
  users: AccessUser[];
  /** The role's cells as the matrix shows them, unsaved edits included. */
  cells: PermissionMap;
  onEdit: (area: string, cell: AreaGrants) => void;
  tab: RolePanelTab;
  onTabChange: (tab: RolePanelTab) => void;
  onEditDetails: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAssign: (employeeId: number) => void;
  onUnassign: (assignment: AccessAssignment) => void;
  /** A save, an assignment change or a delete is under way. */
  busy: boolean;
  onClose: () => void;
}

/**
 * The selected role beside the matrix: its Module Permissions, kept in step
 * with the matrix column because both edit the same unsaved changes, and its
 * Assigned Users, each added or removed at once.
 */
export function RolePanel({
  role,
  catalog,
  areas,
  sections,
  standing,
  users,
  cells,
  onEdit,
  tab,
  onTabChange,
  onEditDetails,
  onDuplicate,
  onDelete,
  onAssign,
  onUnassign,
  busy,
  onClose,
}: RolePanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removing, setRemoving] = useState<AccessAssignment | null>(null);
  const canDetails = mayChangeDetails(role, standing);
  const canGrants = mayChangeGrants(role, standing);
  const canAssign = mayAssign(role, standing);
  const byId = new Map(users.map((u) => [u.employeeId, u]));
  const me = standing.access?.employeeId;

  // A role somebody holds, or one standing in for an old role, is not deleted.
  const deleteBlocked = role.organizationWideOnly
    ? 'It stands in for a role from before, so it stays.'
    : role.assignments.length > 0
      ? 'Take it off everyone first.'
      : undefined;

  const orgWide = new Set(
    role.assignments
      .filter((a) => a.projectId === undefined)
      .map((a) => a.employeeId)
  );
  const addable = users
    .filter(
      (u) => u.active && u.employeeId !== me && !orgWide.has(u.employeeId)
    )
    .map((u) => ({ id: u.employeeId, label: u.name, sublabel: u.designation }));

  const removingName = removing
    ? (byId.get(removing.employeeId)?.name ?? 'this person')
    : '';

  return (
    <aside
      aria-label={`${role.name} details`}
      className="flex min-w-0 flex-col border-t lg:border-t-0 lg:border-l"
    >
      <div className="flex items-start gap-2 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {role.system && <Lock className="size-3.5 text-zinc-400" />}
            {role.name}
          </h3>
          {role.subtitle && (
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {role.subtitle}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {role.baseline && (
              <Badge variant="secondary" className="font-normal">
                Everyone holds it
              </Badge>
            )}
            {role.system && !role.baseline && (
              <Badge variant="secondary" className="font-normal">
                Fixed role
              </Badge>
            )}
            {role.carriedOver && (
              <Badge variant="outline" className="font-normal">
                Carried over
              </Badge>
            )}
          </div>
        </div>
        {standing.canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`More actions for ${role.name}`}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canDetails && (
                <DropdownMenuItem onSelect={onEditDetails}>
                  <Pencil className="mr-2 size-4" />
                  Edit details
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={onDuplicate}>
                <Copy className="mr-2 size-4" />
                Duplicate
              </DropdownMenuItem>
              {canDetails && (
                <DropdownMenuItem
                  onSelect={() => setConfirmDelete(true)}
                  disabled={deleteBlocked !== undefined}
                  title={deleteBlocked}
                  className="text-red-600 focus:text-red-700"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Close role details"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {role.description && (
        <p className="border-b px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
          {role.description}
        </p>
      )}

      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as RolePanelTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="border-b px-4 py-2">
          <TabsList variant="line">
            <TabsTrigger value="permissions">Module Permissions</TabsTrigger>
            <TabsTrigger value="users">
              Assigned Users
              {!role.baseline && ` (${role.memberIds.length})`}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="permissions"
          className="max-h-[70vh] overflow-y-auto px-4 py-3"
        >
          {!canGrants && (
            <p className="mb-3 flex items-center gap-1.5 text-xs text-zinc-500">
              <Lock className="size-3" />
              {readOnlyReason(role, standing)}
            </p>
          )}
          <div className="space-y-4">
            {sections.map((section) => {
              const inSection = areas.filter((a) => a.section === section);
              return (
                <section key={section}>
                  <h4 className="mb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                    {section}
                  </h4>
                  <ul className="divide-y divide-zinc-100 rounded-lg border dark:divide-zinc-800">
                    {inSection.map((area) => {
                      const Icon = areaIcon(area.id);
                      return (
                        <li
                          key={area.id}
                          className="flex items-center justify-between gap-3 px-3 py-1.5"
                        >
                          <span className="flex min-w-0 items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                            <Icon className="size-4 shrink-0 text-zinc-500" />
                            <span className="truncate">{area.label}</span>
                          </span>
                          <div className="w-40 shrink-0">
                            <ActionSelect
                              area={area}
                              value={cells[area.id]}
                              offered={offeredActions(role, area, standing)}
                              scopes={offeredScopes(catalog, area)}
                              disabled={busy}
                              ariaLabel={`${role.name} details: ${area.label}`}
                              onChange={(cell) => onEdit(area.id, cell)}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent
          value="users"
          className="max-h-[70vh] overflow-y-auto px-4 py-3"
        >
          {role.baseline ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Everyone in the organization holds this role without being
              assigned it.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-zinc-500">
                  {peopleCount(role.memberIds.length)}
                </span>
                {canAssign && (
                  <AddPicker
                    label="Add person"
                    noun="people"
                    options={addable}
                    onPick={onAssign}
                    disabled={busy}
                  />
                )}
              </div>
              {role.assignments.length === 0 ? (
                <p className="text-sm text-zinc-400">Nobody holds this role.</p>
              ) : (
                <ul className="divide-y divide-zinc-100 rounded-lg border dark:divide-zinc-800">
                  {role.assignments.map((a) => {
                    const person = byId.get(a.employeeId);
                    const self = a.employeeId === me;
                    return (
                      <li
                        key={`${a.employeeId}-${a.projectId ?? 'org'}`}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                            {person?.name ?? 'Former member'}
                            {self && (
                              <span className="ml-1 text-xs text-zinc-500">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {a.projectId === undefined
                              ? 'Across the organization'
                              : 'On one project'}
                            {person?.designation && ` · ${person.designation}`}
                          </p>
                        </div>
                        {canAssign && !self && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0"
                            aria-label={`Remove ${person?.name ?? 'this person'} from ${role.name}`}
                            disabled={busy}
                            onClick={() => setRemoving(a)}
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {canAssign && (
                <p className="text-xs text-zinc-500">
                  Nobody can change their own roles, so your own row stays as it
                  is.
                </p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${role.name}?`}
        description="Nobody holds it, so nobody loses access. This cannot be undone."
        confirmLabel="Delete"
        pending={busy}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title={`Remove ${removingName} from ${role.name}?`}
        description={`${removingName} loses the access this role gives them${
          removing?.projectId === undefined ? '' : ' on that project'
        }.`}
        confirmLabel="Remove"
        pending={busy}
        onConfirm={() => {
          if (removing) onUnassign(removing);
          setRemoving(null);
        }}
      />
    </aside>
  );
}

/** Why the caller sees this role's permissions but cannot change them. */
function readOnlyReason(role: AccessRole, standing: AccessStanding): string {
  if (!standing.canEdit) return 'You can see roles but not change them.';
  if (role.system && !role.baseline)
    return 'This role is fixed, so its permissions cannot be changed.';
  if (role.baseline)
    return 'Changing what everyone holds needs its own permission, which you do not hold.';
  if (standing.held.has(role.id))
    return 'You hold this role, so you cannot change what it gives.';
  return 'Your roles may not assign this role, so you can see it but not change it.';
}
