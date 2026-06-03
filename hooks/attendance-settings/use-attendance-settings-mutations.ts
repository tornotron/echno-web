/**
 * hooks/attendance-settings/use-attendance-settings-mutations.ts
 *
 * React Query mutation hooks for attendance profiles.
 * Shift-timing mutations live in `hooks/shift-timing/`.
 *
 * Cache discipline:
 *   - Profile list mutations patch the profile list cache directly (Rule A).
 *   - Profile mutations also invalidate the org-level and per-project
 *     effective-settings caches because those mirror a subset of the profile
 *     list and need to refetch the canonical resolved settings.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceSettingsService } from '@/services/attendance-settings-service';
import type { AttendanceProfile } from '@/types/attendance';
import { attendanceSettingsKeys } from './attendance-settings-keys';

export function useCreateAttendanceProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attendanceSettingsService.createProfile,
    onSuccess: (profile) => {
      // POST /attendance-settings/web → AttendanceSettingsDto (Rule A, full).
      queryClient.setQueryData<AttendanceProfile[]>(
        attendanceSettingsKeys.profiles(),
        (old) => (old ? [...old, profile] : undefined)
      );
      // Cross-key: a new org-level profile is the resolved org default; a new
      // project-scoped profile may also shadow the org default for the project
      // resolver (the API falls back from project → org). Invalidate the
      // org-level cache unconditionally and the per-project cache when the
      // profile is project-scoped, mirroring useUpdate/useDelete.
      queryClient.invalidateQueries({
        queryKey: attendanceSettingsKeys.orgSettings(),
      });
      if (profile.projectId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: attendanceSettingsKeys.projectSettings(profile.projectId),
        });
      }
    },
  });
}

export function useUpdateAttendanceProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: number;
      dto: Parameters<typeof attendanceSettingsService.updateProfile>[1];
    }) => attendanceSettingsService.updateProfile(id, dto),
    onSuccess: (profile) => {
      // PATCH /attendance-settings/web/{id} → AttendanceSettingsDto (Rule A, full).
      queryClient.setQueryData<AttendanceProfile[]>(
        attendanceSettingsKeys.profiles(),
        (old) => old?.map((p) => (p.id === profile.id ? profile : p))
      );
      // Cross-key: org-level and per-project resolved settings depend on
      // this profile — invalidate so they refetch the canonical view.
      queryClient.invalidateQueries({
        queryKey: attendanceSettingsKeys.orgSettings(),
      });
      if (profile.projectId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: attendanceSettingsKeys.projectSettings(profile.projectId),
        });
      }
    },
  });
}

export function useDeleteAttendanceProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attendanceSettingsService.deleteProfile(id),
    onSuccess: (_void, id) => {
      // DELETE /attendance-settings/web/{id} → no body (Rule C, void).
      const removed = queryClient
        .getQueryData<AttendanceProfile[]>(attendanceSettingsKeys.profiles())
        ?.find((p) => p.id === id);
      queryClient.setQueryData<AttendanceProfile[]>(
        attendanceSettingsKeys.profiles(),
        (old) => old?.filter((p) => p.id !== id)
      );
      // Org/project resolved settings can switch from the deleted override
      // back to the default — invalidate the affected caches.
      queryClient.invalidateQueries({
        queryKey: attendanceSettingsKeys.orgSettings(),
      });
      if (removed?.projectId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: attendanceSettingsKeys.projectSettings(removed.projectId),
        });
      }
    },
  });
}
