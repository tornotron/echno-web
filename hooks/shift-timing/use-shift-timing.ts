/**
 * hooks/shift-timing/use-shift-timing.ts
 *
 * React Query query hooks for shift timings.
 */

import { useQuery } from '@tanstack/react-query';
import { shiftTimingService } from '@/services/shift-timing-service';
import { shiftTimingKeys } from './shift-timing-keys';

export function useShifts() {
  return useQuery({
    queryKey: shiftTimingKeys.lists(),
    queryFn: () => shiftTimingService.getAll(),
  });
}

export function useShift(id: number | undefined) {
  return useQuery({
    queryKey: shiftTimingKeys.detail(id ?? 0),
    queryFn: () => shiftTimingService.getById(id!),
    enabled: id !== undefined && id > 0,
  });
}

export { shiftTimingKeys } from './shift-timing-keys';
