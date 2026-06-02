'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MarkAttendanceDialog } from './mark-attendance-dialog';
import { MovementLogForm } from '../movement-log-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Separator } from '@/components/shadcn/separator';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Route,
} from 'lucide-react';
import {
  useAttendanceByEmployee,
  useAttendanceSummary,
} from '@/hooks/attendance';
import { useCurrentUserEmployee } from '@/hooks/employee';
import {
  AttendanceStatus,
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
} from '@/types/attendance/attendance-status';
import { format, subDays } from 'date-fns';

// ─── Status badge helper ──────────────────────────────────────────────────────

function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const config: Record<
    AttendanceStatus,
    {
      label: string;
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
      className?: string;
    }
  > = {
    [AttendanceStatus.present]: {
      label: 'Present',
      variant: 'default',
      className: 'bg-green-500 hover:bg-green-600',
    },
    [AttendanceStatus.absent]: { label: 'Absent', variant: 'destructive' },
    [AttendanceStatus.late]: {
      label: 'Late',
      variant: 'secondary',
      className: 'bg-yellow-500 text-white hover:bg-yellow-600',
    },
    [AttendanceStatus.halfDay]: { label: 'Half Day', variant: 'secondary' },
    [AttendanceStatus.leave]: { label: 'On Leave', variant: 'outline' },
    [AttendanceStatus.weeklyOff]: { label: 'Weekly Off', variant: 'outline' },
    [AttendanceStatus.holiday]: { label: 'Holiday', variant: 'outline' },
    [AttendanceStatus.overtime]: {
      label: 'Overtime',
      variant: 'default',
      className: 'bg-blue-500 hover:bg-blue-600',
    },
    [AttendanceStatus.earlyCheckout]: {
      label: 'Early Checkout',
      variant: 'secondary',
    },
    [AttendanceStatus.pendingRegularization]: {
      label: 'Pending',
      variant: 'secondary',
      className: 'bg-orange-500 text-white hover:bg-orange-600',
    },
  };

  const c = config[status] ?? { label: status, variant: 'outline' as const };
  return (
    <Badge variant={c.variant} className={c.className}>
      {c.label}
    </Badge>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function EmployeeDashboard() {
  const router = useRouter();
  const { data: employee } = useCurrentUserEmployee();
  const employeeId = employee?.id;

  const today = new Date();
  const [month] = useState(today.getMonth() + 1); // 1-based
  const [year] = useState(today.getFullYear());
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);

  // Monthly summary
  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary(
    employeeId,
    month,
    year
  );

  // Recent 14-day records (includes today)
  const todayStr = format(today, 'yyyy-MM-dd');
  const fourteenDaysAgoStr = format(subDays(today, 13), 'yyyy-MM-dd');
  const { data: recentRecords = [], isLoading: recordsLoading } =
    useAttendanceByEmployee(employeeId, fourteenDaysAgoStr, todayStr);

  const isLoading = summaryLoading || recordsLoading;

  const todayRecord = recentRecords.find(
    (r) => format(r.date, 'yyyy-MM-dd') === todayStr
  );

  // Sort recent records newest-first (exclude today — shown separately above)
  const pastRecords = recentRecords
    .filter((r) => format(r.date, 'yyyy-MM-dd') !== todayStr)
    .toSorted((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      {/* Mark Attendance dialog */}
      {employeeId && (
        <MarkAttendanceDialog
          open={markDialogOpen}
          onClose={() => setMarkDialogOpen(false)}
          employeeId={employeeId}
          todayRecord={todayRecord}
        />
      )}

      {/* Log Movement dialog */}
      {employeeId && todayRecord && (
        <MovementLogForm
          open={movementDialogOpen}
          onOpenChange={setMovementDialogOpen}
          attendanceId={todayRecord.id}
          employeeId={employeeId}
        />
      )}

      {/* Stats overview */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Present Days
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {summary?.presentDays ?? '—'}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              this month ({format(today, 'MMMM')})
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Absent Days
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                {summary?.absentDays ?? '—'}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                <XCircle className="size-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              this month
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Late Arrivals
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {summary?.lateDays ?? '—'}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <AlertCircle className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              this month
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Avg Work Hours
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {summary ? `${summary.averageWorkHours.toFixed(1)}h` : '—'}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              per working day
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Today's status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today — {format(today, 'EEEE, MMMM dd')}</CardTitle>
                <CardDescription>Your attendance for today</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  router.push('/users/dashboard/attendance/history')
                }
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ) : todayRecord ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <AttendanceStatusBadge status={todayRecord.status} />
                    <span className="text-muted-foreground text-sm">
                      {todayRecord.projectName}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Clock In</p>
                      <p className="font-medium">
                        {todayRecord.morningClockIn
                          ? format(
                              todayRecord.morningClockIn.timestamp,
                              'HH:mm'
                            )
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Clock Out</p>
                      <p className="font-medium">
                        {todayRecord.eveningClockOut
                          ? format(
                              todayRecord.eveningClockOut.timestamp,
                              'HH:mm'
                            )
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Work Hours
                      </p>
                      <p className="font-medium">
                        {todayRecord.workDuration
                          ? `${todayRecord.workDuration.hours}h ${todayRecord.workDuration.minutes}m`
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setMarkDialogOpen(true)} size="sm">
                      <UserCheck className="mr-2 h-4 w-4" />
                      Mark Attendance
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMovementDialogOpen(true)}
                    >
                      <Route className="mr-2 h-4 w-4" />
                      Log Movement
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/users/dashboard/attendance/${todayRecord.id}`
                        )
                      }
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Clock className="text-muted-foreground mb-3 h-10 w-10" />
                  <p className="text-muted-foreground mb-4 text-sm">
                    No attendance record for today
                  </p>
                  <Button onClick={() => setMarkDialogOpen(true)}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Mark Attendance
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Records */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Last 14 Days</CardTitle>
                <CardDescription>
                  Your recent attendance records
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  router.push('/users/dashboard/attendance/history')
                }
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recordsLoading ? (
                <div className="space-y-2 px-6 pb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : pastRecords.length === 0 ? (
                <p className="text-muted-foreground px-6 pb-4 text-sm">
                  No records in the last 14 days.
                </p>
              ) : (
                <div className="divide-y">
                  {pastRecords.map((record) => (
                    <div
                      key={record.id}
                      className="hover:bg-muted/50 flex cursor-pointer items-center justify-between px-6 py-3"
                      onClick={() =>
                        router.push(`/users/dashboard/attendance/${record.id}`)
                      }
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {format(record.date, 'EEE, dd MMM')}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {record.projectName ?? '—'}
                          {record.morningClockIn &&
                            ` · ${format(record.morningClockIn.timestamp, 'HH:mm')}`}
                          {record.eveningClockOut &&
                            ` – ${format(record.eveningClockOut.timestamp, 'HH:mm')}`}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={getAttendanceStatusColor(record.status)}
                      >
                        {getAttendanceStatusLabel(record.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Monthly summary */}
          <Card>
            <CardHeader>
              <CardTitle>{format(today, 'MMMM yyyy')} Summary</CardTitle>
              <CardDescription>Your monthly attendance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {summaryLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="mb-1 h-4 w-full" />
                      {i < 4 && <Skeleton className="h-px w-full" />}
                    </div>
                  ))}
                </div>
              ) : summary ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Working Days
                    </span>
                    <span className="font-bold">
                      {summary.totalWorkingDays}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Present
                    </span>
                    <span className="font-bold text-green-600">
                      {summary.presentDays}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Absent
                    </span>
                    <span className="font-bold text-red-600">
                      {summary.absentDays}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Half Days
                    </span>
                    <span className="font-semibold text-yellow-600">
                      {summary.halfDays}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Attendance %
                    </span>
                    <span className="font-bold text-blue-600">
                      {summary.attendancePercentage.toFixed(1)}%
                    </span>
                  </div>
                  {summary.totalOvertimeHours > 0 && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Overtime
                        </span>
                        <span className="font-semibold text-purple-600">
                          {summary.totalOvertimeHours.toFixed(1)}h
                        </span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center text-sm">
                  No summary available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Project-wise breakdown */}
          {summary && (summary.projectWiseAttendance?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>By Project</CardTitle>
                <CardDescription>Attendance per project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.projectWiseAttendance!.map((p) => (
                  <div key={p.projectId}>
                    <div className="flex items-center justify-between">
                      <span className="max-w-40 truncate text-sm font-medium">
                        {p.projectName}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {p.daysWorked}d
                      </span>
                    </div>
                    <div className="bg-muted mt-1 h-1.5 w-full rounded-full">
                      <div
                        className="h-1.5 rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min(p.attendancePercentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
