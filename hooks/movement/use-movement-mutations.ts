/**
 * hooks/movement/use-movement-mutations.ts
 *
 * React Query mutation hooks for movement records. Parent attendance lives
 * in the attendance module — these mutations invalidate the parent
 * attendance detail so an embedded movements list refreshes after a write.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movementService } from '@/services/movement-service';
import type { CreateMovementRequest } from '@/types/attendance';
import { attendanceKeys } from '@/hooks/attendance/attendance-keys';
import { movementKeys } from './movement-keys';

export function useLogMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      req,
      employeeId,
    }: {
      req: CreateMovementRequest;
      employeeId: number;
    }) => movementService.logMovement(req, employeeId),
    onSuccess: (_movement, { req }) => {
      queryClient.invalidateQueries({
        queryKey: movementKeys.byAttendance(req.attendanceId),
      });
      // Parent attendance detail embeds the movements array — refresh it.
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.byId(req.attendanceId),
      });
    },
  });
}

export function useVerifyMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verifiedBy }: { id: number; verifiedBy: string }) =>
      movementService.verifyMovement(id, verifiedBy),
    onSuccess: (movement) => {
      queryClient.invalidateQueries({
        queryKey: movementKeys.detail(movement.id),
      });
      queryClient.invalidateQueries({
        queryKey: movementKeys.byAttendance(movement.attendanceId),
      });
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.byId(movement.attendanceId),
      });
    },
  });
}
