'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Attendance } from '@/types/attendance';

interface Props {
  attendance: Attendance;
}

export function AttendanceStatusIndicatorsCard({ attendance }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Indicators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Late Arrival
          </span>
          <Badge
            variant="outline"
            className={
              attendance.isLateArrival
                ? 'border-orange-500 text-orange-700 dark:text-orange-400'
                : 'border-green-500 text-green-700 dark:text-green-400'
            }
          >
            {attendance.isLateArrival ? 'Yes' : 'No'}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Early Checkout
          </span>
          <Badge
            variant="outline"
            className={
              attendance.isEarlyCheckout
                ? 'border-orange-500 text-orange-700 dark:text-orange-400'
                : 'border-green-500 text-green-700 dark:text-green-400'
            }
          >
            {attendance.isEarlyCheckout ? 'Yes' : 'No'}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Overtime
          </span>
          <Badge
            variant="outline"
            className={
              attendance.isOvertime
                ? 'border-teal-500 text-teal-700 dark:text-teal-400'
                : 'border-zinc-500 text-zinc-700 dark:text-zinc-400'
            }
          >
            {attendance.isOvertime ? 'Yes' : 'No'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
