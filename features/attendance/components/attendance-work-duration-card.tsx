'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Clock, Coffee } from 'lucide-react';
import type { Attendance } from '@tornotron/echno-core/attendance/types';

interface Props {
  attendance: Attendance;
}

export function AttendanceWorkDurationCard({ attendance }: Props) {
  const { workDuration } = attendance;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Duration Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
            <Clock className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {workDuration.hours}h {workDuration.minutes}m
            </p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Total Hours
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
            <Clock className="mx-auto mb-2 h-6 w-6 text-green-600 dark:text-green-400" />
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {Math.floor(workDuration.morningSession / 60)}h{' '}
              {workDuration.morningSession % 60}m
            </p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Morning
            </p>
          </div>

          <div className="rounded-lg bg-purple-50 p-4 text-center dark:bg-purple-900/20">
            <Clock className="mx-auto mb-2 h-6 w-6 text-purple-600 dark:text-purple-400" />
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {Math.floor(workDuration.afternoonSession / 60)}h{' '}
              {workDuration.afternoonSession % 60}m
            </p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Afternoon
            </p>
          </div>

          <div className="rounded-lg bg-orange-50 p-4 text-center dark:bg-orange-900/20">
            <Coffee className="mx-auto mb-2 h-6 w-6 text-orange-600 dark:text-orange-400" />
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {Math.floor(workDuration.breakDuration / 60)}h{' '}
              {workDuration.breakDuration % 60}m
            </p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Break Time
            </p>
          </div>
        </div>

        {attendance.isOvertime && (
          <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-teal-900 dark:text-teal-100">
                  Overtime Detected
                </p>
                <p className="mt-1 text-sm text-teal-700 dark:text-teal-300">
                  Employee worked beyond standard hours
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  +{Math.floor(workDuration.overtimeMinutes / 60)}h{' '}
                  {workDuration.overtimeMinutes % 60}m
                </p>
                <p className="text-xs text-teal-600 dark:text-teal-400">
                  Overtime Hours
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
