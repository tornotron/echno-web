/**
 * hooks/movement/use-movement-mutations.ts
 *
 * React Query mutation hooks for movement records.
 *
 * Cache discipline:
 *   - Both endpoints return the full `MovementRecordDto` (Rule A) — the
 *     per-attendance list cache is patched directly so the UI reflects the
 *     write without a refetch.
 *   - Parent attendance lives in the attendance module. Its detail cache
 *     embeds `Attendance.movements` so we also patch the parent's array
 *     in place; if the parent attendance is uncached we skip the patch and
 *     rely on the next observer-driven fetch.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movementService } from '@/services/movement-service';
import type {
  Attendance,
  CreateMovementRequest,
  MovementRecord,
} from '@/types/attendance';
import { attendanceKeys } from '@/hooks/attendance/attendance-keys';
import { movementKeys } from './movement-keys';

/**
 * Insert / replace a movement record in the parent attendance's `movements`
 * array. Used by both create and verify so the embedded list stays in sync
 * without invalidating the parent attendance detail.
 */
function patchMovementInParentAttendance(
  queryClient: ReturnType<typeof useQueryClient>,
  movement: MovementRecord
) {
  queryClient.setQueryData<Attendance>(
    attendanceKeys.byId(movement.attendanceId),
    (old) => {
      if (!old) return old;
      const existing = old.movements ?? [];
      const idx = existing.findIndex((m) => m.id === movement.id);
      const movements =
        idx === -1
          ? [...existing, movement]
          : existing.map((m) => (m.id === movement.id ? movement : m));
      return { ...old, movements };
    }
  );
}

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
    onSuccess: (movement) => {
      // POST /movement-records/web → MovementRecordDto (Rule A, full).
      queryClient.setQueryData<MovementRecord[]>(
        movementKeys.byAttendance(movement.attendanceId),
        (old) => (old ? [...old, movement] : undefined)
      );
      patchMovementInParentAttendance(queryClient, movement);
    },
  });
}

export function useVerifyMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verifiedBy }: { id: number; verifiedBy: string }) =>
      movementService.verifyMovement(id, verifiedBy),
    onSuccess: (movement) => {
      // POST /movement-records/web/{id}/verify → MovementRecordDto (Rule A, full).
      queryClient.setQueryData<MovementRecord>(
        movementKeys.detail(movement.id),
        movement
      );
      queryClient.setQueryData<MovementRecord[]>(
        movementKeys.byAttendance(movement.attendanceId),
        (old) => old?.map((m) => (m.id === movement.id ? movement : m))
      );
      patchMovementInParentAttendance(queryClient, movement);
    },
  });
}
