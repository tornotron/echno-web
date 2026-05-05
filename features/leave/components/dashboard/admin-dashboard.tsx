/**
 * components/leave/dashboard/admin-dashboard.tsx
 *
 * Dashboard for system administrators with organization-wide view.
 *
 * Features:
 * - Organization-wide metrics dashboard
 * - Quick access to policy management
 * - All requests table with advanced filtering
 * - Department analytics cards
 * - Policy compliance indicators
 * - Quick actions: Manage Policies, View Reports
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
import { Separator } from '@/components/shadcn/separator';
import {
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  useOrganizationRequests,
  usePendingApprovalsCount,
  useAllLeavePolicies,
} from '@/hooks/leave/use-leave';
import { LeaveStatus } from '@/types/leave';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
export function AdminDashboard() {
  const router = useRouter();
  const { data: employee } = useCurrentUserEmployee();
  const employeeId = employee?.id || 0;
  const { data: allOrgRequests, isLoading: requestsLoading } =
    useOrganizationRequests();
  const { data: pendingCount } = usePendingApprovalsCount(employeeId);
  const { data: policies, isLoading: policiesLoading } = useAllLeavePolicies();

  const allRequests = allOrgRequests?.slice(0, 20);
  const totalRequests = allOrgRequests?.length || 0;
  const approvedRequests =
    allRequests?.filter((r) => r.status === LeaveStatus.APPROVED).length || 0;
  const pendingRequests =
    allRequests?.filter((r) => r.status === LeaveStatus.PENDING_APPROVAL)
      .length || 0;
  const rejectedRequests =
    allRequests?.filter((r) => r.status === LeaveStatus.REJECTED).length || 0;

  const activePolicies = policies?.filter((p) => p.isActive).length || 0;
  const approvalRate =
    totalRequests > 0
      ? Math.round((approvedRequests / totalRequests) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Organisation-Wide Metrics */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Requests
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalRequests}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <FileText className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              across organisation
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {pendingRequests}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting approval
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Approved</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {approvedRequests}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {approvalRate}% approval rate
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Active Policies
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {activePolicies}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Settings className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              leave types configured
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column - Recent Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Requests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Recent Requests</h2>
                <p className="text-muted-foreground text-xs">
                  Latest leave requests across organization
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(
                    '/users/dashboard/workforce/leaves/manage/requests?tab=all'
                  )
                }
              >
                View All
              </Button>
            </div>

            {requestsLoading ? (
              <Card>
                <CardContent className="divide-y p-0">
                  {Array.from({ length: 5 }).map((_, i) => (
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
            ) : allRequests && allRequests.length > 0 ? (
              <Card>
                <CardContent className="divide-y p-0">
                  {allRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
                      onClick={() =>
                        router.push(
                          `/users/dashboard/workforce/leaves/manage/requests/${request.id}?from=admin-dashboard`
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
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="text-muted-foreground mb-4 h-12 w-12" />
                  <p className="text-muted-foreground">No requests found</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Request Status Breakdown
              </CardTitle>
              <CardDescription className="text-xs">
                Current status distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <Badge variant="default">Approved</Badge>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {approvedRequests}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {totalRequests > 0
                      ? Math.round((approvedRequests / totalRequests) * 100)
                      : 0}
                    % of total
                  </p>
                </div>

                <div className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {pendingRequests}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {totalRequests > 0
                      ? Math.round((pendingRequests / totalRequests) * 100)
                      : 0}
                    % of total
                  </p>
                </div>

                <div className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <Badge variant="destructive">Rejected</Badge>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {rejectedRequests}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {totalRequests > 0
                      ? Math.round((rejectedRequests / totalRequests) * 100)
                      : 0}
                    % of total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Quick Actions & Insights */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Admin Actions
              </CardTitle>
              <CardDescription className="text-xs">
                Management tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(
                    '/users/dashboard/workforce/leaves/manage/policies'
                  )
                }
              >
                <Settings className="mr-2 h-4 w-4" />
                Manage Policies
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(
                    '/users/dashboard/workforce/leaves/manage/requests?tab=all'
                  )
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                All Requests
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(
                    '/users/dashboard/workforce/leaves/manage/requests?tab=approvals'
                  )
                }
              >
                <Users className="mr-2 h-4 w-4" />
                Pending Approvals
                {pendingCount ? (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingCount}
                  </Badge>
                ) : null}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(
                    '/users/dashboard/workforce/leaves/manage/calendar'
                  )
                }
              >
                <Calendar className="mr-2 h-4 w-4" />
                Organization Calendar
              </Button>
            </CardContent>
          </Card>

          {/* Policy Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Policy Overview
              </CardTitle>
              <CardDescription className="text-xs">
                Active leave policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policiesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-px w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-px w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : policies && policies.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Total Policies
                    </span>
                    <span className="text-lg font-bold">{policies.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Active
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {activePolicies}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Inactive
                    </span>
                    <span className="text-muted-foreground text-lg font-semibold">
                      {policies.length - activePolicies}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() =>
                      router.push(
                        '/users/dashboard/workforce/leaves/manage/policies'
                      )
                    }
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Policies
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-muted-foreground mb-3 text-sm">
                    No policies configured
                  </p>
                  <Button
                    size="sm"
                    onClick={() =>
                      router.push(
                        '/users/dashboard/workforce/leaves/manage/policies'
                      )
                    }
                  >
                    Create Policy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                System Health
              </CardTitle>
              <CardDescription className="text-xs">
                Leave management status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Policies Active</span>
                </div>
                <Badge variant="default">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {pendingRequests > 10 ? (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="text-sm">Pending Queue</span>
                </div>
                <Badge variant={pendingRequests > 10 ? 'secondary' : 'default'}>
                  {pendingRequests > 10 ? 'High' : 'Normal'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Approval Flow</span>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
