/**
 * hooks/movement/use-movement.ts
 *
 * React Query query hooks for movement records.
 */

import { useQuery } from '@tanstack/react-query';
import { movementService } from '@/services/movement-service';
import { movementKeys } from './movement-keys';

export function useMovementsByAttendance(attendanceId: number | undefined) {
  return useQuery({
    queryKey: movementKeys.byAttendance(attendanceId ?? 0),
    queryFn: () => movementService.getMovementsByAttendance(attendanceId!),
    enabled: attendanceId !== undefined && attendanceId > 0,
  });
}

export function useMovementById(id: number | undefined) {
  return useQuery({
    queryKey: movementKeys.detail(id ?? 0),
    queryFn: () => movementService.getMovementById(id!),
    enabled: id !== undefined && id > 0,
  });
}

export { movementKeys } from './movement-keys';
