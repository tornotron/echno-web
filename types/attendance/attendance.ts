// types/attendance/attendance.ts
// Core Attendance entity — one record per (employee, date, project).
//
// Adjacent concepts live in sibling files:
//   - AttendanceProfile      → ./attendance-profile.ts
//   - WorkDuration           → ./work-duration.ts
//   - AttendanceRegularization / RegularizationDetail → ./regularization.ts
//   - AttendanceSummary      → ./attendance-summary.ts
//   - AttendanceReport       → ./attendance-report.ts
//   - MovementRecord         → ./movement.ts
//   - ShiftTiming            → @/types/shift-timing

import { parsePositiveInt } from '@/types/parse-id';
import { AttendanceStatus } from '@/types';
import { type ClockEvent, parseClockEvent } from '@/types';
import { type MovementRecord, parseMovementRecord } from '@/types';
import {
  type AttendanceRegularization,
  parseAttendanceRegularization,
} from '@/types';
import type { WorkDuration } from '@/types';
import { type ShiftTiming, parseShiftTiming } from '@/types/shift-timing';

export interface Attendance {
  id: number;
  employeeId: number;
  employeeName: string;
  date: Date;
  projectId: number;
  projectName: string;
  status: AttendanceStatus;
  shiftTiming: ShiftTiming;

  // Clock events for the day
  morningClockIn?: ClockEvent;
  lunchBreakStart?: ClockEvent;
  lunchBreakEnd?: ClockEvent;
  eveningClockOut?: ClockEvent;

  // Derived fields
  workDuration: WorkDuration;
  isLateArrival: boolean;
  isEarlyCheckout: boolean;
  isOvertime: boolean;

  // Leave integration
  leaveId?: number;
  leaveType?: string;

  // Regularization (zero or one open request per record)
  regularization?: AttendanceRegularization;

  // Off-site activity tracking
  movements?: MovementRecord[];

  // Approval workflow
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;

  // Metadata
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Derive the attendance status from the record's clock events and calculated
 * work duration. Priority: leave → weekly off → absent (no clock-in) →
 * overtime → late/early/present → half-day → pending regularization.
 */
export function determineAttendanceStatus(
  attendance: Attendance,
  workDuration: WorkDuration
): AttendanceStatus {
  if (attendance.leaveId) return AttendanceStatus.leave;

  const dayOfWeek = attendance.date.getDay();
  if (dayOfWeek === 0) return AttendanceStatus.weeklyOff; // Sunday

  if (!attendance.morningClockIn) return AttendanceStatus.absent;

  const totalHours = workDuration.hours + workDuration.minutes / 60;

  if (totalHours >= attendance.shiftTiming.overtimeThreshold) {
    return AttendanceStatus.overtime;
  }

  if (totalHours >= attendance.shiftTiming.minimumWorkHours) {
    if (attendance.isLateArrival) return AttendanceStatus.late;
    if (attendance.isEarlyCheckout) return AttendanceStatus.earlyCheckout;
    return AttendanceStatus.present;
  }

  if (totalHours >= attendance.shiftTiming.halfDayWorkHours) {
    return AttendanceStatus.halfDay;
  }

  if (!attendance.eveningClockOut) {
    return AttendanceStatus.pendingRegularization;
  }

  return AttendanceStatus.absent;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseAttendance(data: any): Attendance {
  return {
    ...data,
    id: parsePositiveInt(data.id, 'parseAttendance.id'),
    date: new Date(data.date),
    shiftTiming: data.shiftTiming
      ? parseShiftTiming(data.shiftTiming)
      : data.shiftTiming,
    morningClockIn: data.morningClockIn
      ? parseClockEvent(data.morningClockIn)
      : undefined,
    lunchBreakStart: data.lunchBreakStart
      ? parseClockEvent(data.lunchBreakStart)
      : undefined,
    lunchBreakEnd: data.lunchBreakEnd
      ? parseClockEvent(data.lunchBreakEnd)
      : undefined,
    eveningClockOut: data.eveningClockOut
      ? parseClockEvent(data.eveningClockOut)
      : undefined,
    regularization: data.regularization
      ? parseAttendanceRegularization(data.regularization)
      : undefined,
    movements: data.movements
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data.movements as any[]).map((m) => parseMovementRecord(m))
      : undefined,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    approvedAt: data.approvedAt ? new Date(data.approvedAt) : undefined,
  };
}

export function attendanceToJson(
  attendance: Attendance
): Record<string, unknown> {
  return {
    ...attendance,
    date: attendance.date.toISOString(),
    createdAt: attendance.createdAt.toISOString(),
    updatedAt: attendance.updatedAt.toISOString(),
    approvedAt: attendance.approvedAt?.toISOString(),
  };
}
