'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import type { Attendance } from '@/types/attendance';
import { format } from 'date-fns';

interface Props {
  attendance: Attendance;
}

export function AttendanceApprovalInfoCard({ attendance }: Props) {
  if (!attendance.approvedBy || !attendance.approvedAt) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Approved By
          </p>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {attendance.approvedBy}
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Approved At
          </p>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {format(attendance.approvedAt, 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {format(attendance.approvedAt, 'h:mm a')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
