'use client';

import { useMemo, useState } from 'react';
import { Building2, Loader2, Search, UsersRound } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Empty,
  EmptyDescription,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import {
  ACCESS_GROUP_KIND_LABELS,
  type AccessGroup,
  type AccessRole,
} from '@/types/access-control';
import { ChipList } from './chip-list';

interface GroupsTableProps {
  groups: AccessGroup[];
  roles: AccessRole[];
  isLoading: boolean;
  isError: boolean;
  onOpen: (groupId: number) => void;
}

/** The table layout for departments and groups: their roles, reach and own access. */
export function GroupsTable({
  groups,
  roles,
  isLoading,
  isError,
  onOpen,
}: GroupsTableProps) {
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('all');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups
      .filter((g) => kindFilter === 'all' || g.kind === kindFilter)
      .filter(
        (g) =>
          !q ||
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
      )
      .map((group) => {
        const groupRoles = roles.filter((r) => group.roleIds.includes(r.id));
        const members = new Set([
          ...group.userIds,
          ...groupRoles.flatMap((r) => r.userIds),
        ]);
        return {
          group,
          roleNames: groupRoles.map((r) => r.name),
          memberCount: members.size,
          permissionCount: Object.keys(group.permissions).length,
        };
      });
  }, [groups, roles, search, kindFilter]);

  const hasActiveFilters = search.trim() !== '' || kindFilter !== 'all';

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments and groups…"
            aria-label="Search departments and groups"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger
            className="h-8 w-36 text-xs"
            aria-label="Filter by type"
          >
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="department">Departments</SelectItem>
            <SelectItem value="group">Groups</SelectItem>
          </SelectContent>
        </Select>
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
                  <UsersRound className="size-6" />
                </EmptyErrorMedia>
                <EmptyHeader>
                  <EmptyTitle>Failed to load groups</EmptyTitle>
                  <EmptyDescription>
                    An unexpected error occurred. Please try again.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          );
        if (rows.length > 0)
          return (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Name</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  <TableHead className="pr-4 text-center">
                    Own permissions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(
                  ({ group, roleNames, memberCount, permissionCount }) => {
                    const Icon =
                      group.kind === 'department' ? Building2 : UsersRound;
                    const open = () => onOpen(group.id);
                    return (
                      <TableRow
                        key={group.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open ${group.name}`}
                        className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        onClick={open}
                        onKeyDown={(e) => {
                          if (e.key === ' ') {
                            e.preventDefault();
                            open();
                          } else if (e.key === 'Enter') open();
                        }}
                      >
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                              <Icon className="size-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                <span className="truncate">{group.name}</span>
                                <Badge
                                  variant="outline"
                                  className="font-normal"
                                >
                                  {ACCESS_GROUP_KIND_LABELS[group.kind]}
                                </Badge>
                              </p>
                              <p className="max-w-md truncate text-xs text-zinc-500 dark:text-zinc-400">
                                {group.description || '—'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ChipList names={roleNames} max={3} />
                        </TableCell>
                        <TableCell className="text-center text-sm text-zinc-700 dark:text-zinc-300">
                          {memberCount}
                        </TableCell>
                        <TableCell className="pr-4 text-center text-sm text-zinc-700 dark:text-zinc-300">
                          {permissionCount > 0
                            ? `${permissionCount} module${permissionCount === 1 ? '' : 's'}`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}
              </TableBody>
            </Table>
          );
        return (
          <div className="py-12">
            <Empty variant="default">
              <EmptyMedia variant="icon">
                <UsersRound className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No departments or groups found</EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? 'Nothing matches your filters. Try adjusting your search.'
                    : 'Group roles and people by department, or into any team that needs shared access.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        );
      })()}

      <div className="border-t px-4 py-2 text-sm text-zinc-500">
        {rows.length === groups.length
          ? `${groups.length} record${groups.length === 1 ? '' : 's'}`
          : `${rows.length} of ${groups.length} records`}
      </div>
    </div>
  );
}
