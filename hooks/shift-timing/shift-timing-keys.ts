/**
 * hooks/shift-timing/shift-timing-keys.ts
 *
 * React Query key factory for shift-timing queries.
 */

export const shiftTimingKeys = {
  all: ['shift-timings'] as const,

  lists: () => [...shiftTimingKeys.all, 'list'] as const,

  detail: (id: number) => [...shiftTimingKeys.all, 'detail', id] as const,
};
