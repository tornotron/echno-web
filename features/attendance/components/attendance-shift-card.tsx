'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import type { Attendance } from '@/types/attendance';

interface Props {
  attendance: Attendance;
}

export function AttendanceShiftCard({ attendance }: Props) {
  const { shiftTiming } = attendance;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Shift Name</p>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {shiftTiming.shiftName}
          </p>
        </div>

        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Start Time
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {shiftTiming.startTime}
            </span>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              End Time
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {shiftTiming.endTime}
            </span>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Lunch Break
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {shiftTiming.lunchBreakStart} – {shiftTiming.lunchBreakEnd}
            </span>
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Grace Period
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {shiftTiming.gracePeriodMinutes} min
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Min Work Hours
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {shiftTiming.minimumWorkHours}h
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
