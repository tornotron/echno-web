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
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';
import { Skeleton } from '@/components/shadcn/skeleton';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import { useApprovalsForApprover } from '@/hooks/leave/use-approvals-for-approver';
import { format } from 'date-fns';
import { routes } from '@/nav';

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
      {/* Team Approval Stats */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pending Approvals
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {pendingCount || 0}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <Users className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              team requests awaiting review
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Urgent Approvals
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                {urgentApprovals.length}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              starting in 3 days or less
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {/* Pending Approvals - Prominent Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                Pending Approvals
                {pendingCount ? (
                  <Badge variant="destructive">{pendingCount}</Badge>
                ) : null}
              </h2>
              <p className="text-muted-foreground text-xs">
                Team leave requests awaiting your review
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  `${routes.workforce.leaves.manage.requests.href}?tab=approvals`
                )
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
                  <CardTitle className="text-sm font-semibold text-red-600">
                    Urgent: Starting Soon
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  These requests start in 3 days or less
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {urgentApprovals.slice(0, 2).map((request) => (
                  <div
                    key={request.id}
                    className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
                    onClick={() =>
                      router.push(
                        `${routes.workforce.leaves.manage.requests.detail(request.id).href}?from=manager-dashboard`
                      )
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {request.employeeName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {request.leaveTypeName} ·{' '}
                        {format(new Date(request.startDate), 'MMM dd')} –{' '}
                        {format(new Date(request.endDate), 'MMM dd, yyyy')}
                        <span className="ml-2 font-medium">
                          {request.totalDays}d
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <LeaveStatusBadge status={request.status} />
                      <ChevronRight className="text-muted-foreground size-3.5" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {approvalsLoading ? (
            <Card>
              <CardContent className="divide-y p-0">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : pendingApprovals && pendingApprovals.length > 0 ? (
            <div className="space-y-4">
              {nonUrgentApprovals.length > 0 && (
                <Card>
                  <CardContent className="divide-y p-0">
                    {nonUrgentApprovals.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
                        onClick={() =>
                          router.push(
                            `${routes.workforce.leaves.manage.requests.detail(request.id).href}?from=manager-dashboard`
                          )
                        }
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {request.employeeName}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {request.leaveTypeName} ·{' '}
                            {format(new Date(request.startDate), 'MMM dd')} –{' '}
                            {format(new Date(request.endDate), 'MMM dd, yyyy')}
                            <span className="ml-2 font-medium">
                              {request.totalDays}d
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <LeaveStatusBadge status={request.status} />
                          <ChevronRight className="text-muted-foreground size-3.5" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
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
                    router.push(
                      `${routes.workforce.leaves.manage.requests.href}?tab=approvals`
                    )
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
            <CardTitle className="text-sm font-semibold">
              Team Management
            </CardTitle>
            <CardDescription className="text-xs">
              Quick access to team features
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() =>
                router.push(
                  `${routes.workforce.leaves.manage.requests.href}?tab=approvals`
                )
              }
            >
              <Users className="mr-2 h-4 w-4" />
              All Approvals
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() =>
                router.push(routes.workforce.leaves.manage.calendar)
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
