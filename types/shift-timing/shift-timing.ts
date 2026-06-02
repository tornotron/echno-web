// types/shift-timing/shift-timing.ts
// Shift timing entity. Lives outside the attendance module because shift
// timings are referenced by attendance, scheduling, payroll, and any future
// roster-based feature — none of which should pull in the attendance domain.

import { parsePositiveInt } from '@/types/parse-id';

export interface ShiftTiming {
  id: number;
  shiftName: string;
  /** HH:MM format, e.g. "09:00". */
  startTime: string;
  /** HH:MM format, e.g. "18:00". */
  endTime: string;
  /** HH:MM format, e.g. "13:00". */
  lunchBreakStart: string;
  /** HH:MM format, e.g. "14:00". */
  lunchBreakEnd: string;
  /** Grace period for late arrival, in minutes. */
  gracePeriodMinutes: number;
  /** Minimum hours required for a full-day count. */
  minimumWorkHours: number;
  /** Minimum hours required for a half-day count. */
  halfDayWorkHours: number;
  /** Hours after which overtime starts accruing. */
  overtimeThreshold: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseShiftTiming(raw: any): ShiftTiming {
  return {
    id: parsePositiveInt(raw.id, 'parseShiftTiming.id'),
    shiftName: raw.shiftName,
    startTime: raw.startTime,
    endTime: raw.endTime,
    lunchBreakStart: raw.lunchBreakStart,
    lunchBreakEnd: raw.lunchBreakEnd,
    gracePeriodMinutes: raw.gracePeriodMinutes,
    minimumWorkHours: raw.minimumWorkHours,
    halfDayWorkHours: raw.halfDayWorkHours,
    overtimeThreshold: raw.overtimeThreshold,
  };
}

/**
 * Returns true when an employee arrived after `shift.startTime` plus the
 * configured grace period.
 */
export function isLateArrival(
  clockInTime: Date,
  shiftTiming: ShiftTiming
): boolean {
  const clockInMinutes = clockInTime.getHours() * 60 + clockInTime.getMinutes();
  const [shiftHour, shiftMinute] = shiftTiming.startTime.split(':').map(Number);
  const shiftStartMinutes = shiftHour * 60 + shiftMinute;
  const graceEndMinutes = shiftStartMinutes + shiftTiming.gracePeriodMinutes;
  return clockInMinutes > graceEndMinutes;
}

/**
 * Returns true when an employee clocked out more than 30 minutes before
 * `shift.endTime`.
 */
export function isEarlyCheckout(
  clockOutTime: Date,
  shiftTiming: ShiftTiming
): boolean {
  const clockOutMinutes =
    clockOutTime.getHours() * 60 + clockOutTime.getMinutes();
  const [shiftHour, shiftMinute] = shiftTiming.endTime.split(':').map(Number);
  const shiftEndMinutes = shiftHour * 60 + shiftMinute;
  return clockOutMinutes < shiftEndMinutes - 30;
}
