'use client';

import { useState } from 'react';
import { Loader2, Lock, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/shadcn/avatar';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { useSetAccessUserRoles } from '@tornotron/echno-core/access/hooks';
import type {
  AccessRole,
  AccessUser,
  AccessUserRole,
} from '@tornotron/echno-core/access/types';
import { toast } from '@/lib/styles/toast-styles';
import { errorMessage } from '../lib/error-message';
import { scopeLabel } from '../lib/labels';
import { mayAssign, type AccessStanding } from '../lib/permissions';
import { AddPicker } from './add-picker';

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

const sameRole = (a: AccessUserRole, b: AccessUserRole) =>
  a.roleId === b.roleId && a.projectId === b.projectId;

const sameRoles = (
  a: readonly AccessUserRole[],
  b: readonly AccessUserRole[]
) => a.length === b.length && a.every((x) => b.some((y) => sameRole(x, y)));

interface PersonPanelProps {
  person: AccessUser;
  roles: AccessRole[];
  standing: AccessStanding;
  onDirtyChange: (dirty: boolean) => void;
  onClose: () => void;
}

/**
 * One person beside the Users table: the roles they hold, which a caller
 * who may assign them can add or take off and then save, and any access
 * given to them directly, which this screen only shows.
 */
export function PersonPanel({
  person,
  roles,
  standing,
  onDirtyChange,
  onClose,
}: PersonPanelProps) {
  const [draft, setDraft] = useState<AccessUserRole[]>(person.roles);
  const save = useSetAccessUserRoles();
  const self = person.employeeId === standing.access?.employeeId;
  const dirty = !sameRoles(draft, person.roles);
  const byId = new Map(roles.map((r) => [r.id, r]));

  const update = (next: AccessUserRole[]) => {
    setDraft(next);
    onDirtyChange(!sameRoles(next, person.roles));
  };

  const mayChange = (role: AccessRole | undefined) =>
    !self && role !== undefined && mayAssign(role, standing);

  // A carried-over role is kept by those who hold it but not handed out again.
  const addable = roles
    .filter(
      (r) =>
        mayChange(r) &&
        !r.carriedOver &&
        !draft.some((d) => d.roleId === r.id && d.projectId === undefined)
    )
    .map((r) => ({ id: r.id, label: r.name, sublabel: r.subtitle }));
  const baseline = roles.find((r) => r.baseline);

  async function handleSave() {
    try {
      await save.mutateAsync({ employeeId: person.employeeId, roles: draft });
      onDirtyChange(false);
      toast.success(`Roles saved for ${person.name}`);
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save their roles'));
    }
  }

  return (
    <aside
      aria-label={`${person.name} access`}
      className="flex min-w-0 flex-col border-t lg:border-t-0 lg:border-l"
    >
      <div className="flex items-start gap-3 border-b px-4 py-3">
        <Avatar className="size-10">
          <AvatarFallback className="bg-blue-50 text-sm font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
            {initialsOf(person.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <span className="truncate">{person.name}</span>
            {!person.active && (
              <Badge className="bg-zinc-100 font-normal text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                Inactive
              </Badge>
            )}
          </p>
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            {[person.designation, person.email].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Close person details"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="space-y-4 px-4 py-3">
        {self && (
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Lock className="size-3" />
            Nobody can change their own roles.
          </p>
        )}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Roles
            </h4>
            {!self && standing.canEdit && (
              <AddPicker
                label="Add role"
                noun="roles"
                options={addable}
                onPick={(roleId) => update([...draft, { roleId }])}
                disabled={save.isPending}
              />
            )}
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {baseline && (
              <li
                title="Everyone holds it"
                className="inline-flex h-7 items-center rounded-full border border-dashed px-2.5 text-sm text-zinc-500 dark:text-zinc-400"
              >
                {baseline.name}
              </li>
            )}
            {draft.map((held) => {
              const role = byId.get(held.roleId);
              const label = role?.name ?? 'Removed role';
              return (
                <li
                  key={`${held.roleId}-${held.projectId ?? 'org'}`}
                  className="inline-flex h-7 items-center gap-1 rounded-full border bg-white pr-1 pl-2.5 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  {label}
                  {held.projectId !== undefined && (
                    <span className="text-xs text-zinc-500">· one project</span>
                  )}
                  {mayChange(role) && (
                    <button
                      type="button"
                      onClick={() =>
                        update(draft.filter((d) => !sameRole(d, held)))
                      }
                      disabled={save.isPending}
                      className="rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                      aria-label={`Remove ${label}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {person.grants.length > 0 && (
          <section className="space-y-1">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Access given directly
            </h4>
            <p className="text-xs text-zinc-500">
              Shown for reference. It is not changed from this screen.
            </p>
            <ul className="text-sm text-zinc-700 dark:text-zinc-300">
              {person.grants.map((g) => (
                <li key={`${g.permission}-${g.scope}-${g.projectId ?? 'org'}`}>
                  {g.permission} · {scopeLabel(g.scope)}
                  {g.projectId !== undefined && ' · one project'}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {!self && standing.canEdit && (
        <div className="bg-card/95 sticky bottom-0 mt-auto flex items-center gap-2 border-t px-4 py-3 backdrop-blur">
          <span className="text-xs text-zinc-500" aria-live="polite">
            {dirty ? 'Unsaved changes' : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => update(person.roles)}
            disabled={!dirty || save.isPending}
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty || save.isPending}
          >
            {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save roles
          </Button>
        </div>
      )}
    </aside>
  );
}
