// types/attendance/attendance-summary.ts
// Monthly attendance summary returned by the /summary/{employeeId} endpoint,
// plus the per-project breakdown and the salary derivation helper.

export interface ProjectAttendanceSummary {
  projectId: number;
  projectName: string;
  daysWorked: number;
  hoursWorked: number;
  overtimeHours: number;
  attendancePercentage: number;
}

export interface AttendanceSummary {
  employeeId: number;
  employeeName: string;
  /** 1–12. */
  month: number;
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

  // Calculated
  attendancePercentage: number;
  effectiveWorkDays: number;

  // Optional fields — not always returned by the backend.
  baseSalary?: number;
  attendanceDeductions?: number;
  overtimePay?: number;
  netSalary?: number;
  projectWiseAttendance?: ProjectAttendanceSummary[];
}

/**
 * Derive monthly salary fields (effectiveWorkDays, deductions, overtime pay,
 * net salary, attendance percentage) from a base salary + the summary counts.
 *
 * Returns the original summary unchanged when no baseSalary is provided.
 */
export function calculateMonthlySalary(
  summary: AttendanceSummary
): AttendanceSummary {
  if (summary.baseSalary === undefined) {
    return summary;
  }
  const baseSalary = summary.baseSalary;
  const dailySalary = baseSalary / summary.totalWorkingDays;

  // Effective work days with weighted credit per category.
  let effectiveWorkDays = 0;
  effectiveWorkDays += summary.presentDays;
  effectiveWorkDays += summary.halfDays * 0.5;
  effectiveWorkDays += summary.leaveDays; // paid leave
  effectiveWorkDays += summary.weeklyOffs;
  effectiveWorkDays += summary.holidays;
  effectiveWorkDays += summary.lateDays * 0.9; // 10% deduction for late

  const attendanceDeductions =
    (summary.totalWorkingDays - effectiveWorkDays) * dailySalary;

  // Overtime pay at 1.5× hourly rate, assuming an 8-hour standard day.
  const hourlyRate = baseSalary / (summary.totalWorkingDays * 8);
  const overtimePay = summary.totalOvertimeHours * hourlyRate * 1.5;

  const netSalary = baseSalary - attendanceDeductions + overtimePay;

  return {
    ...summary,
    effectiveWorkDays,
    attendanceDeductions,
    overtimePay,
    netSalary,
    attendancePercentage: (effectiveWorkDays / summary.totalWorkingDays) * 100,
  };
}
