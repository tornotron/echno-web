'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
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
import { UserCheck, UserX, Users } from 'lucide-react';
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

export function MarkAttendanceForm() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
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
  const attendanceByEmployee = new Map(
    (pagedResult?.content ?? []).map((a) => [a.employeeId, a])
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(new Set(members.map((m) => m.id)));
    } else {
      setSelectedEmployees(new Set());
    }
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

  const handleMarkClockIn = async () => {
    if (selectedEmployees.size === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    if (!resolvedShiftTimingId) {
      toast.error(
        'No shift timing configured. Set a default shift in attendance settings or create one in Shift Timings.'
      );
      return;
    }

    const [hours, minutes] = clockInTime.split(':').map(Number);
    const eventTimestamp = new Date(`${selectedDate}T${clockInTime}:00`);
    eventTimestamp.setHours(hours, minutes, 0, 0);

    const promises = [...selectedEmployees].map((empId) => {
      const existing = attendanceByEmployee.get(empId);
      if (existing?.morningClockIn) return Promise.resolve(); // already clocked in
      if (existing) {
        // Attendance record exists but no clock-in yet — add the event
        return clockEventMutation.mutateAsync({
          attendanceId: existing.id,
          eventType: ClockEventType.morningClockIn,
          eventTimestamp,
          remarks,
        });
      }
      // No record yet — use check-in endpoint
      return checkInMutation.mutateAsync({
        employeeId: empId,
        projectId: Number(selectedProject),
        shiftTimingId: resolvedShiftTimingId,
        eventTimestamp,
        remarks,
      });
    });

    Promise.allSettled(promises).then((results) => {
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      toast.success(`Clock-in marked for ${succeeded} employee(s)`);
      setSelectedEmployees(new Set());
      setRemarks('');
    });
  };

  const handleMarkClockOut = async () => {
    if (selectedEmployees.size === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    const eventTimestamp = new Date(`${selectedDate}T${clockOutTime}:00`);

    const promises = [...selectedEmployees]
      .map((empId) => {
        const existing = attendanceByEmployee.get(empId);
        if (!existing || existing.eveningClockOut) return null; // no record or already clocked out
        return clockEventMutation.mutateAsync({
          attendanceId: existing.id,
          eventType: ClockEventType.eveningClockOut,
          eventTimestamp,
          remarks,
        });
      })
      .filter(Boolean);

    if (promises.length === 0) {
      toast.error(
        'No eligible employees to clock out (must be clocked in first)'
      );
      return;
    }

    Promise.allSettled(promises).then((results) => {
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      toast.success(`Clock-out marked for ${succeeded} employee(s)`);
      setSelectedEmployees(new Set());
      setRemarks('');
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'present': {
        return <Badge className="bg-green-500">Clocked Out</Badge>;
      }
      case 'clocked-in': {
        return <Badge className="bg-blue-500">Clocked In</Badge>;
      }
      case 'absent': {
        return <Badge variant="destructive">Absent</Badge>;
      }
      default: {
        return <Badge variant="secondary">Not Marked</Badge>;
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
                          members.length > 0 &&
                          selectedEmployees.size === members.length
                        }
                        onCheckedChange={handleSelectAll}
                        disabled={loading || members.length === 0}
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
                      const clockedIn = !!record?.morningClockIn;
                      const clockedOut = !!record?.eveningClockOut;
                      const currentStatus = clockedOut
                        ? 'present'
                        : clockedIn
                          ? 'clocked-in'
                          : 'not-marked';
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedEmployees.has(member.id)}
                              onCheckedChange={(checked) =>
                                handleSelectEmployee(
                                  member.id,
                                  checked as boolean
                                )
                              }
                              disabled={loading}
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
                          <TableCell>{getStatusBadge(currentStatus)}</TableCell>
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
                disabled={loading || selectedEmployees.size === 0}
                className="flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Mark Clock-In ({selectedEmployees.size} selected)
              </Button>

              <Button
                onClick={handleMarkClockOut}
                disabled={loading || selectedEmployees.size === 0}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <UserX className="h-4 w-4" />
                Mark Clock-Out ({selectedEmployees.size} selected)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
