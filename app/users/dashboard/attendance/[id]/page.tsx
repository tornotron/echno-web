'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent } from '@/components/shadcn/card';
import { PageHeader } from '@/components/common';
import { CheckCircle, AlertTriangle, Download, History } from 'lucide-react';
import { useAttendanceById, useApproveAttendance } from '@/hooks/attendance';
import { useAttendanceRole } from '@/hooks/attendance';
import { MovementManagement } from '@/features/attendance/components/movement-management';
import {
  AttendanceEmployeeInfoCard,
  AttendanceWorkDurationCard,
  AttendanceClockEventsCard,
  AttendanceRegularizationCard,
  AttendanceShiftCard,
  AttendanceDailyMovementsCard,
  AttendanceStatusIndicatorsCard,
  AttendanceApprovalInfoCard,
  AttendanceMetadataCard,
} from '@/features/attendance/components';
import { toast } from '@/lib/styles/toast-styles';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AttendanceDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const attendanceId = Number.parseInt(id);

  const router = useRouter();
  const {
    data: attendance,
    isLoading,
    error,
  } = useAttendanceById(attendanceId);
  const { canApprove, canViewTeamAttendance } = useAttendanceRole();
  const approveMutation = useApproveAttendance();

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading attendance record…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !attendance) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Attendance record not found
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              The attendance record you&apos;re looking for doesn&apos;t exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function handleApprove() {
    approveMutation.mutate(
      { id: attendance!.id, approvalStatus: 'APPROVED' },
      {
        onSuccess: () => toast.success('Attendance approved'),
        onError: () => toast.error('Failed to approve attendance'),
      }
    );
  }

  function handleReject() {
    approveMutation.mutate(
      { id: attendance!.id, approvalStatus: 'REJECTED' },
      {
        onSuccess: () => toast.success('Attendance rejected'),
        onError: () => toast.error('Failed to reject attendance'),
      }
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Attendance Details"
        description={format(attendance.date, 'EEEE, MMMM d, yyyy')}
        actions={
          <>
            {canViewTeamAttendance && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/users/dashboard/attendance/history?tab=team&search=${encodeURIComponent(attendance.employeeName)}`
                  )
                }
              >
                <History className="mr-2 h-4 w-4" />
                Employee History
              </Button>
            )}
            {canApprove && attendance.approvalStatus === 'pending' && (
              <>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                  onClick={handleReject}
                  disabled={approveMutation.isPending}
                >
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <AttendanceEmployeeInfoCard attendance={attendance} />
          <AttendanceWorkDurationCard attendance={attendance} />
          <AttendanceClockEventsCard attendance={attendance} />
          <AttendanceRegularizationCard attendance={attendance} />
          <MovementManagement
            attendanceId={attendance.id}
            employeeId={attendance.employeeId}
            canLog
          />
          {attendance.remarks && (
            <Card>
              <CardContent className="pt-6">
                <p className="mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Additional Remarks
                </p>
                <p className="text-zinc-700 dark:text-zinc-300">
                  {attendance.remarks}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AttendanceShiftCard attendance={attendance} />
          <AttendanceDailyMovementsCard attendance={attendance} />
          <AttendanceStatusIndicatorsCard attendance={attendance} />
          <AttendanceApprovalInfoCard attendance={attendance} />
          <AttendanceMetadataCard attendance={attendance} />
        </div>
      </div>
    </div>
  );
}
