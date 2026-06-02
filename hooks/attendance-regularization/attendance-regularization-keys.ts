/**
 * hooks/attendance-regularization/attendance-regularization-keys.ts
 *
 * React Query key factory for attendance-regularization queries.
 */

export const attendanceRegularizationKeys = {
  all: ['attendance-regularizations'] as const,

  pending: () => [...attendanceRegularizationKeys.all, 'pending'] as const,

  detail: (id: number) =>
    [...attendanceRegularizationKeys.all, 'detail', id] as const,
};
