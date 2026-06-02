/**
 * hooks/attendance-regularization/use-attendance-regularization.ts
 *
 * React Query query hooks for attendance-regularization data.
 */

import { useQuery } from '@tanstack/react-query';
import { attendanceRegularizationService } from '@/services/attendance-regularization-service';
import { attendanceRegularizationKeys } from './attendance-regularization-keys';

export function usePendingRegularizations() {
  return useQuery({
    queryKey: attendanceRegularizationKeys.pending(),
    queryFn: () => attendanceRegularizationService.getPending(),
  });
}

export function useRegularizationById(id: number | undefined) {
  return useQuery({
    queryKey: attendanceRegularizationKeys.detail(id ?? 0),
    queryFn: () => attendanceRegularizationService.getById(id!),
    enabled: id !== undefined && id > 0,
  });
}

// NOTE: No dedicated "regularizations by employee" hook — derive from
// useAttendanceByEmployee + .regularization on each record (see
// EmployeeRegularizationView).

export { attendanceRegularizationKeys } from './attendance-regularization-keys';
