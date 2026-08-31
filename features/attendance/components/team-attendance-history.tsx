'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { ActiveFilterChip, Pagination } from '@/components/common';
import {
  ROLE_LABELS,
  useEmployeeFilterFromParams,
} from '@/hooks/use-employee-filter';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/shadcn/tooltip';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Search,
  TrendingUp,
  User,
} from 'lucide-react';
import { format, startOfMonth, subDays } from 'date-fns';
import { attendanceService } from '@tornotron/echno-core/attendance/services';
import { attendanceKeys } from '@tornotron/echno-core/attendance/hooks/keys';
import {
  useEmployeesByProject,
  useProjects,
  useProjectsByEmployee,
} from '@tornotron/echno-core/project/hooks';
import {
  useCurrentUserEmployee,
  useEmployees,
} from '@tornotron/echno-core/employee/hooks';
import { useAttendanceRole } from '@/hooks/attendance';
import type { Attendance } from '@tornotron/echno-core/attendance/types';
import type { Employee } from '@tornotron/echno-core/employee/types';
import {
  AttendanceStatus,
  getAttendanceStatusColor,
  getAttendanceStatusLabel,
} from '@tornotron/echno-core/attendance/types';

// Hard cap on parallel attendance fan-out so we never fire 500 queries
// when an admin views "all employees, all projects".
const MAX_PARALLEL_EMPLOYEES = 50;

interface TeamAttendanceHistoryProps {
  /** Hide the internal stats card (page-level shell may render its own above
   *  the tab switcher). */
  hideStats?: boolean;
}

export function TeamAttendanceHistory({
  hideStats = false,
}: TeamAttendanceHistoryProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin } = useAttendanceRole();
  const { data: currentUserEmployee } = useCurrentUserEmployee();
  const meId = currentUserEmployee?.id;

  // ── Filter state ───────────────────────────────────────────────────────────
  const today = new Date();
  const [fromDate, setFromDate] = useState(
    format(startOfMonth(today), 'yyyy-MM-dd')
  );
  const [toDate, setToDate] = useState(format(today, 'yyyy-MM-dd'));
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // Honor a ?search= deep link from the manager hub or detail page.
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') ?? ''
  );
  // The ?employeeId= deep link an attendance record's employee name sets. It is
  // an id rather than a name, so unlike ?search= it cannot match the wrong
  // person, and it narrows the fetch rather than the fetched rows.
  const {
    employeeId: filterEmployeeId,
    role: filterRole,
    name: filterName,
    clear: clearEmployeeFilter,
  } = useEmployeeFilterFromParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // ── Project scope ──────────────────────────────────────────────────────────
  // Admin → every project in the org.
  // Manager → only the projects they are members of (proxy for "responsible for").
  const { data: allProjects = [] } = useProjects();
  const { data: myProjects = [] } = useProjectsByEmployee(
    isAdmin ? undefined : meId
  );
  const visibleProjects = isAdmin ? allProjects : myProjects;

  // ── Employee scope ─────────────────────────────────────────────────────────
  // If a specific project is selected, target only that project's members.
  // Otherwise: admin → all employees, manager → union of members across their projects.
  const projectId = projectFilter === 'all' ? undefined : Number(projectFilter);
  const { data: projectMembers = [] } = useEmployeesByProject(projectId);
  const { data: allEmployees = [] } = useEmployees();

  const targetEmployees = useMemo<Employee[]>(() => {
    if (projectId) return projectMembers;
    if (isAdmin) return allEmployees;
    // Manager with no project filter — union of members across their projects.
    const seen = new Set<number>();
    const result: Employee[] = [];
    for (const p of myProjects) {
      for (const m of p.members ?? []) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          result.push(m);
        }
      }
    }
    return result;
  }, [projectId, projectMembers, isAdmin, allEmployees, myProjects]);

  // This screen answers exactly one role. A link carrying any other belongs to
  // another module, and honouring it here would answer a question nobody asked;
  // showing a chip for it would be worse, since the chip would name a person the
  // list was never narrowed to. So one predicate decides both.
  const employeeFilterApplies =
    filterEmployeeId != null && filterRole === 'employee';

  // Narrowing happens before the cap, and that ordering is the whole point.
  // The fetch is one request per employee capped at MAX_PARALLEL_EMPLOYEES, so
  // filtering the rows afterwards would silently return nothing for anybody who
  // fell outside the first fifty, while the screen still read as an answer.
  const scopedEmployees = employeeFilterApplies
    ? targetEmployees.filter((e) => e.id === filterEmployeeId)
    : targetEmployees;

  const isCapped = scopedEmployees.length > MAX_PARALLEL_EMPLOYEES;
  const fetchEmployees = isCapped
    ? scopedEmployees.slice(0, MAX_PARALLEL_EMPLOYEES)
    : scopedEmployees;

  // ── Parallel attendance fetch ──────────────────────────────────────────────
  const queries = useQueries({
    queries: fetchEmployees.map((emp) => ({
      queryKey: attendanceKeys.byEmployee(emp.id, fromDate, toDate),
      queryFn: () => attendanceService.getByEmployee(emp.id, fromDate, toDate),
      enabled: !!emp.id && !!fromDate && !!toDate,
      staleTime: 60_000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const records: Attendance[] = useMemo(() => {
    const flat: Attendance[] = [];
    for (const q of queries) {
      if (q.data) flat.push(...q.data);
    }
    return flat;
  }, [queries]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = records;
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.employeeName?.toLowerCase().includes(q) ||
          r.projectName?.toLowerCase().includes(q)
      );
    }
    // Newest first, employee name as tie-break.
    return [...result].toSorted((a, b) => {
      const dateCmp = b.date.getTime() - a.date.getTime();
      if (dateCmp !== 0) return dateCmp;
      return (a.employeeName ?? '').localeCompare(b.employeeName ?? '');
    });
  }, [records, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);
  const hasActiveFilters =
    statusFilter !== 'all' || projectFilter !== 'all' || searchQuery !== '';

  // ── Stats over the filtered set ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filtered.length;
    const present = filtered.filter(
      (r) =>
        r.status === AttendanceStatus.present ||
        r.status === AttendanceStatus.overtime
    ).length;
    const late = filtered.filter(
      (r) => r.status === AttendanceStatus.late
    ).length;
    const absent = filtered.filter(
      (r) => r.status === AttendanceStatus.absent
    ).length;
    const pendingApproval = filtered.filter(
      (r) => r.approvalStatus === 'pending'
    ).length;
    return { total, present, late, absent, pendingApproval };
  }, [filtered]);

  // Quick date ranges
  const setRange = (start: string, end: string) => {
    setFromDate(start);
    setToDate(end);
    setCurrentPage(1);
  };
  const handleThisMonth = () =>
    setRange(
      format(startOfMonth(today), 'yyyy-MM-dd'),
      format(today, 'yyyy-MM-dd')
    );
  const handleLast30 = () =>
    setRange(
      format(subDays(today, 29), 'yyyy-MM-dd'),
      format(today, 'yyyy-MM-dd')
    );
  const handleLast90 = () =>
    setRange(
      format(subDays(today, 89), 'yyyy-MM-dd'),
      format(today, 'yyyy-MM-dd')
    );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6">
      {employeeFilterApplies && filterName && (
        <ActiveFilterChip
          label={ROLE_LABELS[filterRole ?? ''] ?? 'Filtered by'}
          name={filterName}
          onDismiss={clearEmployeeFilter}
        />
      )}

      {isCapped && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/20">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 size-4 text-amber-600 dark:text-amber-400" />
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <p className="font-medium">
                Showing the first {MAX_PARALLEL_EMPLOYEES} of{' '}
                {scopedEmployees.length} employees.
              </p>
              <p className="text-xs">
                Pick a specific project from the filter below to narrow the
                view.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {!hideStats && (
        <Card className="gap-0 p-6">
          <div className="sm:divide-border grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
            <div className="flex flex-col gap-1 sm:pr-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Total Records
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {stats.total}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                in selected range
              </p>
            </div>
            <div className="flex flex-col gap-1 sm:px-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Present
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {stats.present}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                  <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                including overtime
              </p>
            </div>
            <div className="flex flex-col gap-1 sm:px-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Late / Absent
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {stats.late + stats.absent}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                  <AlertCircle className="size-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {stats.late} late, {stats.absent} absent
              </p>
            </div>
            <div className="flex flex-col gap-1 sm:pl-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pending Approval
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                  {stats.pendingApproval}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <Clock className="size-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                awaiting manager action
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by employee or project…"
              className="h-8 pl-8 text-sm"
            />
          </div>

          <Select
            value={projectFilter}
            onValueChange={(value) => {
              setProjectFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {isAdmin ? 'All Projects' : 'My Projects'}
              </SelectItem>
              {visibleProjects.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.values(AttendanceStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {getAttendanceStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 w-[140px] text-xs"
          />
          <span className="text-xs text-zinc-500">to</span>
          <Input
            type="date"
            value={toDate}
            min={fromDate}
            max={format(today, 'yyyy-MM-dd')}
            onChange={(e) => {
              setToDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 w-[140px] text-xs"
          />

          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleThisMonth}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleLast30}
            >
              30d
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleLast90}
            >
              90d
            </Button>
          </div>

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
                {[10, 20, 50, 100, 200].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-zinc-500"
                  >
                    Loading team attendance…
                  </TableCell>
                </TableRow>
              ) : fetchEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Empty variant="inline">
                      <EmptyMedia variant="icon">
                        <User className="size-6" />
                      </EmptyMedia>
                      <EmptyHeader>
                        <EmptyTitle>No employees in scope</EmptyTitle>
                        <EmptyDescription>
                          {isAdmin
                            ? 'No employees exist in this organization yet.'
                            : 'You aren’t assigned to any projects with members.'}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Empty variant="inline">
                      <EmptyMedia variant="icon">
                        <AlertCircle className="size-6" />
                      </EmptyMedia>
                      <EmptyHeader>
                        <EmptyTitle>No attendance records</EmptyTitle>
                        <EmptyDescription>
                          {hasActiveFilters
                            ? 'Try adjusting your search, project, or date range.'
                            : 'No records in the selected period.'}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((record) => (
                  <TableRow
                    key={record.id}
                    className="hover:bg-accent cursor-pointer"
                    onClick={() =>
                      router.push(`/users/dashboard/attendance/${record.id}`)
                    }
                  >
                    <TableCell>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {format(record.date, 'EEE, dd MMM')}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {format(record.date, 'yyyy')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {record.employeeName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {record.projectName ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getAttendanceStatusColor(record.status)}
                      >
                        {getAttendanceStatusLabel(record.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.morningClockIn ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {format(record.morningClockIn.timestamp, 'HH:mm')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-400">{'—'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.eveningClockOut ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {format(record.eveningClockOut.timestamp, 'HH:mm')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-400">{'—'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {record.workDuration
                            ? `${record.workDuration.hours}h ${record.workDuration.minutes}m`
                            : '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20"
                              onClick={() =>
                                router.push(
                                  `/users/dashboard/attendance/${record.id}`
                                )
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {paginated.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Showing {startIndex + 1}–
              {Math.min(startIndex + itemsPerPage, filtered.length)} of{' '}
              {filtered.length}
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Standalone team stats card ───────────────────────────────────────────────
// Used by the History page to render the team stats above the tab switcher.
// Covers the current month across all employees in the user's scope.

export function TeamHistoryStatsCard() {
  const { isAdmin } = useAttendanceRole();
  const { data: currentUserEmployee } = useCurrentUserEmployee();
  const meId = currentUserEmployee?.id;

  const { data: myProjects = [] } = useProjectsByEmployee(
    isAdmin ? undefined : meId
  );
  const { data: allEmployees = [] } = useEmployees();

  const scopeEmployees = useMemo<Employee[]>(() => {
    if (isAdmin) return allEmployees;
    const seen = new Set<number>();
    const result: Employee[] = [];
    for (const p of myProjects) {
      for (const m of p.members ?? []) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          result.push(m);
        }
      }
    }
    return result;
  }, [isAdmin, allEmployees, myProjects]);

  const fetchEmployees = scopeEmployees.slice(0, MAX_PARALLEL_EMPLOYEES);

  const today = new Date();
  const fromDate = format(startOfMonth(today), 'yyyy-MM-dd');
  const toDate = format(today, 'yyyy-MM-dd');

  const queries = useQueries({
    queries: fetchEmployees.map((emp) => ({
      queryKey: attendanceKeys.byEmployee(emp.id, fromDate, toDate),
      queryFn: () => attendanceService.getByEmployee(emp.id, fromDate, toDate),
      enabled: !!emp.id && !!fromDate && !!toDate,
      staleTime: 60_000,
    })),
  });

  const records: Attendance[] = useMemo(() => {
    const flat: Attendance[] = [];
    for (const q of queries) {
      if (q.data) flat.push(...q.data);
    }
    return flat;
  }, [queries]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      present: records.filter(
        (r) =>
          r.status === AttendanceStatus.present ||
          r.status === AttendanceStatus.overtime
      ).length,
      late: records.filter((r) => r.status === AttendanceStatus.late).length,
      absent: records.filter((r) => r.status === AttendanceStatus.absent)
        .length,
      pendingApproval: records.filter((r) => r.approvalStatus === 'pending')
        .length,
    };
  }, [records]);

  return (
    <Card className="gap-0 p-6">
      <div className="sm:divide-border grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
        <div className="flex flex-col gap-1 sm:pr-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Total Records
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {stats.total}
            </p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <FileText className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {format(today, 'MMMM yyyy')}
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:px-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Present</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.present}
            </p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            including overtime
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:px-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Late / Absent
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {stats.late + stats.absent}
            </p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
              <AlertCircle className="size-4 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {stats.late} late, {stats.absent} absent
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:pl-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Pending Approval
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
              {stats.pendingApproval}
            </p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <Clock className="size-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            awaiting manager action
          </p>
        </div>
      </div>
    </Card>
  );
}
