'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Lock,
  MoreVertical,
  Pencil,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { toast } from '@/lib/styles/toast-styles';
import { useSaveRoleGrants } from '@/hooks/access-control';
import { cn } from '@/lib/utils';
import { errorMessage } from '../lib/error-message';
import {
  lockedActions,
  mayChangeRole,
  samePermissions,
  setCell,
  toPermissionMap,
  type AccessCatalog,
  type AccessRole,
  type PermissionMap,
} from '@/types/access-control';
import { areaIcon } from '../lib/module-icons';
import { ActionSelect } from './action-select';

interface RolesMatrixProps {
  catalog: AccessCatalog | undefined;
  roles: AccessRole[];
  /** Roles the caller may change; other columns are read-only. */
  assignable: Set<string>;
  /** Unsaved cell edits: each changed role's whole permission map. */
  draft: Record<string, PermissionMap>;
  onDraftChange: (draft: Record<string, PermissionMap>) => void;
  isLoading: boolean;
  isError: boolean;
  onOpen: (role: AccessRole) => void;
  onDuplicate: (role: AccessRole) => void;
  onCreate: () => void;
}

/** Roles shown side by side; the rest are a page away. */
export const ROLES_PER_PAGE = 5;

/**
 * The table layout: areas down the side under their section headings, one
 * column per role, a coloured dropdown in every cell, five roles a page. A
 * cell's change waits, marked, until Save changes; Discard drops them all.
 * A column header opens the role's full editor. A column the caller may not
 * change is read-only, and a locked grant cannot be cleared.
 */
export function RolesMatrix({
  catalog,
  roles,
  assignable,
  draft,
  onDraftChange,
  isLoading,
  isError,
  onOpen,
  onDuplicate,
  onCreate,
}: RolesMatrixProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const save = useSaveRoleGrants();
  const areas = useMemo(() => catalog?.areas ?? [], [catalog]);

  // A query that names a role narrows the columns; one that names an area
  // narrows the rows. Both can match at once ("finance").
  const { columns, rows } = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { columns: roles, rows: areas };
    const matchedRoles = roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.subtitle?.toLowerCase().includes(q)
    );
    const matchedModules = areas.filter((m) =>
      m.label.toLowerCase().includes(q)
    );
    return {
      columns: matchedRoles.length > 0 ? matchedRoles : roles,
      rows:
        matchedModules.length > 0 || matchedRoles.length === 0
          ? matchedModules
          : areas,
    };
  }, [roles, areas, query]);

  const cells = useMemo(
    () =>
      new Map(
        roles.map((r) => [
          r.id,
          {
            map: toPermissionMap(r.grants, catalog?.scopes),
            locked: lockedActions(r.grants),
          },
        ])
      ),
    [roles, catalog]
  );
  const sections = (catalog?.sections ?? []).filter((s) =>
    rows.some((a) => a.section === s)
  );

  const pageCount = Math.max(1, Math.ceil(columns.length / ROLES_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const shown = columns.slice(
    safePage * ROLES_PER_PAGE,
    (safePage + 1) * ROLES_PER_PAGE
  );

  // Once the roles reload, an edit the server now holds is no longer pending.
  // This also clears what a save got through before a refused role stopped it.
  useEffect(() => {
    const kept = Object.entries(draft).filter(([id, map]) => {
      const server = cells.get(id)?.map;
      return server !== undefined && !samePermissions(map, server);
    });
    if (kept.length !== Object.keys(draft).length)
      onDraftChange(Object.fromEntries(kept));
  }, [cells, draft, onDraftChange]);

  const changedRoles = Object.keys(draft).length;

  function edit(role: AccessRole, area: string, cell: PermissionMap[string]) {
    const server = cells.get(role.id)?.map ?? {};
    const next = setCell(draft[role.id] ?? server, area, cell);
    const rest = { ...draft };
    delete rest[role.id];
    onDraftChange(
      samePermissions(next, server) ? rest : { ...rest, [role.id]: next }
    );
  }

  async function handleSave() {
    try {
      await save.mutateAsync(draft);
      toast.success(
        `Saved ${changedRoles} role${changedRoles === 1 ? '' : 's'}`
      );
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save the changes'));
    }
  }

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search modules or roles…"
            aria-label="Search modules or roles"
            className="h-8 pl-8 text-sm"
          />
        </div>
        {changedRoles > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500" aria-live="polite">
              Unsaved changes to {changedRoles} role
              {changedRoles === 1 ? '' : 's'}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => onDraftChange({})}
              disabled={save.isPending}
            >
              Discard
            </Button>
            <Button
              size="sm"
              className="h-8"
              onClick={handleSave}
              disabled={save.isPending}
            >
              {save.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Save changes
            </Button>
          </div>
        )}
        {pageCount > 1 && (
          <div className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
            <span aria-live="polite">
              Roles {safePage * ROLES_PER_PAGE + 1}–
              {safePage * ROLES_PER_PAGE + shown.length} of {columns.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Previous roles"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Next roles"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {(() => {
        if (isLoading)
          return (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          );
        if (isError)
          return (
            <div className="py-12">
              <Empty variant="default">
                <EmptyErrorMedia>
                  <ShieldCheck className="size-6" />
                </EmptyErrorMedia>
                <EmptyHeader>
                  <EmptyTitle>Failed to load roles</EmptyTitle>
                  <EmptyDescription>
                    An unexpected error occurred. Please try again.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          );
        if (!catalog || roles.length === 0 || rows.length === 0)
          return (
            <div className="py-12">
              <Empty variant="default">
                <EmptyMedia variant="icon">
                  <ShieldCheck className="size-6" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>
                    {roles.length === 0 ? 'No roles yet' : 'Nothing matches'}
                  </EmptyTitle>
                  <EmptyDescription>
                    {roles.length === 0
                      ? 'Create your first role to start granting access.'
                      : 'No module or role matches your search.'}
                  </EmptyDescription>
                </EmptyHeader>
                {roles.length === 0 && (
                  <Button onClick={onCreate}>New role</Button>
                )}
              </Empty>
            </div>
          );
        return (
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="bg-card sticky top-0 left-0 z-30 min-w-56 border-b px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    Area
                  </th>
                  {shown.map((role) => (
                    <th
                      key={role.id}
                      scope="col"
                      className="bg-card sticky top-0 z-20 min-w-40 border-b border-l px-2 py-2 align-top font-normal"
                    >
                      <RoleColumnHeader
                        role={role}
                        onOpen={() => onOpen(role)}
                        onDuplicate={() => onDuplicate(role)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              {sections.map((section) => (
                <tbody key={section}>
                  <tr className="bg-zinc-50 dark:bg-zinc-900">
                    <th
                      scope="colgroup"
                      colSpan={shown.length + 1}
                      className="border-b px-4 py-1.5 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
                    >
                      {section}
                    </th>
                  </tr>
                  {rows
                    .filter((a) => a.section === section)
                    .map((module) => {
                      const Icon = areaIcon(module.id);
                      return (
                        <tr
                          key={module.id}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <th
                            scope="row"
                            className="bg-card sticky left-0 z-10 border-b px-4 py-1.5 text-left font-normal"
                          >
                            <span className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                              <Icon className="size-4 shrink-0 text-zinc-500" />
                              <span className="whitespace-nowrap">
                                {module.label}
                              </span>
                            </span>
                          </th>
                          {shown.map((role) => {
                            const server = cells.get(role.id)?.map[module.id];
                            const value = draft[role.id]
                              ? draft[role.id][module.id]
                              : server;
                            const changed =
                              draft[role.id] !== undefined &&
                              !samePermissions(
                                { [module.id]: value ?? {} },
                                { [module.id]: server ?? {} }
                              );
                            return (
                              <td
                                key={role.id}
                                className="border-b border-l px-2 py-1.5"
                              >
                                <div
                                  className={cn(
                                    'flex justify-center rounded-md',
                                    changed &&
                                      'ring-2 ring-blue-400 ring-offset-1 dark:ring-blue-500'
                                  )}
                                  data-changed={changed || undefined}
                                >
                                  <ActionSelect
                                    area={module}
                                    value={value}
                                    locked={
                                      cells.get(role.id)?.locked[module.id]
                                    }
                                    scopes={catalog.scopes}
                                    disabled={
                                      save.isPending ||
                                      !mayChangeRole(role, assignable)
                                    }
                                    ariaLabel={`${role.name}: ${module.label}`}
                                    onChange={(cell) =>
                                      edit(role, module.id, cell)
                                    }
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              ))}
            </table>
          </div>
        );
      })()}
    </div>
  );
}

function RoleColumnHeader({
  role,
  onOpen,
  onDuplicate,
}: {
  role: AccessRole;
  onOpen: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div className="flex items-start gap-1">
      <button
        type="button"
        onClick={onOpen}
        className="focus-visible:ring-ring flex min-w-0 flex-1 flex-col items-center rounded-md px-1 py-1 text-center hover:bg-zinc-100 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-zinc-800"
      >
        <span className="flex items-center gap-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {role.system && (
            <Lock className="size-3 text-zinc-400" aria-label="Starting role" />
          )}
          {role.name}
        </span>
        {role.subtitle && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {role.subtitle}
          </span>
        )}
        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          <Users className="size-3" />
          {role.baseline ? 'Everyone' : role.memberIds.length}
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            aria-label={`More actions for ${role.name}`}
          >
            <MoreVertical className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onOpen}>
            <Pencil className="mr-2 size-4" />
            Edit role
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onDuplicate}>
            <Copy className="mr-2 size-4" />
            Duplicate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
