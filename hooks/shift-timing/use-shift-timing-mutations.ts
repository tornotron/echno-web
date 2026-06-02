/**
 * hooks/shift-timing/use-shift-timing-mutations.ts
 *
 * React Query mutation hooks for shift timings. List cache is patched
 * directly when the backend returns the full DTO (Rule A).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftTimingService } from '@/services/shift-timing-service';
import type { ShiftTiming } from '@/types/shift-timing';
import { shiftTimingKeys } from './shift-timing-keys';

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shiftTimingService.create,
    onSuccess: (shift) => {
      queryClient.setQueryData<ShiftTiming[]>(shiftTimingKeys.lists(), (old) =>
        old ? [...old, shift] : undefined
      );
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: number;
      dto: Parameters<typeof shiftTimingService.update>[1];
    }) => shiftTimingService.update(id, dto),
    onSuccess: (shift) => {
      queryClient.setQueryData<ShiftTiming[]>(shiftTimingKeys.lists(), (old) =>
        old?.map((s) => (s.id === shift.id ? shift : s))
      );
      queryClient.setQueryData<ShiftTiming>(
        shiftTimingKeys.detail(shift.id),
        shift
      );
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => shiftTimingService.delete(id),
    onSuccess: (_void, id) => {
      queryClient.setQueryData<ShiftTiming[]>(shiftTimingKeys.lists(), (old) =>
        old?.filter((s) => s.id !== id)
      );
      queryClient.removeQueries({ queryKey: shiftTimingKeys.detail(id) });
    },
  });
}
