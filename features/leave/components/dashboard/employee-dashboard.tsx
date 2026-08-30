/**
 * components/leave/dashboard/employee-dashboard.tsx
 *
 * Dashboard for regular employees focused on personal leave management.
 *
 * Features:
 * - Prominent "Apply for Leave" CTA
 * - Leave balance cards with visual indicators
 * - Recent requests (last 5)
 * - Upcoming approved leave preview
 * - Quick actions for common tasks
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Separator } from '@/components/shadcn/separator';
import {
  Calendar,
  Plus,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { BalanceCard } from '@/features/leave/components/balance-card';
import { Skeleton } from '@/components/shadcn/skeleton';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';
import {
  useEmployeeBalanceSummary,
  useEmployeeRequests,
} from '@/hooks/leave/use-leave';
import { LeaveStatus } from '@/types/leave';
import { formatDayCount } from '@/features/leave/lib/leave-days';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import { format, isFuture } from 'date-fns';
import { routes } from '@/nav';

export function EmployeeDashboard() {
  const router = useRouter();
  const { data: employee } = useCurrentUserEmployee();
  const employeeId = employee?.id || 0;

  const [year] = useState(new Date().getFullYear());

  const { data: balanceSummary, isLoading: balanceLoading } =
    useEmployeeBalanceSummary(employeeId, year);
  const { data: allRequests, isLoading: requestsLoading } =
    useEmployeeRequests(employeeId);

  const isLoading = balanceLoading || requestsLoading;

  // Get recent requests (last 5)
  const recentRequests = allRequests?.slice(0, 5);

  // Calculate stats from all requests (not just recent)
  const pendingRequests =
    allRequests?.filter((r) => r.status === LeaveStatus.PENDING_APPROVAL) || [];
  const approvedRequests =
    allRequests?.filter((r) => r.status === LeaveStatus.APPROVED) || [];
  const upcomingLeave = approvedRequests.filter((r) => isFuture(r.startDate));

  return (
    <div className="space-y-6">
      {/* Personal Stats */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-3 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Available Balance
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatDayCount(balanceSummary?.totalAvailable ?? 0)}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <Calendar className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              days remaining
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pending Requests
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {pendingRequests.length}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting approval
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Upcoming Leave
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                {upcomingLeave.length}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <CheckCircle className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              scheduled {upcomingLeave.length === 1 ? 'request' : 'requests'}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column - Balances & Requests */}
        <div className="space-y-6 lg:col-span-2">
          {/* Leave Balances */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Your Leave Balance</h2>
                <p className="text-muted-foreground text-xs">
                  Available leave by type
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(routes.workforce.leaves.manage.balance)
                }
              >
                View Details
              </Button>
            </div>

            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-1.5 w-full" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                        <div className="space-y-1">
                          <Skeleton className="h-8 w-10" />
                          <Skeleton className="h-3 w-14" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : balanceSummary && balanceSummary.balances.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {balanceSummary.balances.slice(0, 4).map((balance) => (
                  <BalanceCard key={balance.id} balance={balance} compact />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
                  <p className="text-muted-foreground">
                    No leave balance found
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Requests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Recent Requests</h2>
                <p className="text-muted-foreground text-xs">
                  Your last 5 leave requests
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(routes.workforce.leaves.manage.requests.href)
                }
              >
                View All
              </Button>
            </div>

            {isLoading ? (
              <Card>
                <CardContent className="divide-y p-0">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : recentRequests && recentRequests.length > 0 ? (
              <Card>
                <CardContent className="divide-y p-0">
                  {recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
                      onClick={() =>
                        router.push(
                          `${routes.workforce.leaves.manage.requests.detail(request.id).href}?from=employee-dashboard`
                        )
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {request.leaveTypeName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {format(request.startDate, 'MMM dd')} –{' '}
                          {format(request.endDate, 'MMM dd, yyyy')}
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
                  <p className="text-muted-foreground mb-2">
                    No leave requests yet
                  </p>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Start by applying for your first leave
                  </p>
                  <Button
                    onClick={() =>
                      router.push(routes.workforce.leaves.manage.requests.new)
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Apply for Leave
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar - Quick Actions & Summary */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Quick Actions
              </CardTitle>
              <CardDescription className="text-xs">
                Common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(routes.workforce.leaves.manage.requests.new)
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Apply for Leave
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(routes.workforce.leaves.manage.requests.href)
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                My Requests
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(routes.workforce.leaves.manage.balance)
                }
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Balance Details
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(routes.workforce.leaves.manage.calendar)
                }
              >
                <Calendar className="mr-2 h-4 w-4" />
                Leave Calendar
              </Button>
            </CardContent>
          </Card>

          {/* Leave Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Leave Summary {year}
              </CardTitle>
              <CardDescription className="text-xs">
                Your leave usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {balanceSummary ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Available
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {formatDayCount(balanceSummary.totalAvailable)} days
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Used
                      </span>
                      <span className="text-lg font-semibold text-red-600">
                        {formatDayCount(balanceSummary.totalUsed)} days
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Pending
                      </span>
                      <span className="text-lg font-semibold text-yellow-600">
                        {formatDayCount(balanceSummary.totalPending)} days
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-px w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-px w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Leave */}
          {upcomingLeave.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Upcoming Leave
                </CardTitle>
                <CardDescription className="text-xs">
                  Your scheduled time off
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingLeave.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-start justify-between gap-2 rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {request.leaveTypeName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {format(request.startDate, 'MMM dd')} -{' '}
                          {format(request.endDate, 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {request.totalDays}d
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
