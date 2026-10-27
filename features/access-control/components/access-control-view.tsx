'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/shadcn/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import {
  useAccessGroups,
  useAccessRoles,
  useAccessUsers,
} from '@/hooks/access-control';
import type { AccessRole, AccessRoleInput } from '@/types/access-control';
import { ConfirmDialog } from './confirm-dialog';
import { GroupEditor } from './group-editor';
import { RoleEditor } from './role-editor';
import { GroupsTable } from './groups-table';
import { RolesMatrix } from './roles-matrix';
import { UsersTable } from './users-table';
import { UserEditor } from './user-editor';

type Tier = 'roles' | 'groups' | 'users';
type Selection = number | 'new' | null;

const SHEET_TITLES: Record<Tier, string> = {
  roles: 'Role details',
  groups: 'Department or group details',
  users: 'User access',
};

/** The selected record, `'new'` for a draft, or null when nothing (or something since deleted) is selected. */
function resolveSelection<T extends { id: number }>(
  rows: T[],
  sel: Selection
): T | 'new' | null {
  if (sel === 'new') return 'new';
  return rows.find((r) => r.id === sel) ?? null;
}

/**
 * Roles, departments and groups, and users, each as a table: the roles by
 * modules matrix edits in place, and a column header or a row opens the full
 * editor in a drawer. The three tiers are independent; each editor links to
 * the other two through its member chips.
 */
export function AccessControlView() {
  const rolesQuery = useAccessRoles();
  const groupsQuery = useAccessGroups();
  const usersQuery = useAccessUsers();
  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  const [tier, setTier] = useState<Tier>('roles');
  const [selected, setSelected] = useState<Record<Tier, Selection>>({
    roles: null,
    groups: null,
    users: null,
  });
  const [roleTemplate, setRoleTemplate] = useState<AccessRoleInput>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  /** A navigation held back until the user agrees to drop their edits. */
  const [pending, setPending] = useState<(() => void) | null>(null);

  /** Runs `go` now, or after a "discard changes?" confirm when there are edits. */
  const guard = (go: () => void) => {
    if (dirty) setPending(() => go);
    else go();
  };

  const select = (t: Tier, id: Selection) => {
    setDirty(false);
    setSelected((s) => ({ ...s, [t]: id }));
  };

  const role = resolveSelection(roles, selected.roles);
  const group = resolveSelection(groups, selected.groups);
  const user = resolveSelection(users, selected.users);

  function startNewRole(template?: AccessRoleInput) {
    guard(() => {
      setRoleTemplate(template);
      select('roles', 'new');
      setSheetOpen(true);
    });
  }

  function duplicate(source: AccessRole) {
    const taken = new Set(roles.map((r) => r.name.toLowerCase()));
    let name = `${source.name} (copy)`;
    for (let n = 2; taken.has(name.toLowerCase()); n++)
      name = `${source.name} (copy ${n})`;
    startNewRole({
      name,
      subtitle: source.subtitle,
      description: source.description,
      permissions: { ...source.permissions },
      userIds: [],
      groupIds: [],
    });
  }

  function openInSheet(t: Tier, id: Selection) {
    guard(() => {
      select(t, id);
      setSheetOpen(true);
    });
  }

  /** Drops an unsaved "new" draft on the current tab and closes the drawer. */
  function leaveDraft() {
    setDirty(false);
    setSheetOpen(false);
    if (selected[tier] === 'new') select(tier, null);
  }

  /** After a create, a delete, or discarding a new draft. */
  const afterSave = (t: Tier, id: Selection) => {
    select(t, id);
    setSheetOpen(false);
  };

  function renderEditor() {
    if (tier === 'roles' && role)
      return (
        <RoleEditor
          key={role === 'new' ? `new-${roleTemplate?.name ?? ''}` : role.id}
          role={role === 'new' ? null : role}
          template={roleTemplate}
          users={users}
          groups={groups}
          onDirtyChange={setDirty}
          onCreated={(id) => afterSave('roles', id)}
          onClose={() => afterSave('roles', null)}
        />
      );
    if (tier === 'groups' && group)
      return (
        <GroupEditor
          key={group === 'new' ? 'new' : group.id}
          group={group === 'new' ? null : group}
          roles={roles}
          users={users}
          onDirtyChange={setDirty}
          onCreated={(id) => afterSave('groups', id)}
          onClose={() => afterSave('groups', null)}
        />
      );
    if (tier === 'users' && user && user !== 'new')
      return (
        <UserEditor
          key={user.id}
          user={user}
          roles={roles}
          groups={groups}
          onDirtyChange={setDirty}
        />
      );
    return null;
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <Tabs
          value={tier}
          onValueChange={(v) =>
            guard(() => {
              leaveDraft();
              setTier(v as Tier);
            })
          }
        >
          <TabsList variant="line">
            <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
            <TabsTrigger value="groups">
              Departments & Groups ({groups.length})
            </TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          {tier === 'roles' && (
            <Button size="sm" onClick={() => startNewRole()}>
              <Plus className="mr-1.5 size-4" />
              New role
            </Button>
          )}
          {tier === 'groups' && (
            <Button size="sm" onClick={() => openInSheet('groups', 'new')}>
              <Plus className="mr-1.5 size-4" />
              New group
            </Button>
          )}
        </div>
      </div>

      {tier === 'roles' && (
        <RolesMatrix
          roles={roles}
          isLoading={rolesQuery.isLoading}
          isError={rolesQuery.isError}
          onOpen={(r) => openInSheet('roles', r.id)}
          onDuplicate={duplicate}
          onCreate={() => startNewRole()}
        />
      )}
      {tier === 'groups' && (
        <GroupsTable
          groups={groups}
          roles={roles}
          isLoading={groupsQuery.isLoading}
          isError={groupsQuery.isError}
          onOpen={(id) => openInSheet('groups', id)}
        />
      )}
      {tier === 'users' && (
        <UsersTable
          users={users}
          roles={roles}
          groups={groups}
          isLoading={usersQuery.isLoading}
          isError={usersQuery.isError}
          onOpen={(id) => openInSheet('users', id)}
        />
      )}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) guard(leaveDraft);
        }}
      >
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          <SheetHeader className="sr-only">
            <SheetTitle>{SHEET_TITLES[tier]}</SheetTitle>
            <SheetDescription>
              Edit the details, members and permissions.
            </SheetDescription>
          </SheetHeader>
          {sheetOpen && renderEditor()}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title="Discard unsaved changes?"
        description="You have edits that have not been saved. Leaving now will drop them."
        confirmLabel="Discard"
        onConfirm={() => {
          const go = pending;
          setPending(null);
          setDirty(false);
          go?.();
        }}
      />
    </Card>
  );
}
