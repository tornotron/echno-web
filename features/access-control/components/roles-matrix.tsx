'use client';

import { useMemo, useState } from 'react';
import {
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
import { useSetRolePermission } from '@/hooks/access-control';
import { ACCESS_MODULES, type AccessRole } from '@/types/access-control';
import { ACCESS_MODULE_ICONS } from '../lib/module-icons';
import { ActionSelect } from './action-select';

interface RolesMatrixProps {
  roles: AccessRole[];
  isLoading: boolean;
  isError: boolean;
  onOpen: (role: AccessRole) => void;
  onDuplicate: (role: AccessRole) => void;
  onCreate: () => void;
}

/**
 * The table layout: modules down the side, one column per role, a coloured
 * dropdown in every cell. A cell saves as soon as it changes; a
 * column header opens the role's full editor.
 */
export function RolesMatrix({
  roles,
  isLoading,
  isError,
  onOpen,
  onDuplicate,
  onCreate,
}: RolesMatrixProps) {
  const [query, setQuery] = useState('');
  const setPermission = useSetRolePermission();

  // A query that names a role narrows the columns; one that names a module
  // narrows the rows. Both can match at once ("finance").
  const { columns, rows } = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { columns: roles, rows: ACCESS_MODULES };
    const matchedRoles = roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.subtitle?.toLowerCase().includes(q)
    );
    const matchedModules = ACCESS_MODULES.filter((m) =>
      m.label.toLowerCase().includes(q)
    );
    return {
      columns: matchedRoles.length > 0 ? matchedRoles : roles,
      rows:
        matchedModules.length > 0 || matchedRoles.length === 0
          ? matchedModules
          : ACCESS_MODULES,
    };
  }, [roles, query]);

  return (
    <div className="flex min-w-0 flex-col">
      <div className="border-b px-4 py-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules or roles…"
            aria-label="Search modules or roles"
            className="h-8 pl-8 text-sm"
          />
        </div>
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
        if (roles.length === 0 || rows.length === 0)
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th
                    scope="col"
                    className="bg-card sticky left-0 z-10 min-w-56 px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    Module / Feature
                  </th>
                  {columns.map((role) => (
                    <th
                      key={role.id}
                      scope="col"
                      className="min-w-32 border-l px-2 py-2 align-top font-normal"
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
              <tbody>
                {rows.map((module) => {
                  const Icon = ACCESS_MODULE_ICONS[module.id];
                  return (
                    <tr
                      key={module.id}
                      className="border-b last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <th
                        scope="row"
                        className="bg-card sticky left-0 z-10 px-4 py-1.5 text-left font-normal"
                      >
                        <span className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                          <Icon className="size-4 shrink-0 text-zinc-500" />
                          <span className="whitespace-nowrap">
                            {module.label}
                          </span>
                        </span>
                      </th>
                      {columns.map((role) => (
                        <td key={role.id} className="border-l px-2 py-1.5">
                          <div className="flex justify-center">
                            <ActionSelect
                              value={role.permissions[module.id] ?? []}
                              disabled={role.isSystem}
                              ariaLabel={`${role.name}: ${module.label}`}
                              onChange={(actions) =>
                                setPermission.mutate(
                                  {
                                    roleId: role.id,
                                    moduleId: module.id,
                                    actions,
                                  },
                                  {
                                    onError: (error) =>
                                      toast.error(
                                        error instanceof Error
                                          ? error.message
                                          : 'Could not change the permission'
                                      ),
                                  }
                                )
                              }
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
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
          {role.isSystem && (
            <Lock className="size-3 text-zinc-400" aria-label="System role" />
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
          {role.userIds.length}
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
