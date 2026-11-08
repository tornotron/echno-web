'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mail } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import type {
  MemberInvitation,
  MemberInvitationStage,
} from '@tornotron/echno-core/member-invitations/types';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
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
import { Pagination } from '@/components/common';
import { format } from 'date-fns';
import { InvitationStatusBadge } from './invitation-status-badge';
import { InvitationAvatar } from './invitation-avatar';
import { InvitationActions } from './invitation-actions';
import { INVITATION_STAGES, STAGE_LABEL } from '../lib/invitation-stage';
import { useInvitationNames } from '../lib/use-invitation-names';
import { routes } from '@/nav';

interface InvitationTableProps {
  invitations: MemberInvitation[];
}

export function InvitationTable({ invitations }: InvitationTableProps) {
  const router = useRouter();
  const names = useInvitationNames();

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | MemberInvitationStage>(
    'all'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invitations.filter((inv) => {
      const matchesSearch =
        !q ||
        inv.email.toLowerCase().includes(q) ||
        inv.employee.employeeName?.toLowerCase().includes(q) ||
        inv.employee.employeeId?.toLowerCase().includes(q) ||
        inv.employee.designation?.toLowerCase().includes(q);
      const matchesStage = stageFilter === 'all' || inv.status === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [invitations, searchQuery, stageFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-6">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by email, name, employee ID..."
            className="h-8 pl-8 text-sm"
          />
        </div>

        <Select
          value={stageFilter}
          onValueChange={(v) => {
            setStageFilter(v as 'all' | MemberInvitationStage);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-[200px] text-xs">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {INVITATION_STAGES.filter((s) => s !== 'UNKNOWN').map((stage) => (
              <SelectItem key={stage} value={stage}>
                {STAGE_LABEL[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2 border-l pl-3">
          <span className="text-xs whitespace-nowrap text-zinc-500">
            Rows per page
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[60px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Invited</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Empty variant="inline">
                    <EmptyMedia variant="icon">
                      <Mail className="size-6" />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>No invitations found</EmptyTitle>
                      <EmptyDescription>
                        Try adjusting your search or filters
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {paginated.map((invitation) => (
              <TableRow
                key={invitation.id}
                className="hover:bg-muted/50 cursor-pointer"
                data-testid="invitation-row"
                onClick={() =>
                  router.push(
                    routes.workforce.employees.invitations.detail(invitation.id)
                      .href
                  )
                }
              >
                <TableCell className="pl-5">
                  <div className="flex items-center space-x-3">
                    <InvitationAvatar
                      name={
                        invitation.employee.employeeName ?? invitation.email
                      }
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {invitation.email}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {[
                          invitation.employee.designation,
                          invitation.employee.employeeId,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'No details yet'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {invitation.roles.length === 0 ? (
                    <span className="text-sm text-zinc-500">
                      Employee access only
                    </span>
                  ) : (
                    <ul className="space-y-0.5 text-sm text-zinc-700 dark:text-zinc-300">
                      {invitation.roles.map((role) => (
                        <li key={`${role.roleId}-${role.projectId ?? 'org'}`}>
                          {names.describe(role)}
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
                <TableCell>
                  <InvitationStatusBadge status={invitation.status} />
                </TableCell>
                <TableCell>
                  {invitation.expiresAt ? (
                    <>
                      <div className="text-sm text-zinc-900 dark:text-zinc-100">
                        {format(invitation.expiresAt, 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {format(invitation.expiresAt, 'h:mm a')}
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-zinc-400">Not set</span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <InvitationActions invitation={invitation} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing {filtered.length === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(startIndex + itemsPerPage, filtered.length)} of{' '}
          {filtered.length}
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </Card>
  );
}
