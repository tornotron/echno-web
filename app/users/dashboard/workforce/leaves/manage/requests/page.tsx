'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Card } from '@/components/shadcn/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { PageHeader, OrgGuard } from '@/components/common';
import {
  MyRequestsTab,
  ApprovalsTab,
  AllRequestsTab,
} from '@/features/leave/components/leave-requests-tabs';
import {
  usePendingApprovalsCount,
  useOrganizationRequests,
  useEmployeeRequests,
} from '@/hooks/leave/use-leave';
import { useLeaveRole } from '@/hooks/leave/use-leave-role';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { LeaveStatus } from '@/types/leave';
import { FileText, Clock, Calendar, AlertCircle, Plus } from 'lucide-react';

const BASE = '/users/dashboard/workforce/leaves/manage';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canApprove, canViewAllRequests } = useLeaveRole();
  const { data: employee, isLoading: employeeLoading } =
    useCurrentUserEmployee();
  const employeeId = employee?.id || 0;
  const { data: pendingCount } = usePendingApprovalsCount(employeeId);

  const { data: orgRequests } = useOrganizationRequests();
  const { data: myRequests } = useEmployeeRequests(employeeId);

  const statsRequests = canViewAllRequests
    ? (orgRequests ?? [])
    : (myRequests ?? []);

  const stats = useMemo(
    () => ({
      total: statsRequests.length,
      pending: statsRequests.filter(
        (r) => r.status === LeaveStatus.PENDING_APPROVAL
      ).length,
      approved: statsRequests.filter((r) => r.status === LeaveStatus.APPROVED)
        .length,
      rejected: statsRequests.filter((r) => r.status === LeaveStatus.REJECTED)
        .length,
    }),
    [statsRequests]
  );

  const tab = searchParams.get('tab') ?? 'my';

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <OrgGuard
      isLoading={employeeLoading}
      error={null}
      organizationId={employee?.organizationId}
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Leave Requests"
            description="Manage and review leave requests"
          />
          <Button onClick={() => router.push(`${BASE}/requests/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>

        <Card className="gap-0 p-6">
          <div className="sm:divide-border grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
            <div className="flex flex-col gap-1 sm:pr-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {stats.total}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:px-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pending
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {stats.pending}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                  <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:px-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Approved
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {stats.approved}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                  <Calendar className="size-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:px-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Rejected
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                  {stats.rejected}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                  <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="my">My Requests</TabsTrigger>
            {canApprove && (
              <TabsTrigger value="approvals" className="gap-2">
                Approvals
                {(pendingCount ?? 0) > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {canViewAllRequests && (
              <TabsTrigger value="all">All Requests</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="my" className="mt-4">
            <MyRequestsTab employeeId={employeeId} />
          </TabsContent>

          {canApprove && (
            <TabsContent value="approvals" className="mt-4">
              <ApprovalsTab employeeId={employeeId} />
            </TabsContent>
          )}

          {canViewAllRequests && (
            <TabsContent value="all" className="mt-4">
              <AllRequestsTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </OrgGuard>
  );
}
