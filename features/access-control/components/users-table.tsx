'use client';

import { useMemo, useState } from 'react';
import { Loader2, Search, UserCog } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/shadcn/avatar';
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
import { Pagination } from '@/components/common';
import {
  rolesOf,
  splitPermission,
  type AccessGroup,
  type AccessRole,
  type AccessUser,
} from '@/types/access-control';
import { ChipList } from './chip-list';
import { initialsOf } from './user-editor';

interface UsersTableProps {
  users: AccessUser[];
  roles: AccessRole[];
  groups: AccessGroup[];
  isLoading: boolean;
  isError: boolean;
  onOpen: (employeeId: number) => void;
}

/** The table layout for users: who holds which roles and groups, one row each. */
export function UsersTable({
  users,
  roles,
  groups,
  isLoading,
  isError,
  onOpen,
}: UsersTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const rows = useMemo(
    () =>
      users.map((user) => {
        // Everyone holds the baseline role, so it says nothing here.
        const userRoles = rolesOf(user, roles, groups).filter(
          (r) => !r.baseline
        );
        const roleIds = new Set(userRoles.map((r) => r.id));
        return {
          user,
          roleIds,
          roleNames: userRoles.map((r) => r.name),
          groupNames: groups
            .filter((g) => user.groupIds.includes(g.id))
            .map((g) => g.name),
          extraCount: new Set(
            user.grants.map((g) => splitPermission(g.permission)[0])
          ).size,
        };
      }),
    [users, roles, groups]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(({ user, roleIds }) => {
      if (
        q &&
        !user.name.toLowerCase().includes(q) &&
        !user.email?.toLowerCase().includes(q) &&
        !user.designation?.toLowerCase().includes(q)
      )
        return false;
      if (roleFilter === 'none') return roleIds.size === 0;
      if (roleFilter !== 'all') return roleIds.has(roleFilter);
      return true;
    });
  }, [rows, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
  const paginated = filtered.slice(startIndex, endIndex);
  const hasActiveFilters = search.trim() !== '' || roleFilter !== 'all';

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search users…"
            aria-label="Search users"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger
            className="h-8 w-44 text-xs"
            aria-label="Filter by role"
          >
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="none">No role</SelectItem>
            {roles
              .filter((r) => !r.baseline)
              .map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2 border-l pl-3">
          <span className="text-xs whitespace-nowrap text-zinc-500">
            Rows per page
          </span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className="h-8 w-16 text-xs"
              aria-label="Rows per page"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <UserCog className="size-6" />
                </EmptyErrorMedia>
                <EmptyHeader>
                  <EmptyTitle>Failed to load users</EmptyTitle>
                  <EmptyDescription>
                    An unexpected error occurred. Please try again.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          );
        if (paginated.length > 0)
          return (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Departments & Groups</TableHead>
                  <TableHead className="text-center">Extra access</TableHead>
                  <TableHead className="pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(
                  ({ user, roleNames, groupNames, extraCount }) => {
                    const open = () => onOpen(user.employeeId);
                    return (
                      <TableRow
                        key={user.employeeId}
                        role="button"
                        tabIndex={0}
                        aria-label={`Manage access for ${user.name}`}
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
                            <Avatar className="size-8">
                              <AvatarFallback className="bg-blue-50 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                                {initialsOf(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {user.name}
                              </p>
                              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ChipList names={roleNames} emptyLabel="No role" />
                        </TableCell>
                        <TableCell>
                          <ChipList names={groupNames} />
                        </TableCell>
                        <TableCell className="text-center text-sm text-zinc-700 dark:text-zinc-300">
                          {extraCount > 0
                            ? `${extraCount} area${extraCount === 1 ? '' : 's'}`
                            : '—'}
                        </TableCell>
                        <TableCell className="pr-4">
                          {user.active ? (
                            <Badge className="bg-green-100 font-normal text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-zinc-100 font-normal text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              Inactive
                            </Badge>
                          )}
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
                <UserCog className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No users found</EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? 'No users match your filters. Try adjusting your search.'
                    : 'Invite people to the organization to manage their access here.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        );
      })()}

      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-sm text-zinc-500">
          {filtered.length === 0
            ? '0 records'
            : `${startIndex + 1}–${endIndex} of ${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
        </span>
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
