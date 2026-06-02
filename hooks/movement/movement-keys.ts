/**
 * hooks/movement/movement-keys.ts
 *
 * React Query key factory for movement-record queries.
 */

export const movementKeys = {
  all: ['movements'] as const,

  byAttendance: (attendanceId: number) =>
    [...movementKeys.all, 'attendance', attendanceId] as const,

  detail: (id: number) => [...movementKeys.all, 'detail', id] as const,
};
