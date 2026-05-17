'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mail, Copy, Check } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Invitation, getInvitationStatus } from '@/types/invitation/invitation';
import { Checkbox } from '@/components/shadcn/checkbox';
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
import { routes } from '@/nav';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      aria-label={copied ? 'Copied' : 'Copy invite code'}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

interface InvitationTableProps {
  invitations: Invitation[];
}

export function InvitationTable({ invitations }: InvitationTableProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return invitations.filter((inv) => {
      const matchesSearch =
        !q ||
        inv.employeeDetails.employeeName?.toLowerCase().includes(q) ||
        inv.inviteCode.toLowerCase().includes(q) ||
        inv.employeeDetails.employeeId?.toLowerCase().includes(q) ||
        inv.employeeDetails.email?.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' || getInvitationStatus(inv) === statusFilter;
      const matchesDept =
        departmentFilter === 'all' ||
        inv.employeeDetails.department === departmentFilter;
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [invitations, searchQuery, statusFilter, departmentFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const isAllSelected =
    paginated.length > 0 &&
    paginated.every((inv) => selectedIds.includes(inv.inviteCode));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? paginated.map((inv) => inv.inviteCode) : []);
  };

  const handleSelectOne = (inviteCode: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, inviteCode] : prev.filter((x) => x !== inviteCode)
    );
  };

  return (
    <Card className="gap-0 py-0">
      {/* Search & filter bar */}
      <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-1">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, code, email..."
            className="h-8 pl-8 text-sm"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={departmentFilter}
          onValueChange={(v) => {
            setDepartmentFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Quality">Quality</SelectItem>
            <SelectItem value="Safety">Safety</SelectItem>
            <SelectItem value="Human Resources">Human Resources</SelectItem>
            <SelectItem value="Operations">Operations</SelectItem>
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
              <TableHead className="w-12 pl-5">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invite Code</TableHead>
              <TableHead>Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
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
                key={invitation.inviteCode}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() =>
                  router.push(
                    routes.workforce.employees.invitations.detail(
                      invitation.inviteCode
                    ).href
                  )
                }
              >
                <TableCell
                  className="pl-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedIds.includes(invitation.inviteCode)}
                    onCheckedChange={(checked) =>
                      handleSelectOne(invitation.inviteCode, checked as boolean)
                    }
                    aria-label={`Select ${invitation.employeeDetails.employeeName || 'invitation'}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <InvitationAvatar
                      name={invitation.employeeDetails.employeeName}
                    />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {invitation.employeeDetails.employeeName || 'N/A'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {invitation.employeeDetails.employeeId ||
                          'Not Assigned'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {invitation.employeeDetails.designation}
                  </span>
                </TableCell>
                <TableCell>
                  <InvitationStatusBadge
                    status={getInvitationStatus(invitation)}
                  />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
                      {invitation.inviteCode}
                    </span>
                    <CopyButton text={invitation.inviteCode} />
                  </div>
                </TableCell>
                <TableCell>
                  {invitation.expiryDate ? (
                    <>
                      <div className="text-sm text-zinc-900 dark:text-zinc-100">
                        {format(invitation.expiryDate, 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {format(invitation.expiryDate, 'h:mm a')}
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-zinc-400">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Footer — count + pagination */}
      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing {filtered.length === 0 ? 0 : startIndex + 1}–
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
