'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import type {
  AccessArea,
  AccessCatalog,
  AccessRole,
} from '@tornotron/echno-core/access/types';
import { cn } from '@/lib/utils';
import { areaIcon } from '../lib/module-icons';
import {
  offeredActions,
  offeredScopes,
  samePermissions,
  type AccessStanding,
  type AreaGrants,
  type PermissionMap,
} from '../lib/permissions';
import { ActionSelect } from './action-select';

interface RolesMatrixProps {
  catalog: AccessCatalog;
  /** The areas shown: those with an enforced action. */
  areas: AccessArea[];
  sections: string[];
  roles: AccessRole[];
  standing: AccessStanding;
  /** Each role's cells as the server holds them. */
  server: Map<string, PermissionMap>;
  /** Unsaved edits: each changed role's whole permission map. */
  draft: Record<string, PermissionMap>;
  onEdit: (role: AccessRole, area: string, cell: AreaGrants) => void;
  selectedRoleId: string | null;
  onSelect: (role: AccessRole) => void;
  disabled: boolean;
}

/** Roles shown side by side; the rest are a page away. */
export const ROLES_PER_PAGE = 5;

/**
 * Areas down the side under their section headings, one column per role,
 * a coloured dropdown in every cell, five roles a page. A cell's change
 * waits, marked, until Save changes. A column header selects the role and
 * opens its details beside the matrix. A column the caller may not change
 * is read-only.
 */
export function RolesMatrix({
  catalog,
  areas,
  sections,
  roles,
  standing,
  server,
  draft,
  onEdit,
  selectedRoleId,
  onSelect,
  disabled,
}: RolesMatrixProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

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
    const matchedAreas = areas.filter((a) => a.label.toLowerCase().includes(q));
    return {
      columns: matchedRoles.length > 0 ? matchedRoles : roles,
      rows:
        matchedAreas.length > 0 || matchedRoles.length === 0
          ? matchedAreas
          : areas,
    };
  }, [roles, areas, query]);

  const shownSections = sections.filter((s) =>
    rows.some((a) => a.section === s)
  );
  const pageCount = Math.max(1, Math.ceil(columns.length / ROLES_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const shown = columns.slice(
    safePage * ROLES_PER_PAGE,
    (safePage + 1) * ROLES_PER_PAGE
  );

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
            placeholder="Search modules or roles"
            aria-label="Search modules or roles"
            className="h-8 pl-8 text-sm"
          />
        </div>
        {pageCount > 1 && (
          <div className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
            <span aria-live="polite">
              Roles {safePage * ROLES_PER_PAGE + 1} to{' '}
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

      {roles.length === 0 || rows.length === 0 ? (
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
                  ? 'Create a role to start granting access.'
                  : 'No module or role matches your search.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="bg-card sticky top-0 left-0 z-30 min-w-52 border-b px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  Module
                </th>
                {shown.map((role) => (
                  <th
                    key={role.id}
                    scope="col"
                    className={cn(
                      'bg-card sticky top-0 z-20 min-w-40 border-b border-l px-2 py-2 align-top font-normal',
                      role.id === selectedRoleId &&
                        'bg-blue-50 dark:bg-blue-950/30'
                    )}
                  >
                    <RoleColumnHeader
                      role={role}
                      selected={role.id === selectedRoleId}
                      onSelect={() => onSelect(role)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            {shownSections.map((section) => (
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
                  .map((area) => {
                    const Icon = areaIcon(area.id);
                    return (
                      <tr
                        key={area.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <th
                          scope="row"
                          className="bg-card sticky left-0 z-10 border-b px-4 py-1.5 text-left font-normal"
                        >
                          <span className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                            <Icon className="size-4 shrink-0 text-zinc-500" />
                            <span className="whitespace-nowrap">
                              {area.label}
                            </span>
                          </span>
                        </th>
                        {shown.map((role) => {
                          const held = server.get(role.id)?.[area.id];
                          const value = draft[role.id]
                            ? draft[role.id][area.id]
                            : held;
                          const changed =
                            draft[role.id] !== undefined &&
                            !samePermissions(
                              { [area.id]: value ?? {} },
                              { [area.id]: held ?? {} }
                            );
                          return (
                            <td
                              key={role.id}
                              className={cn(
                                'border-b border-l px-2 py-1.5',
                                role.id === selectedRoleId &&
                                  'bg-blue-50/50 dark:bg-blue-950/20'
                              )}
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
                                  area={area}
                                  value={value}
                                  offered={offeredActions(role, area, standing)}
                                  scopes={offeredScopes(catalog, area)}
                                  disabled={disabled}
                                  ariaLabel={`${role.name}: ${area.label}`}
                                  onChange={(cell) =>
                                    onEdit(role, area.id, cell)
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
      )}
    </div>
  );
}

function RoleColumnHeader({
  role,
  selected,
  onSelect,
}: {
  role: AccessRole;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Open ${role.name}`}
      className="focus-visible:ring-ring flex w-full min-w-0 flex-col items-center rounded-md px-1 py-1 text-center hover:bg-zinc-100 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-zinc-800"
    >
      <span className="flex items-center gap-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {role.system && (
          <Lock className="size-3 text-zinc-400" aria-label="Fixed role" />
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
  );
}
