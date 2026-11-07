'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useUpdateTask } from '@tornotron/echno-core/task/hooks';
import type { Task } from '@tornotron/echno-core/task/types';
import { toast } from '@/lib/styles/toast-styles';

/**
 * Saves the dates a task's bar was dropped on.
 *
 * The bar keeps its dragged dates in its own state, so a refused change has to
 * put it back explicitly: `barResetKey` moves on when that happens, and the
 * chart remounts its bars from the task's saved dates.
 */
export function useRescheduleTask() {
  const updateTask = useUpdateTask();
  const [barResetKey, setBarResetKey] = useState(0);
  const putBarsBack = () => setBarResetKey((key) => key + 1);

  const rescheduleTask = (task: Task, startAt: Date, endAt: Date | null) => {
    const sameDates =
      startAt.getTime() === task.startDate?.getTime() &&
      endAt?.getTime() === task.endDate?.getTime();
    if (sameDates) return;

    if (endAt && endAt.getTime() < startAt.getTime()) {
      toast.error('Task Not Rescheduled', {
        description: 'The end date cannot be before the start date.',
      });
      putBarsBack();
      return;
    }

    updateTask.mutate(
      {
        id: task.id,
        data: { startDate: startAt, endDate: endAt ?? undefined },
      },
      {
        onSuccess: () => {
          const dates = endAt
            ? `${format(startAt, 'dd MMM yyyy')} to ${format(endAt, 'dd MMM yyyy')}`
            : format(startAt, 'dd MMM yyyy');
          toast.success('Task Rescheduled', {
            description: `${task.title}: ${dates}`,
          });
        },
        onError: (error) => {
          toast.error(getErrorTitle(error, 'Failed to Reschedule Task'), {
            description: getErrorMessage(error),
          });
          putBarsBack();
        },
      }
    );
  };

  return { rescheduleTask, barResetKey };
}
