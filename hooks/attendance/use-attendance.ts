/**
 * hooks/attendance/use-attendance.ts
 *
 * React Query query hooks for core attendance data.
 *
 * Adjacent concerns live in dedicated hook folders:
 *   - hooks/attendance-settings/      attendance profiles + effective settings
 *   - hooks/attendance-regularization/ regularization queue + writes
 *   - hooks/shift-timing/             shift timings
 *   - hooks/movement/                 movement records
 */

import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance-service';
import type { AttendanceListParams } from '@/types/attendance';
import { attendanceKeys } from './attendance-keys';

export function useAttendanceById(id: number | undefined) {
  return useQuery({
    queryKey: attendanceKeys.byId(id ?? 0),
    queryFn: () => attendanceService.getById(id!),
    enabled: id !== undefined && id > 0,
  });
}

export function useAttendanceByEmployee(
  employeeId: number | undefined,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: attendanceKeys.byEmployee(employeeId ?? 0, startDate, endDate),
    queryFn: () =>
      attendanceService.getByEmployee(employeeId!, startDate, endDate),
    enabled: !!employeeId && !!startDate && !!endDate,
  });
}

export function useAttendanceByProject(params: AttendanceListParams | null) {
  return useQuery({
    queryKey: attendanceKeys.byProject(params ?? { projectId: 0, date: '' }),
    queryFn: () => attendanceService.getByProject(params!),
    enabled: !!params && params.projectId > 0 && !!params.date,
  });
}

export function useAttendanceSummary(
  employeeId: number | undefined,
  month: number,
  year: number
) {
  return useQuery({
    queryKey: attendanceKeys.summary(employeeId ?? 0, month, year),
    queryFn: () => attendanceService.getSummary(employeeId!, month, year),
    enabled: !!employeeId,
  });
}

export { attendanceKeys } from './attendance-keys';
