'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
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
import { Pagination } from '@/components/common';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';
import { useEmployeeRequests } from '@/hooks/leave/use-leave';
import { LeaveStatus } from '@/types/leave';
import { Checkbox } from '@/components/shadcn/checkbox';
import { FileText, AlertCircle, Calendar, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';

const BASE = '/users/dashboard/workforce/leaves/manage';

interface MyRequestsTabProps {
  employeeId: number;
}

export function MyRequestsTab({ employeeId }: MyRequestsTabProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(
    new Date().getFullYear().toString()
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: requests, isLoading, error } = useEmployeeRequests(employeeId);

  const filtered = useMemo(() => {
    return (requests || []).filter((r) => {
      const matchSearch =
        !search ||
        r.leaveTypeName?.toLowerCase().includes(search.toLowerCase()) ||
        r.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
        r.reason.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchYear =
        yearFilter === 'all' ||
        new Date(r.startDate).getFullYear().toString() === yearFilter;
      return matchSearch && matchStatus && matchYear;
    });
  }, [requests, search, statusFilter, yearFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const start = (page - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  const isAllSelected =
    paginated.length > 0 && paginated.every((r) => selectedIds.includes(r.id));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(
      checked
        ? paginated
            .map((r) => r.id)
            .filter((id): id is number => id !== undefined)
        : []
    );
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const total = requests?.length || 0;
  const draftCount =
    requests?.filter((r) => r.status === LeaveStatus.DRAFT).length || 0;
  const pendingCount =
    requests?.filter((r) => r.status === LeaveStatus.PENDING_APPROVAL).length ||
    0;
  const approvedCount =
    requests?.filter((r) => r.status === LeaveStatus.APPROVED).length || 0;
  const rejectedCount =
    requests?.filter((r) => r.status === LeaveStatus.REJECTED).length || 0;

  const goToDetail = (id: number) =>
    router.push(`${BASE}/requests/${id}?from=my-requests`);

  return (
    <div className="space-y-4">
      {filtered.length > 0 ? (
        <>
          {/* Desktop */}
          <Card className="hidden lg:block">
            <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-1">
              <div className="relative w-full max-w-xs">
                <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by leave type, request number, or reason…"
                  className="h-8 pl-8 text-sm"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={LeaveStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={LeaveStatus.PENDING_APPROVAL}>
                    Pending Approval
                  </SelectItem>
                  <SelectItem value={LeaveStatus.APPROVED}>Approved</SelectItem>
                  <SelectItem value={LeaveStatus.REJECTED}>Rejected</SelectItem>
                  <SelectItem value={LeaveStatus.CANCELLED}>
                    Cancelled
                  </SelectItem>
                  <SelectItem value={LeaveStatus.WITHDRAWN}>
                    Withdrawn
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={yearFilter}
                onValueChange={(v) => {
                  setYearFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[100px] text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {[0, 1, 2].map((offset) => {
                    const y = (new Date().getFullYear() - offset).toString();
                    return (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-2 border-l pl-3">
                <span className="text-xs whitespace-nowrap text-zinc-500">
                  Rows per page
                </span>
                <Select
                  value={perPage.toString()}
                  onValueChange={(v) => {
                    setPerPage(Number(v));
                    setPage(1);
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
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
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
                    <TableHead>Request #</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((r) => (
                    <TableRow
                      key={r.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => goToDetail(r.id)}
                    >
                      <TableCell
                        className="pl-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={
                            r.id !== undefined && selectedIds.includes(r.id)
                          }
                          onCheckedChange={(checked) =>
                            r.id !== undefined &&
                            handleSelectOne(r.id, checked as boolean)
                          }
                          aria-label={`Select request ${r.requestNumber}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        {r.requestNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="text-muted-foreground h-4 w-4" />
                          {r.leaveTypeName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {format(new Date(r.startDate), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-muted-foreground">
                            to {format(new Date(r.endDate), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {r.totalDays}d
                      </TableCell>
                      <TableCell>
                        <p className="text-muted-foreground max-w-[200px] truncate text-sm">
                          {r.reason}
                        </p>
                      </TableCell>
                      <TableCell>
                        <LeaveStatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {r.submittedAt
                          ? format(new Date(r.submittedAt), 'MMM dd, yyyy')
                          : r.createdAt
                            ? format(new Date(r.createdAt), 'MMM dd, yyyy')
                            : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <div className="flex items-center justify-between border-t px-4 py-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Showing {start + 1}–{Math.min(start + perPage, filtered.length)}{' '}
                of {filtered.length}
              </span>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </Card>

          {/* Mobile */}
          <div className="space-y-3 lg:hidden">
            {paginated.map((r) => (
              <Card
                key={r.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => goToDetail(r.id)}
              >
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="text-foreground font-mono text-sm font-medium">
                      {r.requestNumber}
                    </span>
                    <LeaveStatusBadge status={r.status} />
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <span className="text-foreground text-sm">
                      {r.leaveTypeName}
                    </span>
                    <span className="text-foreground ml-auto text-sm font-semibold">
                      {r.totalDays}d
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {format(new Date(r.startDate), 'MMM dd')} –{' '}
                    {format(new Date(r.endDate), 'MMM dd, yyyy')}
                  </p>
                </CardContent>
              </Card>
            ))}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      ) : (
        <Empty variant="default">
          <EmptyMedia variant="icon">
            <FileText className="size-6" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No leave requests found</EmptyTitle>
            <EmptyDescription>
              Get started by applying for your first leave
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => router.push(`${BASE}/requests/new`)}>
            Apply for Leave
          </Button>
        </Empty>
      )}
    </div>
  );
}
