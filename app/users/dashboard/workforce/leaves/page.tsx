'use client';

import { useRouter } from 'next/navigation';
import { OrgGuard, PageHeader } from '@/components/common';
import { useCurrentUserEmployee } from '@/hooks/employee';
import {
  useOrganizationRequests,
  useAllLeavePolicies,
} from '@/hooks/leave/use-leave';
import { LeaveOverview } from '@/features/leave/components/leave-overview';
import { LeaveCharts } from '@/features/leave/components/leave-charts';
import { Button } from '@/components/shadcn/button';
import { LayoutDashboard } from 'lucide-react';

export default function LeaveOverviewPage() {
  const router = useRouter();
  const { data: employee, isLoading: employeeLoading } =
    useCurrentUserEmployee();
  const {
    data: orgRequests,
    isLoading: requestsLoading,
    error,
  } = useOrganizationRequests();
  const { data: policies } = useAllLeavePolicies();

  return (
    <OrgGuard
      isLoading={employeeLoading || requestsLoading}
      error={error}
      organizationId={employee?.organizationId}
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Leave Overview"
            description="Organisation-wide leave analytics and upcoming schedules"
          />
          <Button
            onClick={() =>
              router.push('/users/dashboard/workforce/leaves/manage')
            }
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Leave Dashboard
          </Button>
        </div>
        <LeaveOverview requests={orgRequests ?? []} policies={policies ?? []} />
        <LeaveCharts requests={orgRequests ?? []} />
      </div>
    </OrgGuard>
  );
}
