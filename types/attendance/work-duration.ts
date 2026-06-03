// types/attendance/work-duration.ts
// Per-day work duration breakdown and the helper that derives it from an
// attendance record's clock events.

import type { Attendance } from '@/types';

export interface WorkDuration {
  totalMinutes: number;
  hours: number;
  minutes: number;
  /** Minutes worked before lunch break. */
  morningSession: number;
  /** Minutes worked after lunch break. */
  afternoonSession: number;
  overtimeMinutes: number;
  /** Total break time, in minutes. */
  breakDuration: number;
}

/**
 * Calculate work duration from an attendance record's clock events.
 *
 * Morning = check-in → lunch-out.
 * Afternoon = lunch-in → clock-out.
 * Break = lunch-out → lunch-in.
 * Overtime = any time beyond the shift's overtime threshold.
 */
export function calculateWorkDuration(attendance: Attendance): WorkDuration {
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

  // Single-cycle days (no lunch break) and partial-cycle days (only one of
  // the two lunch events recorded) leave morning+afternoon at 0. Fall back to
  // the full clock-in → clock-out span when both bookends exist so we don't
  // report 0h for an employee who worked the whole day.
  let totalMinutes = morningSession + afternoonSession;
  if (
    totalMinutes === 0 &&
    attendance.morningClockIn &&
    attendance.eveningClockOut
  ) {
    totalMinutes = Math.floor(
      (attendance.eveningClockOut.timestamp.getTime() -
        attendance.morningClockIn.timestamp.getTime()) /
        (1000 * 60)
    );
  }
  const totalHours = totalMinutes / 60;

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
