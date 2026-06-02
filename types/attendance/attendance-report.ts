// types/attendance/attendance-report.ts
// Wide-range attendance report used by analytics views.

import type { AttendanceStatus } from '@/types';

export interface AttendanceReport {
  startDate: Date;
  endDate: Date;
  totalEmployees: number;
  averageAttendance: number;

  /** Count per status across the period. */
  statusCounts: Record<AttendanceStatus, number>;

  projectSummaries: {
    projectId: number;
    projectName: string;
    totalAttendance: number;
    averageAttendance: number;
    employeeCount: number;
  }[];

  dailyTrends: {
    date: Date;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    averageWorkHours: number;
  }[];

  topPerformers: {
    employeeId: string;
    employeeName: string;
    attendancePercentage: number;
    totalHours: number;
  }[];

  issues: {
    employeeId: string;
    employeeName: string;
    issueType: 'frequent_absence' | 'frequent_late' | 'missing_clockout';
    occurrenceCount: number;
  }[];
}
