'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Attendance } from '@/types/attendance';
import { format } from 'date-fns';

interface Props {
  attendance: Attendance;
}

export function AttendanceMetadataCard({ attendance }: Props) {
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
      </CardContent>
    </Card>
  );
}
