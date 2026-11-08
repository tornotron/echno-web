'use client';

import { useMemo, useState } from 'react';
import { Search, UserCog } from 'lucide-react';
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
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import type {
  AccessRole,
  AccessUser,
} from '@tornotron/echno-core/access/types';
import { cn } from '@/lib/utils';
import type { AccessStanding } from '../lib/permissions';
import { ChipList } from './chip-list';
import { initialsOf, PersonPanel } from './person-panel';

interface UsersTabProps {
  users: AccessUser[];
  roles: AccessRole[];
  standing: AccessStanding;
  selectedId: number | null;
  onSelect: (employeeId: number | null) => void;
  onDirtyChange: (dirty: boolean) => void;
}

/** Everyone in the organization and the roles they hold; a row opens the person beside the table. */
export function UsersTab({
  users,
  roles,
  standing,
  selectedId,
  onSelect,
  onDirtyChange,
}: UsersTabProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const names = useMemo(
    () => new Map(roles.map((r) => [r.id, r.name])),
    [roles]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (
        q &&
        !user.name.toLowerCase().includes(q) &&
        !user.email?.toLowerCase().includes(q) &&
        !user.designation?.toLowerCase().includes(q)
      )
        return false;
      if (roleFilter === 'none') return user.roleIds.length === 0;
      if (roleFilter !== 'all') return user.roleIds.includes(roleFilter);
      return true;
    });
  }, [users, search, roleFilter]);

  const selected = users.find((u) => u.employeeId === selectedId) ?? null;

  return (
    <div
      className={cn(
        'grid min-w-0',
        selected && 'lg:grid-cols-[minmax(0,1fr)_24rem]'
      )}
    >
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people"
              aria-label="Search people"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
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
        </div>

        {filtered.length === 0 ? (
          <div className="py-12">
            <Empty variant="default">
              <EmptyMedia variant="icon">
                <UserCog className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No people found</EmptyTitle>
                <EmptyDescription>
                  {users.length > 0
                    ? 'Nobody matches your filters.'
                    : 'Invite people to the organization to manage their access here.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Person</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => {
                  const open = () =>
                    onSelect(
                      user.employeeId === selectedId ? null : user.employeeId
                    );
                  return (
                    <TableRow
                      key={user.employeeId}
                      role="button"
                      tabIndex={0}
                      aria-label={`Manage access for ${user.name}`}
                      aria-pressed={user.employeeId === selectedId}
                      className={cn(
                        'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                        user.employeeId === selectedId &&
                          'bg-blue-50 dark:bg-blue-950/30'
                      )}
                      onClick={open}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          open();
                        }
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
                              {user.designation ?? user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ChipList
                          names={user.roleIds
                            .map((id) => names.get(id))
                            .filter((n): n is string => n !== undefined)}
                          emptyLabel="No role"
                        />
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
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {selected && (
        <PersonPanel
          key={selected.employeeId}
          person={selected}
          roles={roles}
          standing={standing}
          onDirtyChange={onDirtyChange}
          onClose={() => onSelect(null)}
        />
      )}
    </div>
  );
}
