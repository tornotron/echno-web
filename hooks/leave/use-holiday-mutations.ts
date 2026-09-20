/**
 * hooks/leave/use-holiday-mutations.ts
 *
 * Holiday-calendar mutations with the toast feedback the admin page shows.
 * Same shape as the core hooks, plus the toasts; every one invalidates the
 * holidays prefix so the year view and the working week refetch together.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysService } from '@tornotron/echno-core/holidays/services';
import { holidaysKeys } from '@tornotron/echno-core/holidays/hooks/keys';
import type {
  HolidayRequest,
  WorkingWeekRequest,
} from '@tornotron/echno-core/holidays/types';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorTitle, getErrorMessage } from '@tornotron/echno-core';

function useInvalidateHolidays() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: holidaysKeys.all });
}

export const useCreateHoliday = () => {
  const invalidate = useInvalidateHolidays();
  return useMutation({
    mutationFn: (req: HolidayRequest) => holidaysService.create(req),
    onSuccess: (holiday) => {
      invalidate();
      toast.success('Holiday Declared', {
        description: `${holiday.name} on ${holiday.holidayDateIso} is now on the calendar.`,
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Declare Holiday'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useUpdateHoliday = () => {
  const invalidate = useInvalidateHolidays();
  return useMutation({
    mutationFn: ({
      holidayId,
      data,
    }: {
      holidayId: number;
      data: HolidayRequest;
    }) => holidaysService.update(holidayId, data),
    onSuccess: () => {
      invalidate();
      toast.success('Holiday Updated', {
        description: 'The holiday has been changed.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Update Holiday'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useDeleteHoliday = () => {
  const invalidate = useInvalidateHolidays();
  return useMutation({
    mutationFn: (holidayId: number) => holidaysService.remove(holidayId),
    onSuccess: () => {
      invalidate();
      toast.success('Holiday Removed', {
        description: 'The holiday has been taken off the calendar.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Remove Holiday'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useUpdateWorkingWeek = () => {
  const invalidate = useInvalidateHolidays();
  return useMutation({
    mutationFn: (req: WorkingWeekRequest) =>
      holidaysService.updateWorkingWeek(req),
    onSuccess: () => {
      invalidate();
      toast.success('Working Week Saved', {
        description: 'Leave requests will now use the new working days.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Save Working Week'), {
        description: getErrorMessage(err),
      }),
  });
};
