'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pagination, PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
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
  UserCheck,
  UserX,
  Clock,
  Users,
  User,
  AlertCircle,
  TrendingUp,
  MapPin,
  Camera,
  CheckCircle,
  XCircle,
  Check,
  X,
  Route,
  Plus,
  Car,
  Home,
  Building,
  Package,
  Eye,
  GraduationCap,
  ClipboardCheck,
  ShoppingCart,
  MoreHorizontal,
  Briefcase,
  HandshakeIcon,
  Wrench,
  FileText,
  Search,
} from 'lucide-react';
import {
  AttendanceStatus,
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
  MovementType,
  getMovementTypeLabel,
  getMovementTypeIcon,
} from '@tornotron/echno-core/attendance/types';
import { format } from 'date-fns';
import { toast } from '@/lib/styles/toast-styles';
import {
  useAttendanceByProject,
  useApproveAttendance,
  useMarkAbsent,
} from '@tornotron/echno-core/attendance/hooks';
import { useAttendanceRole } from '@/hooks/attendance';
import { AttendanceRole } from '@tornotron/echno-core/attendance/types';
import { useLogMovement } from '@tornotron/echno-core/movement/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { EmployeeDashboard } from '@/features/attendance/components/dashboard/employee-dashboard';
import { AttendanceDashboardSwitcher } from '@/features/attendance/components/dashboard/attendance-dashboard-switcher';

const ATTENDANCE_DASHBOARD_PREFERENCE_KEY = 'attendance-dashboard-preference';

function AttendancePage() {
  const router = useRouter();
  // ── Role-based view ────────────────────────────────────────────────────────
  const { availableRoles, isLoading: roleLoading } = useAttendanceRole();
  const [currentView, setCurrentView] = useState<AttendanceRole>(() => {
    if (globalThis.window === undefined) return AttendanceRole.EMPLOYEE;
    const saved = localStorage.getItem(ATTENDANCE_DASHBOARD_PREFERENCE_KEY);
    if (
      saved &&
      Object.values(AttendanceRole).includes(saved as AttendanceRole)
    ) {
      return saved as AttendanceRole;
    }
    return AttendanceRole.EMPLOYEE;
  });

  const activeView =
    !roleLoading && !availableRoles.includes(currentView)
      ? AttendanceRole.EMPLOYEE
      : currentView;

  useEffect(() => {
    if (!roleLoading && !availableRoles.includes(currentView)) {
      localStorage.setItem(
        ATTENDANCE_DASHBOARD_PREFERENCE_KEY,
        AttendanceRole.EMPLOYEE
      );
    }
  }, [availableRoles, roleLoading, currentView]);

  const handleViewChange = (newView: AttendanceRole) => {
    setCurrentView(newView);
    localStorage.setItem(ATTENDANCE_DASHBOARD_PREFERENCE_KEY, newView);
  };
  // ── End role-based view ────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedAttendance, setSelectedAttendance] = useState<number[]>([]);

  // Movement tracking dialog state
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementAttendanceId, setMovementAttendanceId] = useState<
    number | null
  >(null);
  const [movementEmployeeId, setMovementEmployeeId] = useState<number | null>(
    null
  );

  // Manual attendance dialog state
  const [manualAttendanceDialogOpen, setManualAttendanceDialogOpen] =
    useState(false);
  const [manualAttendanceData, setManualAttendanceData] = useState({
    employeeId: '',
    date: format(selectedDate, 'yyyy-MM-dd'),
    projectId: '',
    status: AttendanceStatus.absent,
    remarks: '',
  });

  const [newMovement, setNewMovement] = useState({
    type: MovementType.siteTravel,
    fromLocation: '',
    toLocation: '',
    startTime: '',
    endTime: '',
    purpose: '',
    distanceKm: 0,
  });

  // ── Server data ──────────────────────────────────────────────────────────
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployeeLookup();
  const approveMutation = useApproveAttendance();
  const logMovementMutation = useLogMovement();
  const markAbsentMutation = useMarkAbsent();

  const apiParams =
    projectFilter === 'all'
      ? null
      : {
          projectId: Number(projectFilter),
          date: format(selectedDate, 'yyyy-MM-dd'),
          status:
            statusFilter === 'all'
              ? undefined
              : (statusFilter as AttendanceStatus),
          search: searchQuery || undefined,
          page: currentPage - 1, // backend is 0-based
          size: itemsPerPage,
        };

  const { data: pagedResult, isLoading: attendanceLoading } =
    useAttendanceByProject(apiParams);

  const paginatedAttendance = pagedResult?.content ?? [];
  const totalPages = pagedResult?.totalPages ?? 0;

  // Statistics from current page (accurate when a project is selected)
  const stats = {
    total: pagedResult?.totalElements ?? 0,
    present: paginatedAttendance.filter(
      (a) =>
        a.status === AttendanceStatus.present ||
        a.status === AttendanceStatus.overtime
    ).length,
    absent: paginatedAttendance.filter(
      (a) => a.status === AttendanceStatus.absent
    ).length,
    late: paginatedAttendance.filter((a) => a.status === AttendanceStatus.late)
      .length,
    halfDay: paginatedAttendance.filter(
      (a) => a.status === AttendanceStatus.halfDay
    ).length,
    pending: paginatedAttendance.filter(
      (a) => a.status === AttendanceStatus.pendingRegularization
    ).length,
    avgWorkHours:
      paginatedAttendance.reduce(
        (sum, a) => sum + (a.workDuration?.hours || 0),
        0
      ) / (paginatedAttendance.length || 1),
  };

  const attendanceRate =
    stats.total > 0
      ? ((stats.present + stats.late + stats.halfDay * 0.5) / stats.total) * 100
      : 0;

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedAttendance.length === paginatedAttendance.length) {
      setSelectedAttendance([]);
    } else {
      setSelectedAttendance(paginatedAttendance.map((att) => att.id));
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedAttendance.includes(id)) {
      setSelectedAttendance(selectedAttendance.filter((attId) => attId !== id));
    } else {
      setSelectedAttendance([...selectedAttendance, id]);
    }
  };

  // Approval/Rejection handlers.
  //
  // Use Promise.allSettled so one bad record doesn't abort the rest, then
  // surface granular toasts. Selection retains only the failed ids so the
  // user can retry / inspect without losing context on which records broke.
  const runBulk = async (
    ids: number[],
    approvalStatus: 'APPROVED' | 'REJECTED'
  ) => {
    const results = await Promise.allSettled(
      ids.map((id) => approveMutation.mutateAsync({ id, approvalStatus }))
    );
    const failedIds: number[] = [];
    for (const [i, r] of results.entries()) {
      if (r.status === 'rejected') failedIds.push(ids[i]);
    }
    const succeeded = ids.length - failedIds.length;
    const verb = approvalStatus === 'APPROVED' ? 'Approved' : 'Rejected';

    if (succeeded > 0 && failedIds.length === 0) {
      toast.success(`${verb} ${succeeded} record(s)`);
    } else if (succeeded > 0 && failedIds.length > 0) {
      toast.error(
        `${verb} ${succeeded} of ${ids.length} — ${failedIds.length} failed`,
        { description: `Failed ids: ${failedIds.join(', ')}` }
      );
    } else {
      toast.error(
        `Failed to ${verb.toLowerCase()} ${failedIds.length} record(s)`
      );
    }

    // Drop only successful ids from selection; failed ones stay selected so
    // the user can retry without re-picking them.
    const failedSet = new Set(failedIds);
    setSelectedAttendance((prev) => prev.filter((id) => failedSet.has(id)));
  };

  const handleApprove = (ids: number[]) => {
    void runBulk(ids, 'APPROVED');
  };

  const handleReject = (ids: number[]) => {
    void runBulk(ids, 'REJECTED');
  };

  const handleManualAttendance = () => {
    if (!manualAttendanceData.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    if (!manualAttendanceData.projectId) {
      toast.error('Please select a project');
      return;
    }
    markAbsentMutation.mutate(
      {
        employeeId: Number(manualAttendanceData.employeeId),
        projectId: Number(manualAttendanceData.projectId),
        date: manualAttendanceData.date,
      },
      {
        onSuccess: () => {
          toast.success('Attendance marked as absent');
          setManualAttendanceData({
            employeeId: '',
            date: format(selectedDate, 'yyyy-MM-dd'),
            projectId: '',
            status: AttendanceStatus.absent,
            remarks: '',
          });
          setManualAttendanceDialogOpen(false);
        },
        onError: () => toast.error('Failed to mark attendance'),
      }
    );
  };

  const isAllSelected =
    paginatedAttendance.length > 0 &&
    selectedAttendance.length === paginatedAttendance.length;
  const isSomeSelected =
    selectedAttendance.length > 0 &&
    selectedAttendance.length < paginatedAttendance.length;

  // Employee view — return early so we don't call attendance-management hooks unnecessarily
  if (activeView === AttendanceRole.EMPLOYEE) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Attendance"
          description="Your personal attendance overview"
          actions={
            <>
              <Button
                onClick={() => router.push('/users/dashboard/attendance/mark')}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Mark Attendance
              </Button>
              {availableRoles.length > 1 && (
                <AttendanceDashboardSwitcher
                  currentRole={activeView}
                  availableRoles={availableRoles}
                  onRoleChange={handleViewChange}
                />
              )}
            </>
          }
        />
        <EmployeeDashboard />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Attendance Management"
        description="Track employee attendance with geo-location and photo verification"
        actions={
          <>
            <Button
              onClick={() => router.push('/users/dashboard/attendance/mark')}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Mark Attendance
            </Button>
            <Button
              variant="outline"
              onClick={() => setManualAttendanceDialogOpen(true)}
            >
              <UserX className="mr-2 h-4 w-4" />
              Mark Absent
            </Button>
            {availableRoles.length > 1 && (
              <AttendanceDashboardSwitcher
                currentRole={activeView}
                availableRoles={availableRoles}
                onRoleChange={handleViewChange}
              />
            )}
          </>
        }
      />

      {/* Statistics */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Employees
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {stats.total}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Users className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              with records today
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Present Today
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {stats.present}
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
              Avg Work Hours
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {stats.avgWorkHours.toFixed(1)}h
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <Clock className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {stats.pending} pending approval
            </p>
          </div>
        </div>
      </Card>

      {/* Bulk Action Bar — visible only when rows are selected */}
      {selectedAttendance.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900/40 dark:bg-blue-900/20">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedAttendance.length} record(s) selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedAttendance([])}
              disabled={approveMutation.isPending}
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => handleReject(selectedAttendance)}
              disabled={approveMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Reject Selected
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleApprove(selectedAttendance)}
              disabled={approveMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve Selected
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="space-y-3 lg:hidden">
        {projectFilter !== 'all' &&
          paginatedAttendance.length > 0 &&
          paginatedAttendance.map((attendance) => (
            <Card
              key={attendance.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() =>
                (globalThis.location.href = `/users/dashboard/attendance/${attendance.id}`)
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {attendance.employeeName}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">
                        {attendance.employeeId}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={getAttendanceStatusColor(attendance.status)}
                  >
                    {getAttendanceStatusLabel(attendance.status)}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-500">Date</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(attendance.date, 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-500">
                      Work Hours
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {attendance.workDuration.hours}h{' '}
                      {attendance.workDuration.minutes}m
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-500">Check In</p>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">
                      {attendance.morningClockIn
                        ? format(attendance.morningClockIn.timestamp, 'HH:mm')
                        : '\u2014'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-500">
                      Check Out
                    </p>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">
                      {attendance.eveningClockOut
                        ? format(attendance.eveningClockOut.timestamp, 'HH:mm')
                        : '\u2014'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        {projectFilter !== 'all' && paginatedAttendance.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Desktop table */}
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
              placeholder="Search by name or employee ID…"
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
              <SelectItem value={AttendanceStatus.present}>Present</SelectItem>
              <SelectItem value={AttendanceStatus.absent}>Absent</SelectItem>
              <SelectItem value={AttendanceStatus.late}>Late</SelectItem>
              <SelectItem value={AttendanceStatus.halfDay}>Half Day</SelectItem>
              <SelectItem value={AttendanceStatus.overtime}>
                Overtime
              </SelectItem>
              <SelectItem value={AttendanceStatus.pendingRegularization}>
                Pending
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={projectFilter}
            onValueChange={(value) => {
              setProjectFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="h-8 w-[150px] text-xs"
          />

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
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className={
                      isSomeSelected ? 'data-[state=checked]:bg-primary/50' : ''
                    }
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
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
              {projectFilter === 'all' ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Empty variant="inline">
                      <EmptyMedia variant="icon">
                        <AlertCircle className="size-6" />
                      </EmptyMedia>
                      <EmptyHeader>
                        <EmptyTitle>Select a project</EmptyTitle>
                        <EmptyDescription>
                          Pick a project from the filter above to view its
                          attendance
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : attendanceLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-12 text-center text-zinc-600 dark:text-zinc-400"
                  >
                    Loading attendance…
                  </TableCell>
                </TableRow>
              ) : paginatedAttendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Empty variant="inline">
                      <EmptyMedia variant="icon">
                        <AlertCircle className="size-6" />
                      </EmptyMedia>
                      <EmptyHeader>
                        <EmptyTitle>No attendance records</EmptyTitle>
                        <EmptyDescription>
                          Try changing the date or clearing filters
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAttendance.map((attendance) => (
                  <TableRow
                    key={attendance.id}
                    className="hover:bg-accent cursor-pointer"
                    onClick={(e) => {
                      // Don't navigate if clicking on checkbox or action buttons
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || target.closest('a')) {
                        return;
                      }
                      globalThis.location.href = `/users/dashboard/attendance/${attendance.id}`;
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedAttendance.includes(attendance.id)}
                        onCheckedChange={() => handleSelectOne(attendance.id)}
                        aria-label={`Select ${attendance.employeeName}`}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="group flex items-center space-x-3 text-left"
                        onClick={() =>
                          router.push(
                            `/users/dashboard/attendance/history?tab=team&search=${encodeURIComponent(attendance.employeeName)}`
                          )
                        }
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 group-hover:text-blue-600 group-hover:underline dark:text-zinc-100 dark:group-hover:text-blue-400">
                            {attendance.employeeName}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-500">
                            {attendance.employeeId}
                          </p>
                        </div>
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {attendance.projectName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getAttendanceStatusColor(attendance.status)}
                      >
                        {getAttendanceStatusLabel(attendance.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {attendance.morningClockIn ? (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {format(
                              attendance.morningClockIn.timestamp,
                              'HH:mm'
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {attendance.eveningClockOut ? (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {format(
                              attendance.eveningClockOut.timestamp,
                              'HH:mm'
                            )}
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
                          {attendance.workDuration.hours}h{' '}
                          {attendance.workDuration.minutes}m
                        </span>
                      </div>
                      {attendance.isOvertime && (
                        <span className="text-xs text-teal-600 dark:text-teal-400">
                          +
                          {Math.floor(
                            attendance.workDuration.overtimeMinutes / 60
                          )}
                          h OT
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {attendance.morningClockIn?.isWithinGeofence ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : attendance.morningClockIn ? (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        ) : null}
                        {attendance.morningClockIn && (
                          <>
                            <MapPin className="h-4 w-4 text-zinc-400" />
                            <Camera className="h-4 w-4 text-zinc-400" />
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <TooltipProvider>
                          {attendance.approvalStatus === 'pending' && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
                                    onClick={() =>
                                      handleApprove([attendance.id])
                                    }
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Approve Attendance</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                                    onClick={() =>
                                      handleReject([attendance.id])
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reject Attendance</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMovementAttendanceId(attendance.id);
                                  setMovementEmployeeId(attendance.employeeId);
                                  setMovementDialogOpen(true);
                                }}
                                className="relative h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20"
                              >
                                <Route className="h-4 w-4" />
                                {attendance.movements &&
                                  attendance.movements.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                                      {attendance.movements.length}
                                    </span>
                                  )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                View Movements{' '}
                                {attendance.movements &&
                                  attendance.movements.length > 0 &&
                                  `(${attendance.movements.length})`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {paginatedAttendance.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, stats.total)} of{' '}
              {stats.total}
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Movement Tracking Dialog */}
      <Dialog
        open={movementDialogOpen}
        onOpenChange={(open) => {
          setMovementDialogOpen(open);
          if (!open) {
            setMovementAttendanceId(null);
            setMovementEmployeeId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Route className="h-5 w-5 text-blue-600" />
              <span>Track Employee Movement</span>
            </DialogTitle>
            <DialogDescription>
              Record and manage employee movements during work hours
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Movement Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="movementType">Movement Type *</Label>
                <Select
                  value={newMovement.type}
                  onValueChange={(value) =>
                    setNewMovement({
                      ...newMovement,
                      type: value as MovementType,
                    })
                  }
                >
                  <SelectTrigger id="movementType">
                    <SelectValue placeholder="Select movement type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MovementType).map((type) => {
                      const iconName = getMovementTypeIcon(type);
                      const iconMap: Record<string, typeof Car> = {
                        Car,
                        Users,
                        Package,
                        Home,
                        MapPin,
                        GraduationCap,
                        Building,
                        ClipboardCheck,
                        ShoppingCart,
                        Eye,
                        MoreHorizontal,
                        Briefcase,
                        HandshakeIcon,
                        Wrench,
                        FileText,
                      };
                      const Icon = iconMap[iconName] || Route;

                      return (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span>{getMovementTypeLabel(type)}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="fromLocation">From Location *</Label>
                <Input
                  id="fromLocation"
                  placeholder="e.g., Main Office"
                  value={newMovement.fromLocation}
                  onChange={(e) =>
                    setNewMovement({
                      ...newMovement,
                      fromLocation: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="toLocation">To Location *</Label>
                <Input
                  id="toLocation"
                  placeholder="e.g., Site A, Client Office"
                  value={newMovement.toLocation}
                  onChange={(e) =>
                    setNewMovement({
                      ...newMovement,
                      toLocation: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Time Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newMovement.startTime}
                  onChange={(e) =>
                    setNewMovement({
                      ...newMovement,
                      startTime: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newMovement.endTime}
                  onChange={(e) =>
                    setNewMovement({
                      ...newMovement,
                      endTime: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  placeholder="0"
                  value={newMovement.distanceKm || ''}
                  onChange={(e) =>
                    setNewMovement({
                      ...newMovement,
                      distanceKm: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <Label htmlFor="purpose">Purpose / Notes *</Label>
              <Textarea
                id="purpose"
                placeholder="Describe the purpose of this movement..."
                rows={3}
                value={newMovement.purpose}
                onChange={(e) =>
                  setNewMovement({ ...newMovement, purpose: e.target.value })
                }
              />
            </div>

            {/* Quick Info */}
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex items-start space-x-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="mb-1 font-medium">Movement Tracking Features</p>
                  <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                    <li>• GPS coordinates will be automatically captured</li>
                    <li>
                      • Photo verification can be added for start/end points
                    </li>
                    <li>• Movements can be verified by supervisors</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMovementDialogOpen(false);
                setNewMovement({
                  type: MovementType.siteTravel,
                  fromLocation: '',
                  toLocation: '',
                  startTime: '',
                  endTime: '',
                  purpose: '',
                  distanceKm: 0,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!movementAttendanceId || !movementEmployeeId) return;
                const datePrefix = format(selectedDate, 'yyyy-MM-dd');
                logMovementMutation.mutate(
                  {
                    req: {
                      attendanceId: movementAttendanceId,
                      movementType: newMovement.type,
                      fromLocation: newMovement.fromLocation,
                      toLocation: newMovement.toLocation || undefined,
                      startTime: new Date(
                        `${datePrefix}T${newMovement.startTime}`
                      ),
                      endTime: newMovement.endTime
                        ? new Date(`${datePrefix}T${newMovement.endTime}`)
                        : undefined,
                      purpose: newMovement.purpose,
                      distanceKm: newMovement.distanceKm || undefined,
                    },
                    employeeId: movementEmployeeId,
                  },
                  {
                    onSuccess: () => {
                      toast.success('Movement Recorded', {
                        description: `${getMovementTypeLabel(newMovement.type)} movement has been recorded successfully.`,
                      });
                      setMovementDialogOpen(false);
                      setNewMovement({
                        type: MovementType.siteTravel,
                        fromLocation: '',
                        toLocation: '',
                        startTime: '',
                        endTime: '',
                        purpose: '',
                        distanceKm: 0,
                      });
                    },
                    onError: () => toast.error('Failed to record movement'),
                  }
                );
              }}
              disabled={
                !newMovement.fromLocation ||
                !newMovement.startTime ||
                !newMovement.purpose ||
                logMovementMutation.isPending
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Movement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Attendance Dialog */}
      <Dialog
        open={manualAttendanceDialogOpen}
        onOpenChange={setManualAttendanceDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mark Absent</DialogTitle>
            <DialogDescription>
              Mark an employee as absent for a specific date and project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee *</Label>
              <Select
                value={manualAttendanceData.employeeId}
                onValueChange={(value) =>
                  setManualAttendanceData((prev) => ({
                    ...prev,
                    employeeId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem
                      key={employee.employeeId}
                      value={employee.employeeId}
                    >
                      {employee.name} ({employee.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Project */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={manualAttendanceData.date}
                  onChange={(e) =>
                    setManualAttendanceData((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectId">Project *</Label>
                <Select
                  value={manualAttendanceData.projectId}
                  onValueChange={(value) =>
                    setManualAttendanceData((prev) => ({
                      ...prev,
                      projectId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem
                        key={project.id}
                        value={project.id.toString()}
                      >
                        {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManualAttendanceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleManualAttendance}
              disabled={markAbsentMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark Absent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AttendancePage;
