'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Pagination, PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  UserCheck,
  Clock,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  XCircle,
  MapPin,
  Eye,
  Search,
} from 'lucide-react';
import {
  useAttendanceByEmployee,
  useAttendanceSummary,
} from '@tornotron/echno-core/attendance/hooks';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import {
  AttendanceStatus,
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
} from '@tornotron/echno-core/attendance/types';
import { format, startOfMonth, subDays } from 'date-fns';

// ─── Attendance History ───────────────────────────────────────────────────────

interface AttendanceHistoryProps {
  /** When provided, shows that employee's history (manager view). Defaults to current user. */
  employeeId?: number;
  /** Page title. Defaults to "Attendance History". */
  title?: string;
  /** Page subtitle. */
  description?: string;
  /** Extra header content rendered next to the title (e.g. back button). */
  headerSlot?: ReactNode;
  /** Hide the internal PageHeader (useful when this component is embedded under
   *  a tabbed shell that already renders its own header). */
  hideHeader?: boolean;
  /** Hide the internal stats card (useful when stats are rendered at a higher
   *  level so they sit above a tab switcher). */
  hideStats?: boolean;
}

export function AttendanceHistory({
  employeeId: employeeIdProp,
  title = 'Attendance History',
  description = 'View and filter your attendance records',
  headerSlot,
  hideHeader = false,
  hideStats = false,
}: AttendanceHistoryProps = {}) {
  const router = useRouter();
  const { data: currentUserEmployee } = useCurrentUserEmployee();
  const employeeId = employeeIdProp ?? currentUserEmployee?.id;

  const today = new Date();
  const [fromDate, setFromDate] = useState(
    format(startOfMonth(today), 'yyyy-MM-dd')
  );
  const [toDate, setToDate] = useState(format(today, 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const hasActiveFilters = statusFilter !== 'all' || searchQuery !== '';

  // Derive month/year from the fromDate for summary
  const fromDateObj = new Date(fromDate);

  const { data: records = [], isLoading } = useAttendanceByEmployee(
    employeeId,
    fromDate,
    toDate
  );

  const { data: summary } = useAttendanceSummary(
    employeeId,
    fromDateObj.getMonth() + 1,
    fromDateObj.getFullYear()
  );

  // Filter & search
  const filtered = useMemo(() => {
    let result = records;
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.projectName?.toLowerCase().includes(q) ||
          format(r.date, 'EEE, MMM dd').toLowerCase().includes(q)
      );
    }
    return result;
  }, [records, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Quick range helpers
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

  // Stats
  const stats = {
    total: filtered.length,
    present: filtered.filter(
      (a) =>
        a.status === AttendanceStatus.present ||
        a.status === AttendanceStatus.overtime
    ).length,
    absent: filtered.filter((a) => a.status === AttendanceStatus.absent).length,
    late: filtered.filter((a) => a.status === AttendanceStatus.late).length,
    avgWorkHours:
      filtered.reduce((sum, a) => sum + (a.workDuration?.hours || 0), 0) /
      (filtered.length || 1),
  };

  const attendanceRate =
    stats.total > 0 ? ((stats.present + stats.late) / stats.total) * 100 : 0;

  const presentDays = summary?.presentDays ?? stats.present;
  const lateDays = summary?.lateDays ?? stats.late;
  const absentDays = summary?.absentDays ?? stats.absent;
  const avgHours = summary
    ? summary.averageWorkHours.toFixed(1)
    : stats.avgWorkHours.toFixed(1);
  const attendancePct = summary
    ? summary.attendancePercentage.toFixed(1)
    : attendanceRate.toFixed(1);
  const totalDays = summary?.totalWorkingDays ?? stats.total;

  return (
    <div className="space-y-4 sm:space-y-6">
      {!hideHeader && (
        <PageHeader
          title={title}
          description={description}
          actions={headerSlot}
        />
      )}

      {/* Statistics */}
      {!hideStats && (
        <Card className="gap-0 p-6">
          <div className="sm:divide-border grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
            <div className="flex flex-col gap-1 sm:pr-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Present Days
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {presentDays}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                  <UserCheck className="size-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {attendanceRate.toFixed(1)}% attendance rate
              </p>
            </div>
            <div className="flex flex-col gap-1 sm:px-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Late / Absent
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {lateDays + absentDays}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                  <AlertCircle className="size-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {lateDays} late, {absentDays} absent
              </p>
            </div>
            <div className="flex flex-col gap-1 sm:px-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Avg Work Hours
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                  {avgHours}h
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <Clock className="size-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                per working day
              </p>
            </div>
            <div className="flex flex-col gap-1 sm:pl-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Attendance %
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {attendancePct}%
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {totalDays} working days
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Mobile Card View */}
      <div className="space-y-3 lg:hidden">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                Loading attendance…
              </p>
            </CardContent>
          </Card>
        ) : paginated.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <p className="text-zinc-600 dark:text-zinc-400">
                No attendance records found
              </p>
            </CardContent>
          </Card>
        ) : (
          paginated.map((record) => (
            <Card
              key={record.id}
              className="hover:bg-accent cursor-pointer transition-colors"
              onClick={() =>
                router.push(`/users/dashboard/attendance/${record.id}`)
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(record.date, 'EEE, dd MMM yyyy')}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">
                      {record.projectName ?? '—'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={getAttendanceStatusColor(record.status)}
                  >
                    {getAttendanceStatusLabel(record.status)}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-500">Check In</p>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">
                      {record.morningClockIn
                        ? format(record.morningClockIn.timestamp, 'HH:mm')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-500">
                      Check Out
                    </p>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">
                      {record.eveningClockOut
                        ? format(record.eveningClockOut.timestamp, 'HH:mm')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-500">
                      Work Hours
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {record.workDuration
                        ? `${record.workDuration.hours}h ${record.workDuration.minutes}m`
                        : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {paginated.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by project name…"
              className="h-8 pl-8 text-sm"
            />
          </div>

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
                {[5, 10, 20, 50, 100].map((n) => (
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
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-zinc-600 dark:text-zinc-400"
                  >
                    Loading attendance…
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
                            ? 'Try adjusting your search or filters'
                            : 'No records in the selected date range'}
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
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {format(record.date, 'EEE, dd MMM')}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {format(record.date, 'yyyy')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-zinc-700 dark:text-zinc-300">
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
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {format(record.morningClockIn.timestamp, 'HH:mm')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.eveningClockOut ? (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {format(record.eveningClockOut.timestamp, 'HH:mm')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {record.workDuration
                            ? `${record.workDuration.hours}h ${record.workDuration.minutes}m`
                            : '—'}
                        </span>
                      </div>
                      {record.isOvertime && (
                        <span className="text-xs text-teal-600 dark:text-teal-400">
                          +
                          {Math.floor(
                            (record.workDuration?.overtimeMinutes ?? 0) / 60
                          )}
                          h OT
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {record.morningClockIn?.isWithinGeofence ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : record.morningClockIn ? (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        ) : null}
                        {record.morningClockIn && (
                          <MapPin className="h-4 w-4 text-zinc-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/users/dashboard/attendance/${record.id}`
                                );
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
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
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, filtered.length)} of{' '}
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

// ─── Standalone stats card ────────────────────────────────────────────────────
// Used by the History page to render the personal stats above the tab switcher,
// independent of any in-table filter state. Uses the current month's summary.

export function MyHistoryStatsCard() {
  const { data: employee } = useCurrentUserEmployee();
  const employeeId = employee?.id;
  const today = new Date();
  const { data: summary } = useAttendanceSummary(
    employeeId,
    today.getMonth() + 1,
    today.getFullYear()
  );

  const presentDays = summary?.presentDays ?? 0;
  const lateDays = summary?.lateDays ?? 0;
  const absentDays = summary?.absentDays ?? 0;
  const avgHours = summary ? summary.averageWorkHours.toFixed(1) : '0.0';
  const attendancePct = summary
    ? summary.attendancePercentage.toFixed(1)
    : '0.0';
  const totalDays = summary?.totalWorkingDays ?? 0;

  return (
    <Card className="gap-0 p-6">
      <div className="sm:divide-border grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
        <div className="flex flex-col gap-1 sm:pr-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Present Days
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {presentDays}
            </p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
              <UserCheck className="size-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {format(today, 'MMMM yyyy')}
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:px-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Late / Absent
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {lateDays + absentDays}
            </p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
              <AlertCircle className="size-4 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {lateDays} late, {absentDays} absent
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:px-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Avg Work Hours
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
              {avgHours}h
            </p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <Clock className="size-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            per working day
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:pl-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Attendance %
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {attendancePct}%
            </p>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {totalDays} working days
          </p>
        </div>
      </div>
    </Card>
  );
}
