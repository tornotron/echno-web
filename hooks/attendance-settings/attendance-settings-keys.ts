/**
 * hooks/attendance-settings/attendance-settings-keys.ts
 *
 * React Query key factory for attendance profile + effective-settings queries.
 * Shift-timing keys live in `hooks/shift-timing/shift-timing-keys.ts`.
 */

export const attendanceSettingsKeys = {
  all: ['attendance-settings'] as const,

  profiles: () => [...attendanceSettingsKeys.all, 'profiles'] as const,

  orgSettings: () => [...attendanceSettingsKeys.all, 'org'] as const,

  projectSettings: (projectId: number) =>
    [...attendanceSettingsKeys.all, 'project', projectId] as const,
};
