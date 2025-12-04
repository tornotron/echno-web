// types/attendance/attendance.ts
// Main attendance type definition

import { AttendanceStatus } from './attendance-status';
import { ClockEvent } from './clock-event';
import { MovementRecord } from './movement-type';

export interface ShiftTiming {
  shiftName: string;
  startTime: string; // HH:MM format, e.g., "09:00"
  endTime: string; // HH:MM format, e.g., "18:00"
  lunchBreakStart: string; // HH:MM format, e.g., "13:00"
  lunchBreakEnd: string; // HH:MM format, e.g., "14:00"
  gracePeriodMinutes: number; // Grace period for late arrival
  minimumWorkHours: number; // Minimum hours for full day
  halfDayWorkHours: number; // Minimum hours for half day
  overtimeThreshold: number; // Hours after which overtime is calculated
}

export interface WorkDuration {
  totalMinutes: number;
  hours: number;
  minutes: number;
  morningSession: number; // Minutes worked before lunch
  afternoonSession: number; // Minutes worked after lunch
  overtimeMinutes: number;
  breakDuration: number; // Total break time in minutes
}

export interface AttendanceRegularization {
  id: number;
  reason: string;
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  missingEvents: string[]; // Which clock events were missed
}

export interface Attendance {
  id: number;
  employeeId: string;
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

  // Calculated fields
  workDuration: WorkDuration;
  isLateArrival: boolean;
  isEarlyCheckout: boolean;
  isOvertime: boolean;

  // Leave integration
  leaveId?: number; // If employee is on leave
  leaveType?: string;

  // Regularization
  regularization?: AttendanceRegularization;

  // Movement tracking
  movements?: MovementRecord[]; // Daily movements and activities

  // Approval workflow
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;

  // Metadata
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceSummary {
  employeeId: string;
  employeeName: string;
  month: number; // 1-12
  year: number;

  // Counts
  totalWorkingDays: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  weeklyOffs: number;
  holidays: number;
  lateDays: number;
  overtimeDays: number;

  // Time tracking
  totalHoursWorked: number;
  totalOvertimeHours: number;
  averageWorkHours: number;

  // Salary calculation
  attendancePercentage: number;
  effectiveWorkDays: number; // Weighted days for salary
  baseSalary: number;
  attendanceDeductions: number;
  overtimePay: number;
  netSalary: number;

  // Project-wise breakdown
  projectWiseAttendance: ProjectAttendanceSummary[];
}

export interface ProjectAttendanceSummary {
  projectId: number;
  projectName: string;
  daysWorked: number;
  hoursWorked: number;
  overtimeHours: number;
  attendancePercentage: number;
}

export interface AttendanceReport {
  startDate: Date;
  endDate: Date;
  totalEmployees: number;
  averageAttendance: number;

  // Status wise counts
  statusCounts: Record<AttendanceStatus, number>;

  // Project wise summary
  projectSummaries: {
    projectId: number;
    projectName: string;
    totalAttendance: number;
    averageAttendance: number;
    employeeCount: number;
  }[];

  // Daily trends
  dailyTrends: {
    date: Date;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    averageWorkHours: number;
  }[];

  // Top performers
  topPerformers: {
    employeeId: string;
    employeeName: string;
    attendancePercentage: number;
    totalHours: number;
  }[];

  // Attendance issues
  issues: {
    employeeId: string;
    employeeName: string;
    issueType: 'frequent_absence' | 'frequent_late' | 'missing_clockout';
    occurrenceCount: number;
  }[];
}

/**
 * Calculate work duration from clock events
 */
export function calculateWorkDuration(attendance: Attendance): WorkDuration {
  let totalMinutes = 0;
  let morningSession = 0;
  let afternoonSession = 0;
  let breakDuration = 0;
  let overtimeMinutes = 0;

  if (attendance.morningClockIn && attendance.lunchBreakStart) {
    morningSession = Math.floor(
      (attendance.lunchBreakStart.timestamp.getTime() -
        attendance.morningClockIn.timestamp.getTime()) /
        (1000 * 60)
    );
  }

  if (attendance.lunchBreakStart && attendance.lunchBreakEnd) {
    breakDuration = Math.floor(
      (attendance.lunchBreakEnd.timestamp.getTime() -
        attendance.lunchBreakStart.timestamp.getTime()) /
        (1000 * 60)
    );
  }

  if (attendance.lunchBreakEnd && attendance.eveningClockOut) {
    afternoonSession = Math.floor(
      (attendance.eveningClockOut.timestamp.getTime() -
        attendance.lunchBreakEnd.timestamp.getTime()) /
        (1000 * 60)
    );
  }

  totalMinutes = morningSession + afternoonSession;
  const totalHours = totalMinutes / 60;

  // Calculate overtime
  if (totalHours > attendance.shiftTiming.overtimeThreshold) {
    overtimeMinutes = Math.floor(
      (totalHours - attendance.shiftTiming.overtimeThreshold) * 60
    );
  }

  return {
    totalMinutes,
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    morningSession,
    afternoonSession,
    overtimeMinutes,
    breakDuration,
  };
}

/**
 * Determine attendance status based on clock events and work duration
 */
export function determineAttendanceStatus(
  attendance: Attendance,
  workDuration: WorkDuration
): AttendanceStatus {
  // Check if on leave
  if (attendance.leaveId) {
    return AttendanceStatus.leave;
  }

  // Check if weekly off or holiday
  const dayOfWeek = attendance.date.getDay();
  if (dayOfWeek === 0) {
    // Sunday
    return AttendanceStatus.weeklyOff;
  }

  // If no morning clock-in, mark as absent
  if (!attendance.morningClockIn) {
    return AttendanceStatus.absent;
  }

  const totalHours = workDuration.hours + workDuration.minutes / 60;

  // Check for overtime
  if (totalHours >= attendance.shiftTiming.overtimeThreshold) {
    return AttendanceStatus.overtime;
  }

  // Check for full day
  if (totalHours >= attendance.shiftTiming.minimumWorkHours) {
    if (attendance.isLateArrival) {
      return AttendanceStatus.late;
    }
    if (attendance.isEarlyCheckout) {
      return AttendanceStatus.earlyCheckout;
    }
    return AttendanceStatus.present;
  }

  // Check for half day
  if (totalHours >= attendance.shiftTiming.halfDayWorkHours) {
    return AttendanceStatus.halfDay;
  }

  // If work hours are less than half day threshold
  if (!attendance.eveningClockOut) {
    return AttendanceStatus.pendingRegularization;
  }

  return AttendanceStatus.absent;
}

/**
 * Check if arrival is late based on shift timing and grace period
 */
export function isLateArrival(
  clockInTime: Date,
  shiftTiming: ShiftTiming
): boolean {
  const clockInHour = clockInTime.getHours();
  const clockInMinute = clockInTime.getMinutes();
  const clockInTotalMinutes = clockInHour * 60 + clockInMinute;

  const [shiftHour, shiftMinute] = shiftTiming.startTime.split(':').map(Number);
  const shiftStartMinutes = shiftHour * 60 + shiftMinute;
  const graceEndMinutes = shiftStartMinutes + shiftTiming.gracePeriodMinutes;

  return clockInTotalMinutes > graceEndMinutes;
}

/**
 * Check if checkout is early
 */
export function isEarlyCheckout(
  clockOutTime: Date,
  shiftTiming: ShiftTiming
): boolean {
  const clockOutHour = clockOutTime.getHours();
  const clockOutMinute = clockOutTime.getMinutes();
  const clockOutTotalMinutes = clockOutHour * 60 + clockOutMinute;

  const [shiftHour, shiftMinute] = shiftTiming.endTime.split(':').map(Number);
  const shiftEndMinutes = shiftHour * 60 + shiftMinute;

  return clockOutTotalMinutes < shiftEndMinutes - 30; // 30 minutes before shift end
}

/**
 * Calculate monthly salary based on attendance
 */
export function calculateMonthlySalary(
  summary: AttendanceSummary
): AttendanceSummary {
  const dailySalary = summary.baseSalary / summary.totalWorkingDays;

  // Calculate effective work days with weights
  let effectiveWorkDays = 0;
  effectiveWorkDays += summary.presentDays * 1;
  effectiveWorkDays += summary.halfDays * 0.5;
  effectiveWorkDays += summary.leaveDays * 1; // Paid leave
  effectiveWorkDays += summary.weeklyOffs * 1;
  effectiveWorkDays += summary.holidays * 1;
  effectiveWorkDays += summary.lateDays * 0.9; // 10% deduction

  // Calculate deductions
  const attendanceDeductions =
    (summary.totalWorkingDays - effectiveWorkDays) * dailySalary;

  // Calculate overtime pay (1.5x for overtime hours)
  const hourlyRate = summary.baseSalary / (summary.totalWorkingDays * 8); // Assuming 8 hours/day
  const overtimePay = summary.totalOvertimeHours * hourlyRate * 1.5;

  // Calculate net salary
  const netSalary = summary.baseSalary - attendanceDeductions + overtimePay;

  return {
    ...summary,
    effectiveWorkDays,
    attendanceDeductions,
    overtimePay,
    netSalary,
    attendancePercentage: (effectiveWorkDays / summary.totalWorkingDays) * 100,
  };
}

/**
 * Parse attendance from JSON
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseAttendance(data: any): Attendance {
  return {
    ...data,
    date: new Date(data.date),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    approvedAt: data.approvedAt ? new Date(data.approvedAt) : undefined,
  };
}

/**
 * Convert attendance to JSON
 */
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
