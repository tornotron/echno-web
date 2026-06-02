/**
 * hooks/attendance/attendance-keys.ts
 *
 * React Query key factory for core attendance queries.
 *
 * Adjacent key factories:
 *   - Regularization keys: hooks/attendance-regularization/attendance-regularization-keys.ts
 *   - Settings keys:       hooks/attendance-settings/attendance-settings-keys.ts
 *   - Shift keys:          hooks/shift-timing/shift-timing-keys.ts
 *   - Movement keys:       hooks/movement/movement-keys.ts
 */

import type { AttendanceListParams } from '@/types/attendance';

export const attendanceKeys = {
  all: ['attendance'] as const,

  byId: (id: number) => [...attendanceKeys.all, 'detail', id] as const,

  byEmployee: (employeeId: number, startDate: string, endDate: string) =>
    [
      ...attendanceKeys.all,
      'employee',
      employeeId,
      startDate,
      endDate,
    ] as const,

  byProject: (params: AttendanceListParams) =>
    [...attendanceKeys.all, 'project', params] as const,

  summary: (employeeId: number, month: number, year: number) =>
    [...attendanceKeys.all, 'summary', employeeId, month, year] as const,
};
