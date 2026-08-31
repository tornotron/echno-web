'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
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
import { Checkbox } from '@/components/shadcn/checkbox';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { AlertTriangle, UserCheck, UserX, Users } from 'lucide-react';
import { todayForDateInput } from '@/lib/utils/date-utils';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { toast } from '@/lib/styles/toast-styles';
import {
  useEmployeesByProject,
  useProjects,
} from '@tornotron/echno-core/project/hooks';
import {
  useOrgSettings,
  useProjectSettings,
} from '@tornotron/echno-core/attendance-settings/hooks';
import { useShifts } from '@tornotron/echno-core/shift-timing/hooks';
import {
  useAttendanceByProject,
  useCheckIn,
  useRecordClockEvent,
} from '@tornotron/echno-core/attendance/hooks';
import { ClockEventType } from '@tornotron/echno-core/attendance/types';
import { format } from 'date-fns';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  buildEventTimestamp,
  canClockIn,
  canClockOut,
  describeCaptureBlock,
  isSelectableState,
  resolveTeamMemberState,
  summarizeBulkOutcome,
  teamMemberStateLabel,
  type BulkAttempt,
  type TeamMemberState,
} from '../lib/team-marking';

export function MarkAttendanceForm() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    todayForDateInput()
  );
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(
    new Set()
  );
  const [clockInTime, setClockInTime] = useState<string>('09:00');
  const [clockOutTime, setClockOutTime] = useState<string>('18:00');
  const [remarks, setRemarks] = useState<string>('');

  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  // All members assigned to the selected project — drives the table rows so
  // managers can mark attendance for any team member, not only those with an
  // existing record.
  const { data: members = [], isLoading: membersLoading } =
    useEmployeesByProject(
      selectedProject ? Number(selectedProject) : undefined
    );

  // Today's attendance records for the same project — used to look up each
  // member's current clock status.
  const { data: pagedResult, isLoading: attendanceLoading } =
    useAttendanceByProject(
      selectedProject
        ? {
            projectId: Number(selectedProject),
            date: selectedDate,
            size: 200,
          }
        : null
    );

  // Resolve the shift timing for this project: project-scoped settings →
  // org default → first available shift. We refuse to dispatch a check-in
  // until we have a real id rather than fall back to a hardcoded number that
  // may not exist in this org.
  const { data: projectSettings } = useProjectSettings(
    selectedProject ? Number(selectedProject) : undefined
  );
  const { data: orgSettings } = useOrgSettings();
  const { data: shifts = [] } = useShifts();
  const resolvedShiftTimingId =
    projectSettings?.defaultShiftId ??
    orgSettings?.defaultShiftId ??
    shifts[0]?.id;

  const checkInMutation = useCheckIn();
  const clockEventMutation = useRecordClockEvent();

  const loading =
    projectsLoading ||
    membersLoading ||
    attendanceLoading ||
    checkInMutation.isPending ||
    clockEventMutation.isPending;

  // Map attendance records by employeeId for status lookup.
  const attendanceByEmployee = useMemo(
    () => new Map((pagedResult?.content ?? []).map((a) => [a.employeeId, a])),
    [pagedResult]
  );

  const stateOf = (employeeId: number): TeamMemberState =>
    resolveTeamMemberState(attendanceByEmployee.get(employeeId));

  const nameOf = (employeeId: number): string =>
    members.find((m) => m.id === employeeId)?.name ?? `#${employeeId}`;

  // Rows a supervisor can still act on. A completed day and a leave day are
  // terminal, so they are shown but locked.
  const selectableMembers = members.filter((m) => isSelectableState(stateOf(m.id)));

  // Split the ticked rows by the action each one is actually eligible for, so
  // each button counts what it will really submit rather than the raw tick
  // count.
  const clockInTargets = [...selectedEmployees].filter((id) =>
    canClockIn(stateOf(id))
  );
  const clockOutTargets = [...selectedEmployees].filter((id) =>
    canClockOut(stateOf(id))
  );

  // The team screen marks attendance on other people's behalf from a desk, so
  // it can supply neither a selfie nor coordinates. When the project demands
  // either, every request would 400; say so before anything is submitted.
  const effectiveSettings = projectSettings ?? orgSettings;
  const captureBlock = describeCaptureBlock(effectiveSettings);

  const handleSelectAll = (checked: boolean) => {
    setSelectedEmployees(
      checked ? new Set(selectableMembers.map((m) => m.id)) : new Set()
    );
  };

  const handleSelectEmployee = (employeeId: number, checked: boolean) => {
    const newSelected = new Set(selectedEmployees);
    if (checked) {
      newSelected.add(employeeId);
    } else {
      newSelected.delete(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  /**
   * Runs one attempt per employee and reports what actually happened.
   *
   * Every attempt is settled independently so one rejection does not hide the
   * rest, and the outcome distinguishes a clean run from a partial one and from
   * a run in which nothing succeeded.
   */
  const runBulkAction = async (
    action: string,
    targets: number[],
    attempt: (employeeId: number) => Promise<unknown>
  ) => {
    const results = await Promise.allSettled(
      targets.map((employeeId) => attempt(employeeId))
    );
    const attempts: BulkAttempt[] = results.map((result, index) => ({
      employeeId: targets[index],
      name: nameOf(targets[index]),
      ok: result.status === 'fulfilled',
      reason:
        result.status === 'rejected'
          ? getErrorMessage(result.reason)
          : undefined,
    }));

    const outcome = summarizeBulkOutcome(action, attempts);
    if (outcome.level === 'success') {
      toast.success(outcome.title);
    } else if (outcome.level === 'partial') {
      toast.warning(outcome.title, { description: outcome.description });
    } else {
      toast.error(outcome.title, { description: outcome.description });
    }

    // Keep whoever failed ticked so the operator can retry them once the
    // blocking condition is dealt with.
    setSelectedEmployees(
      new Set(attempts.filter((a) => !a.ok).map((a) => a.employeeId))
    );
    if (outcome.level === 'success') setRemarks('');
  };

  const handleMarkClockIn = async () => {
    if (clockInTargets.length === 0) {
      toast.error('Select at least one employee who has not clocked in yet');
      return;
    }
    if (captureBlock) {
      toast.error('Bulk marking is not allowed for this project', {
        description: captureBlock,
      });
      return;
    }
    if (!resolvedShiftTimingId) {
      toast.error(
        'No shift timing configured. Set a default shift in attendance settings or create one in Shift Timings.'
      );
      return;
    }

    const eventTimestamp = buildEventTimestamp(selectedDate, clockInTime);
    if (!eventTimestamp) {
      toast.error('Enter a valid clock-in date and time');
      return;
    }

    await runBulkAction('Clock-in', clockInTargets, (empId) => {
      const existing = attendanceByEmployee.get(empId);
      if (existing) {
        // A record exists for the day but carries no clock-in yet, so the event
        // is appended to it rather than creating a second record.
        return clockEventMutation.mutateAsync({
          attendanceId: existing.id,
          eventType: ClockEventType.morningClockIn,
          eventTimestamp,
          remarks,
        });
      }
      return checkInMutation.mutateAsync({
        employeeId: empId,
        projectId: Number(selectedProject),
        shiftTimingId: resolvedShiftTimingId,
        eventTimestamp,
        remarks,
      });
    });
  };

  const handleMarkClockOut = async () => {
    if (clockOutTargets.length === 0) {
      toast.error(
        'Select at least one employee who is clocked in and not yet clocked out'
      );
      return;
    }
    if (captureBlock) {
      toast.error('Bulk marking is not allowed for this project', {
        description: captureBlock,
      });
      return;
    }

    const eventTimestamp = buildEventTimestamp(selectedDate, clockOutTime);
    if (!eventTimestamp) {
      toast.error('Enter a valid clock-out date and time');
      return;
    }

    // A clock-out before the recorded clock-in would produce a negative work
    // duration, so it is refused here rather than written and corrected later.
    const tooEarly = clockOutTargets.filter((empId) => {
      const clockIn = attendanceByEmployee.get(empId)?.morningClockIn?.timestamp;
      return clockIn !== undefined && eventTimestamp <= clockIn;
    });
    if (tooEarly.length > 0) {
      toast.error('Clock-out time is not after the recorded clock-in', {
        description: `Affects ${tooEarly.map((id) => nameOf(id)).join(', ')}.`,
      });
      return;
    }

    await runBulkAction('Clock-out', clockOutTargets, (empId) =>
      clockEventMutation.mutateAsync({
        attendanceId: attendanceByEmployee.get(empId)!.id,
        eventType: ClockEventType.eveningClockOut,
        eventTimestamp,
        remarks,
      })
    );
  };

  const getStatusBadge = (state: TeamMemberState) => {
    const label = teamMemberStateLabel(state);
    switch (state) {
      case 'clockedOut': {
        return <Badge className="bg-green-500">{label}</Badge>;
      }
      case 'clockedIn': {
        return <Badge className="bg-blue-500">{label}</Badge>;
      }
      case 'onLeave': {
        return <Badge className="bg-amber-500">{label}</Badge>;
      }
      default: {
        return <Badge variant="secondary">{label}</Badge>;
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Employees</CardTitle>
          <CardDescription>
            Select project and date to view employees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
                disabled={loading}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project members table */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle>Project Members</CardTitle>
            <CardDescription>
              Select team members to mark attendance for{' '}
              {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectableMembers.length > 0 &&
                          selectableMembers.every((m) =>
                            selectedEmployees.has(m.id)
                          )
                        }
                        onCheckedChange={handleSelectAll}
                        disabled={loading || selectableMembers.length === 0}
                        aria-label="Select all employees who can still be marked"
                      />
                    </TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-12 text-center text-zinc-500"
                      >
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Empty variant="inline">
                          <EmptyMedia variant="icon">
                            <Users className="size-6" />
                          </EmptyMedia>
                          <EmptyHeader>
                            <EmptyTitle>No members in this project</EmptyTitle>
                            <EmptyDescription>
                              Assign employees to the project to mark their
                              attendance from here.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => {
                      const record = attendanceByEmployee.get(member.id);
                      const state = resolveTeamMemberState(record);
                      const selectable = isSelectableState(state);
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <Checkbox
                              checked={
                                selectable && selectedEmployees.has(member.id)
                              }
                              onCheckedChange={(checked) =>
                                handleSelectEmployee(
                                  member.id,
                                  checked as boolean
                                )
                              }
                              disabled={loading || !selectable}
                              aria-label={`Select ${member.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {member.employeeId}
                          </TableCell>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {member.designation || '—'}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(state)}</TableCell>
                          <TableCell>
                            {record?.morningClockIn
                              ? format(record.morningClockIn.timestamp, 'HH:mm')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {record?.eveningClockOut
                              ? format(
                                  record.eveningClockOut.timestamp,
                                  'HH:mm'
                                )
                              : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Actions */}
      {selectedProject && members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
            <CardDescription>
              Set clock-in/clock-out times and mark attendance for selected
              employees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {captureBlock && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Bulk marking is blocked for this project</AlertTitle>
                <AlertDescription>{captureBlock}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clockInTime">Clock-In Time</Label>
                <Input
                  id="clockInTime"
                  type="time"
                  value={clockInTime}
                  onChange={(e) => setClockInTime(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clockOutTime">Clock-Out Time</Label>
                <Input
                  id="clockOutTime"
                  type="time"
                  value={clockOutTime}
                  onChange={(e) => setClockOutTime(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                placeholder="Add any notes or remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleMarkClockIn}
                disabled={
                  loading || !!captureBlock || clockInTargets.length === 0
                }
                className="flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Mark Clock-In ({clockInTargets.length} selected)
              </Button>

              <Button
                onClick={handleMarkClockOut}
                disabled={
                  loading || !!captureBlock || clockOutTargets.length === 0
                }
                variant="secondary"
                className="flex items-center gap-2"
              >
                <UserX className="h-4 w-4" />
                Mark Clock-Out ({clockOutTargets.length} selected)
              </Button>
            </div>

            {selectedEmployees.size > 0 &&
              clockInTargets.length + clockOutTargets.length <
                selectedEmployees.size && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Some selected employees have already completed the day and
                  will be skipped.
                </p>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
