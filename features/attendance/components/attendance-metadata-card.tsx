'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  getClockEventLabel,
  type Attendance,
} from '@tornotron/echno-core/attendance/types';
import { format } from 'date-fns';
import {
  describeMarkedBy,
  describeMarkedFrom,
  supervisorMarkedEvents,
} from '../lib/marked-by';

interface Props {
  attendance: Attendance;
}

export function AttendanceMetadataCard({ attendance }: Props) {
  const markedBySupervisor = supervisorMarkedEvents(attendance);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Created At</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {format(attendance.createdAt, 'MMM d, yyyy h:mm a')}
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Last Updated
          </p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {format(attendance.updatedAt, 'MMM d, yyyy h:mm a')}
          </p>
        </div>

        {markedBySupervisor.length > 0 && (
          <div data-testid="marked-by">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Marked on behalf of the employee
            </p>
            <ul className="mt-1 space-y-1">
              {markedBySupervisor.map((event) => (
                <li
                  key={event.id}
                  className="text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <span className="font-medium">
                    {getClockEventLabel(event.eventType)}
                  </span>
                  : {describeMarkedBy(event)}
                  {describeMarkedFrom(event) && (
                    <span className="block font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      from {describeMarkedFrom(event)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
