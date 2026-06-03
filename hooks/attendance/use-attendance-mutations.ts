/**
 * hooks/attendance/use-attendance-mutations.ts
 *
 * React Query mutation hooks for core attendance writes.
 *
 * Adjacent mutation hooks live in:
 *   - hooks/attendance-settings/use-attendance-settings-mutations.ts
 *   - hooks/attendance-regularization/use-attendance-regularization-mutations.ts
 *   - hooks/shift-timing/use-shift-timing-mutations.ts
 *   - hooks/movement/use-movement-mutations.ts
 *
 * Cache discipline applied per Milestone 8 (attendance):
 *   - Rule A (full `<Domain>Dto` response): patch detail + lists directly.
 *   - Rule C (`ApiResponse` / void): service returns Promise<void>; mutation
 *     invalidates the affected keys without a patch payload.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance-service';
import type {
  Attendance,
  AttendanceCheckInRequest,
  CreateClockEventRequest,
} from '@/types/attendance';
import { attendanceKeys } from './attendance-keys';

/**
 * Matches every paged Attendance list cache under the 'attendance' namespace
 * (project- or employee-scoped). Excludes detail / summary entries which live
 * under the same root key but carry different shapes.
 */
function isAttendanceListCache(query: {
  queryKey: ReadonlyArray<unknown>;
}): boolean {
  const key = query.queryKey;
  return (
    Array.isArray(key) &&
    key[0] === 'attendance' &&
    (key[1] === 'project' || key[1] === 'employee')
  );
}

/**
 * Patch a single Attendance record across all cached list shapes:
 *   - paginated project lists: `{ content: Attendance[], ... }`
 *   - per-employee arrays: `Attendance[]`
 * Updaters return `undefined` for absent caches so we don't seed stale entries.
 */
function patchAttendanceInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  attendance: Attendance
) {
  queryClient.setQueriesData(
    { predicate: isAttendanceListCache },
    (old: unknown) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return (old as Attendance[]).map((a) =>
          a.id === attendance.id ? attendance : a
        );
      }
      if (typeof old === 'object' && 'content' in (old as object)) {
        const paged = old as { content: Attendance[]; [k: string]: unknown };
        return {
          ...paged,
          content: paged.content.map((a) =>
            a.id === attendance.id ? attendance : a
          ),
        };
      }
      return old;
    }
  );
}

/**
 * Remove a single Attendance record across all cached list shapes after a
 * delete. Mirrors `patchAttendanceInLists` over the same shapes.
 */
function removeAttendanceFromLists(
  queryClient: ReturnType<typeof useQueryClient>,
  id: number
) {
  queryClient.setQueriesData(
    { predicate: isAttendanceListCache },
    (old: unknown) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return (old as Attendance[]).filter((a) => a.id !== id);
      }
      if (typeof old === 'object' && 'content' in (old as object)) {
        const paged = old as { content: Attendance[]; [k: string]: unknown };
        return { ...paged, content: paged.content.filter((a) => a.id !== id) };
      }
      return old;
    }
  );
}

// ─── Core Attendance ──────────────────────────────────────────────────────────

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: AttendanceCheckInRequest) =>
      attendanceService.checkIn(req),
    onSuccess: (attendance) => {
      // POST /attendance/web/check-in → AttendanceResponseDto (Rule A, full).
      queryClient.setQueryData<Attendance>(
        attendanceKeys.byId(attendance.id),
        attendance
      );
      // Check-in CREATES a new attendance row; patchAttendanceInLists only
      // updates existing entries via .map, so a brand-new record wouldn't
      // surface in cached lists. Invalidate the list caches instead so they
      // refetch and include the new row.
      queryClient.invalidateQueries({ predicate: isAttendanceListCache });
      // Cross-key: monthly summary aggregates counts; invalidate the matching
      // summary cache so percentages reflect the new check-in.
      queryClient.invalidateQueries({
        queryKey: [...attendanceKeys.all, 'summary', attendance.employeeId],
      });
    },
  });
}

export function useRecordClockEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateClockEventRequest) =>
      attendanceService.recordClockEvent(req),
    onSuccess: (attendance) => {
      // POST /attendance/web/clock-event → AttendanceResponseDto (Rule A, full).
      queryClient.setQueryData<Attendance>(
        attendanceKeys.byId(attendance.id),
        attendance
      );
      patchAttendanceInLists(queryClient, attendance);
    },
  });
}

export function useApproveAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      approvalStatus,
      remarks,
    }: {
      id: number;
      approvalStatus: 'APPROVED' | 'REJECTED';
      remarks?: string;
    }) => attendanceService.approve(id, approvalStatus, remarks),
    onSuccess: (attendance) => {
      // POST /attendance/web/{id}/approve → AttendanceResponseDto (Rule A, full).
      queryClient.setQueryData<Attendance>(
        attendanceKeys.byId(attendance.id),
        attendance
      );
      patchAttendanceInLists(queryClient, attendance);
    },
  });
}

export function useMarkAbsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      projectId,
      date,
    }: {
      employeeId: number;
      projectId: number;
      date: string;
    }) => attendanceService.markAbsent(employeeId, projectId, date),
    onSuccess: (attendance) => {
      // POST /attendance/web/mark-absent → AttendanceResponseDto (Rule A, full).
      queryClient.setQueryData<Attendance>(
        attendanceKeys.byId(attendance.id),
        attendance
      );
      patchAttendanceInLists(queryClient, attendance);
      // Cross-key: monthly summary absentDays count changes.
      queryClient.invalidateQueries({
        queryKey: [...attendanceKeys.all, 'summary', attendance.employeeId],
      });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attendanceService.deleteAttendance(id),
    onSuccess: (_void, id) => {
      // DELETE /attendance/web/{id} → ApiResponse (Rule C, void).
      const removed = queryClient.getQueryData<Attendance>(
        attendanceKeys.byId(id)
      );
      queryClient.removeQueries({ queryKey: attendanceKeys.byId(id) });
      removeAttendanceFromLists(queryClient, id);
      if (removed) {
        queryClient.invalidateQueries({
          queryKey: [...attendanceKeys.all, 'summary', removed.employeeId],
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: [...attendanceKeys.all, 'summary'],
        });
      }
    },
  });
}
