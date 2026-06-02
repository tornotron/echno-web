import type { Attendance } from '@/types';
import type { AttendanceStatus } from '@/types';

const STATUS_TO_BACKEND: Record<AttendanceStatus, string> = {
  present: 'PRESENT',
  halfDay: 'HALF_DAY',
  absent: 'ABSENT',
  leave: 'LEAVE',
  weeklyOff: 'WEEKLY_OFF',
  holiday: 'HOLIDAY',
  late: 'LATE',
  earlyCheckout: 'EARLY_CHECKOUT',
  overtime: 'OVERTIME',
  pendingRegularization: 'PENDING_REGULARIZATION',
};

/**
 * Query params for the project-scoped attendance list endpoint
 * (`GET /attendance/web/project/{projectId}`). `projectId` is taken from the
 * path, the rest go on the query string.
 */
export interface AttendanceListParams {
  projectId: number;
  date: string; // YYYY-MM-DD
  status?: AttendanceStatus;
  search?: string;
  page?: number;
  size?: number;
}

/**
 * Build the query-string portion of the project list call. The backend
 * expects the status enum in SCREAMING_SNAKE_CASE.
 */
export function attendanceListParamsToQuery(
  params: AttendanceListParams
): Record<string, string | number | boolean> {
  const q: Record<string, string | number | boolean> = {
    date: params.date,
  };
  if (params.status) q.status = STATUS_TO_BACKEND[params.status];
  if (params.search) q.search = params.search;
  if (params.page !== undefined) q.page = params.page;
  if (params.size !== undefined) q.size = params.size;
  return q;
}

/**
 * Spring-style `Page<AttendanceResponseDto>` wrapper as parsed by the service.
 */
export interface PagedAttendance {
  content: Attendance[];
  totalElements: number;
  totalPages: number;
  /** 0-based page index. */
  number: number;
  size: number;
}
