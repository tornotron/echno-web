'use client';

import type { Attendance } from '@tornotron/echno-core/attendance/types';
import {
  useApproveAttendance,
  useAttendancePendingApprovals,
  useAttendancePendingApprovalsCount,
} from '@tornotron/echno-core/attendance/hooks';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import { PageHeader } from '@/components/common';
import { useAttendanceRole } from '@/hooks/attendance';
import {
  AttendanceApprovalQueue,
  type AttendanceDecision,
} from '@/features/attendance/components/attendance-approval-queue';
import { toast } from '@/lib/styles/toast-styles';

/**
 * The away-from-site days waiting on the signed-in approver.
 *
 * Sited beside the regularizations queue rather than under Workforce, for a
 * reason that is about who reaches it. The organisation-wide leave surface,
 * which is where the equivalent leave queue lives, is gated
 * `MANAGER_AND_ABOVE`. The person holding an attendance decision is frequently
 * a site supervisor or a foreman, because `resolveApprover` walks
 * `employee.manager` first and a reporting manager carries none of
 * system-admin, hr-admin or project-manager. Gating this entry the same way
 * would hide the queue from exactly the people the backend routes the records
 * to, which is the bug echno-web#402 opened on, one layer up.
 *
 * So the route sits under My Attendance, whose entries carry no role gate, and
 * the queue is simply empty for anyone with nothing waiting. The sidebar badge
 * appears only on a non-zero count, so an ordinary employee sees a plain menu
 * entry and never a number.
 */
export default function AttendanceApprovalsPage() {
  const { data: records, isLoading, isError } = useAttendancePendingApprovals();
  const { data: waitingCount } = useAttendancePendingApprovalsCount();
  const { data: viewer } = useCurrentUserEmployee();
  const { canApprove } = useAttendanceRole();
  const approveMutation = useApproveAttendance();

  function handleDecide(record: Attendance, decision: AttendanceDecision) {
    approveMutation.mutate(
      { id: record.id, approvalStatus: decision },
      {
        onSuccess: () =>
          toast.success(
            decision === 'APPROVED'
              ? `Approved ${record.employeeName}'s day`
              : `Rejected ${record.employeeName}'s day`
          ),
        onError: () => toast.error('The decision could not be recorded'),
      }
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Away-From-Site Approvals"
        description="Days an employee marked from outside the site boundary and gave a reason for, waiting on your decision. Your own days are never here: somebody else decides those."
      />

      <AttendanceApprovalQueue
        records={records ?? []}
        waitingCount={waitingCount}
        isLoading={isLoading}
        isError={isError}
        viewer={{ employeeId: viewer?.id, managesRecords: canApprove }}
        onDecide={handleDecide}
        isDeciding={approveMutation.isPending}
      />
    </div>
  );
}
