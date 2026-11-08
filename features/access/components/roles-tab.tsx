'use client';

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  useCreateAccessRole,
  useDeleteAccessRole,
  useSetAccessRoleGrants,
  useSetAccessUserRoles,
  useUpdateAccessRole,
} from '@tornotron/echno-core/access/hooks';
import type {
  AccessArea,
  AccessAssignment,
  AccessCatalog,
  AccessRole,
  AccessUser,
} from '@tornotron/echno-core/access/types';
import { toast } from '@/lib/styles/toast-styles';
import { cn } from '@/lib/utils';
import { errorMessage } from '../lib/error-message';
import {
  copyableGrants,
  samePermissions,
  setCell,
  toGrantRequests,
  toPermissionMap,
  type AccessStanding,
  type AreaGrants,
  type PermissionMap,
} from '../lib/permissions';
import {
  RoleDetailsDialog,
  toRoleRequest,
  type RoleDetails,
} from './role-details-dialog';
import { RolePanel, type RolePanelTab } from './role-panel';
import { RolesMatrix } from './roles-matrix';

/** What the details dialog is open for. */
type DetailsMode =
  | { kind: 'create' }
  | { kind: 'duplicate'; source: AccessRole }
  | { kind: 'edit'; role: AccessRole };

const EMPTY_DETAILS: RoleDetails = { name: '', subtitle: '', description: '' };

interface RolesTabProps {
  catalog: AccessCatalog;
  areas: AccessArea[];
  sections: string[];
  roles: AccessRole[];
  users: AccessUser[];
  standing: AccessStanding;
  /** Unsaved grant edits, by role id; shared by the matrix and the panel. */
  draft: Record<string, PermissionMap>;
  onDraftChange: Dispatch<SetStateAction<Record<string, PermissionMap>>>;
}

/**
 * The Roles tab: the roles by modules matrix, and the selected role's
 * details on its right. Grant edits from either wait for Save changes;
 * people are added to or taken off a role at once.
 */
export function RolesTab({
  catalog,
  areas,
  sections,
  roles,
  users,
  standing,
  draft,
  onDraftChange,
}: RolesTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<RolePanelTab>('permissions');
  const [details, setDetails] = useState<DetailsMode | null>(null);
  const [saving, setSaving] = useState(false);

  const createRole = useCreateAccessRole();
  const updateRole = useUpdateAccessRole();
  const setGrants = useSetAccessRoleGrants();
  const deleteRole = useDeleteAccessRole();
  const setUserRoles = useSetAccessUserRoles();
  const busy =
    saving ||
    createRole.isPending ||
    updateRole.isPending ||
    setGrants.isPending ||
    deleteRole.isPending ||
    setUserRoles.isPending;

  const server = useMemo(
    () =>
      new Map(
        roles.map((r) => [r.id, toPermissionMap(r.grants, catalog.scopes)])
      ),
    [roles, catalog.scopes]
  );
  const selected = roles.find((r) => r.id === selectedId) ?? null;
  const changedRoles = Object.keys(draft).length;

  function edit(role: AccessRole, area: string, cell: AreaGrants) {
    onDraftChange((current) => {
      const held = server.get(role.id) ?? {};
      const next = setCell(current[role.id] ?? held, area, cell);
      const rest = { ...current };
      delete rest[role.id];
      return samePermissions(next, held) ? rest : { ...rest, [role.id]: next };
    });
  }

  /** Saves each changed role in turn; a refused one stops the rest and stays pending. */
  async function saveDraft() {
    setSaving(true);
    let saved = 0;
    try {
      for (const [roleId, map] of Object.entries(draft)) {
        const name = roles.find((r) => r.id === roleId)?.name ?? 'A role';
        try {
          await setGrants.mutateAsync({ roleId, grants: toGrantRequests(map) });
        } catch (error) {
          toast.error(
            `${name}: ${errorMessage(error, 'Could not save its permissions')}`
          );
          return;
        }
        saved += 1;
        onDraftChange((current) => {
          const rest = { ...current };
          delete rest[roleId];
          return rest;
        });
      }
      toast.success(`Saved ${saved} role${saved === 1 ? '' : 's'}`);
    } finally {
      setSaving(false);
    }
  }

  async function submitDetails(values: RoleDetails) {
    if (!details) return;
    const body = toRoleRequest(values);
    if (details.kind === 'edit') {
      try {
        await updateRole.mutateAsync({ roleId: details.role.id, body });
        toast.success(`${body.name} saved`);
        setDetails(null);
      } catch (error) {
        toast.error(errorMessage(error, 'Could not save the role'));
      }
      return;
    }

    let id: string;
    try {
      ({ id } = await createRole.mutateAsync(body));
    } catch (error) {
      toast.error(errorMessage(error, 'Could not create the role'));
      return;
    }
    // From here the role exists: select it, so a failure below is fixed on
    // the saved role rather than by creating it again.
    setSelectedId(id);
    setPanelTab('permissions');
    setDetails(null);
    if (details.kind === 'create') {
      toast.success(`${body.name} created`);
      return;
    }
    const grants = copyableGrants(details.source.grants, catalog, standing);
    try {
      if (grants.length > 0)
        await setGrants.mutateAsync({ roleId: id, grants });
      toast.success(`${body.name} created from ${details.source.name}`);
    } catch (error) {
      toast.error(
        `${body.name} was created, but its permissions were not copied: ${errorMessage(error, 'try again from the matrix')}`
      );
    }
  }

  async function remove(role: AccessRole) {
    try {
      await deleteRole.mutateAsync(role.id);
      onDraftChange((current) => {
        const rest = { ...current };
        delete rest[role.id];
        return rest;
      });
      setSelectedId(null);
      toast.success(`${role.name} deleted`);
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete the role'));
    }
  }

  /** A person's roles are replaced as a set, so send theirs with the one change. */
  async function assign(role: AccessRole, employeeId: number) {
    const person = users.find((u) => u.employeeId === employeeId);
    if (!person) return;
    try {
      await setUserRoles.mutateAsync({
        employeeId,
        roles: [...person.roles, { roleId: role.id }],
      });
      toast.success(`${person.name} now holds ${role.name}`);
    } catch (error) {
      toast.error(errorMessage(error, 'Could not add them to the role'));
    }
  }

  async function unassign(role: AccessRole, assignment: AccessAssignment) {
    const person = users.find((u) => u.employeeId === assignment.employeeId);
    if (!person) return;
    try {
      await setUserRoles.mutateAsync({
        employeeId: person.employeeId,
        roles: person.roles.filter(
          (r) => !(r.roleId === role.id && r.projectId === assignment.projectId)
        ),
      });
      toast.success(`${person.name} no longer holds ${role.name}`);
    } catch (error) {
      toast.error(errorMessage(error, 'Could not take them off the role'));
    }
  }

  const dialog = (() => {
    if (!details) return null;
    if (details.kind === 'edit')
      return {
        title: `Edit ${details.role.name}`,
        description: 'The name, function and description people see.',
        submitLabel: 'Save',
        initial: {
          name: details.role.name,
          subtitle: details.role.subtitle ?? '',
          description: details.role.description ?? '',
        },
      };
    if (details.kind === 'duplicate')
      return {
        title: `Duplicate ${details.source.name}`,
        description:
          'The copy starts with the permissions you can give, and nobody assigned.',
        submitLabel: 'Create role',
        initial: {
          name: copyName(details.source.name, roles),
          subtitle: details.source.subtitle ?? '',
          description: details.source.description ?? '',
        },
      };
    return {
      title: 'New role',
      description:
        'Give it a name now, then choose its permissions in the matrix.',
      submitLabel: 'Create role',
      initial: EMPTY_DETAILS,
    };
  })();

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        {changedRoles > 0 && (
          <>
            <span className="text-xs text-zinc-500" aria-live="polite">
              Unsaved changes to {changedRoles} role
              {changedRoles === 1 ? '' : 's'}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => onDraftChange({})}
              disabled={busy}
            >
              Discard
            </Button>
            <Button
              size="sm"
              className="h-8"
              onClick={saveDraft}
              disabled={busy}
            >
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save changes
            </Button>
          </>
        )}
        {standing.canEdit && (
          <Button
            size="sm"
            variant={changedRoles > 0 ? 'outline' : 'default'}
            className="ml-auto h-8"
            onClick={() => setDetails({ kind: 'create' })}
            disabled={busy}
          >
            <Plus className="mr-1.5 size-4" />
            New role
          </Button>
        )}
      </div>

      <div
        className={cn(
          'grid min-w-0',
          selected && 'lg:grid-cols-[minmax(0,1fr)_24rem]'
        )}
      >
        <RolesMatrix
          catalog={catalog}
          areas={areas}
          sections={sections}
          roles={roles}
          standing={standing}
          server={server}
          draft={draft}
          onEdit={edit}
          selectedRoleId={selectedId}
          onSelect={(role) =>
            setSelectedId((current) => (current === role.id ? null : role.id))
          }
          disabled={busy}
        />
        {selected && (
          <RolePanel
            key={selected.id}
            role={selected}
            catalog={catalog}
            areas={areas}
            sections={sections}
            standing={standing}
            users={users}
            cells={draft[selected.id] ?? server.get(selected.id) ?? {}}
            onEdit={(area, cell) => edit(selected, area, cell)}
            tab={panelTab}
            onTabChange={setPanelTab}
            onEditDetails={() => setDetails({ kind: 'edit', role: selected })}
            onDuplicate={() =>
              setDetails({ kind: 'duplicate', source: selected })
            }
            onDelete={() => remove(selected)}
            onAssign={(employeeId) => assign(selected, employeeId)}
            onUnassign={(a) => unassign(selected, a)}
            busy={busy}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {dialog && (
        <RoleDetailsDialog
          open
          onOpenChange={(open) => {
            if (!open) setDetails(null);
          }}
          {...dialog}
          pending={
            createRole.isPending || updateRole.isPending || setGrants.isPending
          }
          onSubmit={submitDetails}
        />
      )}
    </div>
  );
}

/** "Site Engineer (copy)", or "(copy 2)" and on when that name is taken. */
export function copyName(name: string, roles: readonly AccessRole[]): string {
  const taken = new Set(roles.map((r) => r.name.toLowerCase()));
  let candidate = `${name} (copy)`;
  for (let n = 2; taken.has(candidate.toLowerCase()); n++)
    candidate = `${name} (copy ${n})`;
  return candidate;
}
