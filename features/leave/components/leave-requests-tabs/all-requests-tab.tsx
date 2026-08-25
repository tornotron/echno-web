'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
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
import { Pagination, ActiveFilterChip } from '@/components/common';
import {
  useEmployeeFilterFromParams,
  rowMatchesEmployeeFilter,
  ROLE_LABELS,
} from '@/hooks/use-employee-filter';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';
import { useOrganizationRequests } from '@/hooks/leave/use-leave';
import { Checkbox } from '@/components/shadcn/checkbox';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';
import { LeaveStatus } from '@/types/leave';
import {
  Department,
  getDepartmentLabel,
} from '@tornotron/echno-core/employee/types';
import { FileText, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { routes } from '@/nav';

const BASE = routes.workforce.leaves.manage.href;

export function AllRequestsTab() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  );
  const [deptFilter, setDeptFilter] = useState(
    searchParams.get('department') || 'all'
  );
  const [yearFilter, setYearFilter] = useState(
    searchParams.get('year') || new Date().getFullYear().toString()
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: requests } = useOrganizationRequests();
  const {
    employeeId,
    role,
    name: filterName,
    clear: clearEmployeeFilter,
  } = useEmployeeFilterFromParams();

  const departments = useMemo(
    () =>
      [
        ...new Set(requests?.map((r) => r.department).filter(Boolean)),
      ].toSorted() as string[],
    [requests]
  );

  const filtered = useMemo(() => {
    return (requests || []).filter((r) => {
      const matchSearch =
        !search ||
        r.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
        r.leaveTypeName?.toLowerCase().includes(search.toLowerCase()) ||
        r.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
        r.reason.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchDept = deptFilter === 'all' || r.department === deptFilter;
      const matchYear =
        yearFilter === 'all' ||
        new Date(r.startDate).getFullYear().toString() === yearFilter;
      const matchEmployee =
        employeeId == null ||
        role == null ||
        (role === 'approver'
          ? r.currentApproverId === employeeId ||
            (r.approvals?.some((a) => a.approverId === employeeId) ?? false)
          : rowMatchesEmployeeFilter(r, employeeId, role, {
              requester: (row) => row.employeeId,
              handover: (row) => row.handoverToId,
            }));
      return (
        matchSearch && matchStatus && matchDept && matchYear && matchEmployee
      );
    });
  }, [requests, search, statusFilter, deptFilter, yearFilter, employeeId, role]);

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

  const goToDetail = (id: number) =>
    router.push(`${BASE}/requests/${id}?from=org-requests`);

  return (
    <div className="space-y-4">
      {employeeId != null && filterName && (
        <ActiveFilterChip
          label={ROLE_LABELS[role ?? ''] ?? 'Filtered by'}
          name={filterName}
          onDismiss={clearEmployeeFilter}
        />
      )}
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
                  placeholder="Search by employee, leave type, or request number…"
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
                value={deptFilter}
                onValueChange={(v) => {
                  setDeptFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
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
                    <TableHead>Employee</TableHead>
                    <TableHead>Request #</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Days</TableHead>
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
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <EmployeeAvatar
                            employee={{ name: r.employeeName || 'Unknown' }}
                          />
                          <div>
                            <div className="font-medium">{r.employeeName}</div>
                            {r.department && (
                              <div className="text-muted-foreground text-xs">
                                {getDepartmentLabel(r.department as Department)}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
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
                    <div className="flex items-center space-x-3">
                      <EmployeeAvatar
                        employee={{ name: r.employeeName || 'Unknown' }}
                      />
                      <div>
                        <p className="text-foreground font-medium">
                          {r.employeeName}
                        </p>
                        {r.department && (
                          <p className="text-muted-foreground text-xs">
                            {getDepartmentLabel(r.department as Department)}
                          </p>
                        )}
                      </div>
                    </div>
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
              No leave requests have been created yet
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
