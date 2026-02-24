/**
 * components/leave/dashboard/manager-dashboard.tsx
 *
 * Dashboard for managers with focus on team approval workflow.
 *
 * Features:
 * - Pending approvals section (prominent)
 * - Quick approve/reject inline actions
 * - Team calendar access
 * - Badge showing pending approval count
 * - Urgent approvals highlighting
 *
 * Note: Managers can switch to Employee dashboard for personal leave management
 */

'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { LeaveRequestCard } from '@/components/leave/leave-request-card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/leave/stat-card';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { useApprovalsForApprover } from '@/hooks/leave/use-approvals-for-approver';

export function ManagerDashboard() {
  const router = useRouter();
  const { data: employee } = useCurrentUserEmployee();
  const employeeId = employee?.id || 0;

  const {
    pendingApprovals,
    urgentApprovals,
    nonUrgentApprovals,
    pendingCount,
    approvalsLoading,
  } = useApprovalsForApprover(employeeId);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          icon={Users}
          label="Pending Approvals"
          value={pendingCount || 0}
          color="yellow"
          description="team requests awaiting your review"
        />
        <StatCard
          icon={AlertCircle}
          label="Urgent Approvals"
          value={urgentApprovals.length}
          color="red"
          description="starting in 3 days or less"
        />
      </div>

      <div className="space-y-6">
        {/* Pending Approvals - Prominent Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                Pending Approvals
                {pendingCount ? (
                  <Badge variant="destructive">{pendingCount}</Badge>
                ) : null}
              </h2>
              <p className="text-muted-foreground text-sm">
                Team leave requests awaiting your review
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push('/users/dashboard/workforce/leaves/approvals')
              }
            >
              View All
            </Button>
          </div>

          {urgentApprovals.length > 0 && (
            <Card className="border-red-500/50 bg-red-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-base text-red-600">
                    Urgent: Starting Soon
                  </CardTitle>
                </div>
                <CardDescription>
                  These requests start in 3 days or less
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {urgentApprovals.slice(0, 2).map((request) => (
                  <LeaveRequestCard
                    key={request.id}
                    request={request}
                    from="manager-dashboard"
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {approvalsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingApprovals && pendingApprovals.length > 0 ? (
            <div className="space-y-4">
              {nonUrgentApprovals.slice(0, 5).map((request) => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  from="manager-dashboard"
                />
              ))}
              {nonUrgentApprovals.length === 0 &&
                urgentApprovals.length > 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <CheckCircle className="mb-3 h-10 w-10 text-green-500" />
                      <p className="text-muted-foreground text-sm">
                        All other approvals are shown above
                      </p>
                    </CardContent>
                  </Card>
                )}
              {pendingApprovals.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push('/users/dashboard/workforce/leaves/approvals')
                  }
                >
                  View All {pendingCount} Pending Approvals
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
                <p className="mb-1 font-medium text-green-600">
                  All caught up!
                </p>
                <p className="text-muted-foreground text-sm">
                  No pending approvals at the moment
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Team Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>Quick access to team features</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() =>
                router.push('/users/dashboard/workforce/leaves/approvals')
              }
            >
              <Users className="mr-2 h-4 w-4" />
              All Approvals
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() =>
                router.push('/users/dashboard/workforce/leaves/calendar')
              }
            >
              <Calendar className="mr-2 h-4 w-4" />
              Team Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
