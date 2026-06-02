// types/attendance/regularization.ts
// Regularization request entity: lets an employee correct missed clock events
// (e.g. forgot to clock out). Managers approve / reject from a pending queue.

import { parsePositiveInt } from '@/types/parse-id';

export interface AttendanceRegularization {
  id: number;
  attendanceId: number;
  reason: string;
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  /** Which clock events were missed (SCREAMING_SNAKE_CASE backend strings). */
  missingEvents: string[];
}

/**
 * Enriched regularization — extends the base with optional attendance context
 * fields that may or may not be present depending on the endpoint. The
 * `/pending` list typically includes them; the freshly-created response does
 * not.
 */
export interface RegularizationDetail extends AttendanceRegularization {
  employeeId?: number;
  employeeName?: string;
  attendanceDate?: Date;
  projectId?: number;
  projectName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseAttendanceRegularization(
  data: any
): AttendanceRegularization {
  return {
    id: parsePositiveInt(data.id, 'parseAttendanceRegularization.id'),
    attendanceId: parsePositiveInt(
      data.attendanceId,
      'parseAttendanceRegularization.attendanceId'
    ),
    reason: data.reason,
    requestedBy: data.requestedBy,
    requestedAt: new Date(data.requestedAt),
    approvedBy: data.approvedBy ?? undefined,
    approvedAt: data.approvedAt ? new Date(data.approvedAt) : undefined,
    status: data.status,
    rejectionReason: data.rejectionReason ?? undefined,
    missingEvents: data.missingEvents ?? [],
  };
}
