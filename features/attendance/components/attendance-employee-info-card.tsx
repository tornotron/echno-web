'use client';

import { Badge } from '@/components/shadcn/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import Link from 'next/link';
import { User, Building } from 'lucide-react';
import { routes } from '@/nav';
import { employeeFilterHref } from '@/hooks/use-employee-filter';
import {
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
} from '@tornotron/echno-core/attendance/types';
import type { Attendance } from '@tornotron/echno-core/attendance/types';

interface Props {
  attendance: Attendance;
}

const statusColorMap: Record<string, string> = {
  green: 'border-green-500 text-green-700 dark:text-green-400',
  red: 'border-red-500 text-red-700 dark:text-red-400',
  orange: 'border-orange-500 text-orange-700 dark:text-orange-400',
  yellow: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
  teal: 'border-teal-500 text-teal-700 dark:text-teal-400',
  amber: 'border-amber-500 text-amber-700 dark:text-amber-400',
};

export function AttendanceEmployeeInfoCard({ attendance }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee &amp; Project Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Employee
              </p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {/*
                  An employee id: `Attendance.employeeId` names the employee the
                  record belongs to, not a session user. The team history is the
                  destination rather than the attendance list, because that list
                  is server-paged on one project and one date, so it cannot
                  answer "every day this person worked".
                */}
                <Link
                  href={employeeFilterHref(
                    `${routes.attendance.history}?tab=team`,
                    attendance.employeeId,
                    'employee'
                  )}
                  className="hover:underline"
                >
                  {attendance.employeeName}
                </Link>
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                {attendance.employeeId}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Project
              </p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {attendance.projectName}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                ID: {attendance.projectId}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                Attendance Status
              </p>
              <Badge
                variant="outline"
                className={
                  statusColorMap[getAttendanceStatusColor(attendance.status)] ||
                  'border-zinc-500 text-zinc-700 dark:text-zinc-400'
                }
              >
                {getAttendanceStatusLabel(attendance.status)}
              </Badge>
            </div>
            <div className="text-right">
              <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                Approval Status
              </p>
              <Badge
                variant={
                  ({
                    approved: 'default',
                    rejected: 'destructive',
                    pending: 'outline',
                  }[attendance.approvalStatus] || 'outline') as
                    | 'default'
                    | 'destructive'
                    | 'outline'
                }
              >
                {attendance.approvalStatus.charAt(0).toUpperCase() +
                  attendance.approvalStatus.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
