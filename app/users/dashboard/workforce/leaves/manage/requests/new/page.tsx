'use client';

import { useSearchParams } from 'next/navigation';
import {
  useLeavePoliciesByEmployee,
  useEmployeeBalanceSummary,
  useEmployeeRequests,
} from '@/hooks/leave/use-leave';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { OrgGuard } from '@/components/common';
import { LeaveApplyForm } from '@/features/leave/components/leave-apply-form';

export default function NewLeaveRequestPage() {
  const searchParams = useSearchParams();
  const editRequestId = searchParams.get('edit');
  const isEditMode = !!editRequestId;

  const { data: employee, isLoading: employeeLoading } =
    useCurrentUserEmployee();
  const employeeId = employee?.id;

  const { data: policies, isLoading: policiesLoading } =
    useLeavePoliciesByEmployee(employeeId || 0);
  const { data: balanceSummary } = useEmployeeBalanceSummary(employeeId || 0);
  const { data: employeeRequests, isLoading: requestsLoading } =
    useEmployeeRequests(employeeId || 0);

  const existingRequest = isEditMode
    ? employeeRequests?.find((r) => r.id === Number.parseInt(editRequestId!))
    : undefined;

  const requestLoading = isEditMode && (requestsLoading || !employeeId);

  return (
    <OrgGuard
      isLoading={
        employeeLoading || policiesLoading || (isEditMode && requestLoading)
      }
      error={null}
      organizationId={employee?.organizationId}
    >
      {isEditMode && !existingRequest ? (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">Leave request not found</p>
            <p className="text-muted-foreground mt-2 text-sm">
              The leave request you&apos;re trying to edit could not be found
            </p>
          </div>
        </div>
      ) : (
        <LeaveApplyForm
          employeeId={employeeId!}
          policies={policies || []}
          balanceSummary={balanceSummary}
          existingRequest={existingRequest}
          isEditMode={isEditMode}
          editRequestId={editRequestId}
        />
      )}
    </OrgGuard>
  );
}
