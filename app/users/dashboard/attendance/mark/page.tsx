'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  UserCheck,
  Users,
  Clock,
  LogIn,
  LogOut,
  Activity,
  Route,
  Eye,
} from 'lucide-react';
import { OrgGuard, PageHeader } from '@/components/common';
import { Card, CardContent } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import { useAttendanceByEmployee } from '@tornotron/echno-core/attendance/hooks';
import { useAttendanceRole } from '@/hooks/attendance';
import MarkAttendanceDialog from '@/features/attendance/components/dashboard/mark-attendance-dialog';
import { MarkAttendanceForm } from '@/features/attendance/components/mark-attendance-form';
import { MovementLogForm } from '@/features/attendance/components/movement-log-form';
import {
  AttendanceClockEventsCard,
  AttendanceDailyMovementsCard,
} from '@/features/attendance/components';
import {
  AttendanceStatus,
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
} from '@tornotron/echno-core/attendance/types';
import type { Attendance } from '@tornotron/echno-core/attendance/types';

export default function MarkAttendancePage() {
  const router = useRouter();
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'self' | 'team'>('self');

  const { canMarkAttendance, isLoading: roleLoading } = useAttendanceRole();
  const { data: employee, isLoading: employeeLoading } =
    useCurrentUserEmployee();
  const employeeId = employee?.id;

  // Today's record for the current user
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: myTodayRecords = [], isLoading: recordLoading } =
    useAttendanceByEmployee(employeeId, todayStr, todayStr);
  const todayRecord = myTodayRecords[0];

  const isLoading = roleLoading || employeeLoading;

  return (
    <OrgGuard
      isLoading={isLoading}
      error={null}
      organizationId={employee?.organizationId}
    >
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Mark Attendance"
          description="Record your check-in, lunch break, and clock-out events"
          actions={
            employeeId ? (
              <>
                {todayRecord && (
                  <Button
                    variant="outline"
                    onClick={() => setMovementDialogOpen(true)}
                  >
                    <Route className="mr-2 h-4 w-4" />
                    Log Movement
                  </Button>
                )}
                <Button onClick={() => setMarkDialogOpen(true)}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  {todayRecord ? 'Mark Next Event' : 'Mark My Attendance'}
                </Button>
              </>
            ) : undefined
          }
        />

        {/* Today's status overview */}
        <Card className="gap-0 p-6">
          <div className="sm:divide-border grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
            <div className="flex flex-col gap-1 sm:pr-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Today</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {format(new Date(), 'dd MMM')}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Clock className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {format(new Date(), 'EEEE')}
              </p>
            </div>

            <div className="flex flex-col gap-1 sm:px-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Status</p>
              <div className="flex items-center justify-between">
                {recordLoading ? (
                  <p className="text-sm text-zinc-400">Loading…</p>
                ) : todayRecord ? (
                  <Badge
                    variant="outline"
                    className={getAttendanceStatusColor(todayRecord.status)}
                  >
                    {getAttendanceStatusLabel(todayRecord.status)}
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    {getAttendanceStatusLabel(AttendanceStatus.absent)}
                  </Badge>
                )}
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <Activity className="size-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                {todayRecord?.projectName ?? 'No record yet'}
              </p>
            </div>

            <div className="flex flex-col gap-1 sm:px-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Clock In
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {todayRecord?.morningClockIn
                    ? format(todayRecord.morningClockIn.timestamp, 'HH:mm')
                    : '—'}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                  <LogIn className="size-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                morning check-in
              </p>
            </div>

            <div className="flex flex-col gap-1 sm:pl-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Clock Out
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  {todayRecord?.eveningClockOut
                    ? format(todayRecord.eveningClockOut.timestamp, 'HH:mm')
                    : '—'}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                  <LogOut className="size-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                evening check-out
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs — managers/admins can switch to bulk team marking */}
        {canMarkAttendance ? (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'self' | 'team')}
          >
            <TabsList className="w-full">
              <TabsTrigger value="self" className="gap-2">
                <UserCheck className="h-4 w-4" />
                My Attendance
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2">
                <Users className="h-4 w-4" />
                Mark for Team
              </TabsTrigger>
            </TabsList>

            <TabsContent value="self" className="mt-4">
              <SelfMarkSection
                employeeId={employeeId}
                todayRecord={todayRecord}
                onOpenMark={() => setMarkDialogOpen(true)}
                onOpenMovement={() => setMovementDialogOpen(true)}
                onViewDetails={(id) =>
                  router.push(`/users/dashboard/attendance/${id}`)
                }
              />
            </TabsContent>

            <TabsContent value="team" className="mt-4">
              <MarkAttendanceForm />
            </TabsContent>
          </Tabs>
        ) : (
          <SelfMarkSection
            employeeId={employeeId}
            todayRecord={todayRecord}
            onOpenMark={() => setMarkDialogOpen(true)}
            onOpenMovement={() => setMovementDialogOpen(true)}
            onViewDetails={(id) =>
              router.push(`/users/dashboard/attendance/${id}`)
            }
          />
        )}

        {/* Personal Mark Attendance dialog (GPS + photo) — mount/unmount per
            open cycle so the dialog starts fresh each time. */}
        {employeeId && markDialogOpen && (
          <MarkAttendanceDialog
            onClose={() => setMarkDialogOpen(false)}
            employeeId={employeeId}
            todayRecord={todayRecord}
          />
        )}

        {/* Movement logging dialog */}
        {employeeId && todayRecord && (
          <MovementLogForm
            open={movementDialogOpen}
            onOpenChange={setMovementDialogOpen}
            attendanceId={todayRecord.id}
            employeeId={employeeId}
          />
        )}
      </div>
    </OrgGuard>
  );
}

// ─── Self mark section ────────────────────────────────────────────────────────

function SelfMarkSection({
  employeeId,
  todayRecord,
  onOpenMark,
  onOpenMovement,
  onViewDetails,
}: {
  employeeId: number | undefined;
  todayRecord: Attendance | undefined;
  onOpenMark: () => void;
  onOpenMovement: () => void;
  onViewDetails: (attendanceId: number) => void;
}) {
  if (!employeeId) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Your employee profile isn&apos;t set up yet. Contact your
          administrator.
        </p>
      </Card>
    );
  }

  // No record yet — show a single CTA card to start the day.
  if (!todayRecord) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30">
            <UserCheck className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Start your day
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Capture your location and photo to record your morning check-in
            </p>
          </div>
          <Button onClick={onOpenMark} size="lg" className="mt-2">
            <UserCheck className="mr-2 h-4 w-4" />
            Mark Attendance
          </Button>
        </div>
      </Card>
    );
  }

  // Already checked in — surface today's clock events + movements with
  // inline actions for the next event, logging a movement, and viewing the
  // full attendance record.
  return (
    <div className="space-y-4">
      <AttendanceClockEventsCard attendance={todayRecord} />
      <AttendanceDailyMovementsCard attendance={todayRecord} />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Next action
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Continue logging events for today, or open the full record for
              regularization and approval details.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onOpenMovement}>
              <Route className="mr-2 h-4 w-4" />
              Log Movement
            </Button>
            <Button
              variant="outline"
              onClick={() => onViewDetails(todayRecord.id)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
            <Button onClick={onOpenMark}>
              <UserCheck className="mr-2 h-4 w-4" />
              Mark Next Event
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
