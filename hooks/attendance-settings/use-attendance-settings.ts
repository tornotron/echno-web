/**
 * hooks/attendance-settings/use-attendance-settings.ts
 *
 * React Query query hooks for attendance profiles + effective settings.
 * Shift-timing hooks live in `hooks/shift-timing/`.
 */

import { useQuery } from '@tanstack/react-query';
import { attendanceSettingsService } from '@/services/attendance-settings-service';
import { attendanceSettingsKeys } from './attendance-settings-keys';

// ─── Attendance Profiles ──────────────────────────────────────────────────────

export function useAttendanceProfiles() {
  return useQuery({
    queryKey: attendanceSettingsKeys.profiles(),
    queryFn: () => attendanceSettingsService.getProfiles(),
  });
}

// ─── Effective settings ───────────────────────────────────────────────────────

export function useOrgSettings() {
  return useQuery({
    queryKey: attendanceSettingsKeys.orgSettings(),
    queryFn: () => attendanceSettingsService.getOrgSettings(),
  });
}

export function useProjectSettings(projectId: number | undefined) {
  return useQuery({
    queryKey: attendanceSettingsKeys.projectSettings(projectId ?? 0),
    queryFn: () => attendanceSettingsService.getSettingsByProject(projectId!),
    enabled: projectId !== undefined && projectId > 0,
  });
}

export { attendanceSettingsKeys } from './attendance-settings-keys';
