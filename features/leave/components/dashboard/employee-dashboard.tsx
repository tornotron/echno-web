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
} from 'lucide-react';
import { BalanceCard } from '@/features/leave/components/balance-card';
import { StatCard } from '@/features/leave/components/stat-card';
import { Skeleton } from '@/components/shadcn/skeleton';
import { LeaveRequestCard } from '@/features/leave/components/leave-request-card';
import {
  useEmployeeBalanceSummary,
  useEmployeeRequests,
} from '@/hooks/leave/use-leave';
import { LeaveStatus } from '@/types/leave';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { format, isFuture } from 'date-fns';

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
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Calendar}
          label="Available Balance"
          value={balanceSummary?.totalAvailable || 0}
          color="green"
          description="days remaining"
        />
        <StatCard
          icon={Clock}
          label="Pending Requests"
          value={pendingRequests.length}
          color="yellow"
          description="awaiting approval"
        />
        <StatCard
          icon={CheckCircle}
          label="Upcoming Leave"
          value={upcomingLeave.length}
          color="blue"
          description={`scheduled ${upcomingLeave.length === 1 ? 'request' : 'requests'}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column - Balances & Requests */}
        <div className="space-y-6 lg:col-span-2">
          {/* Leave Balances */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Your Leave Balance</h2>
                <p className="text-muted-foreground text-sm">
                  Available leave by type
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push('/users/dashboard/workforce/leaves/balance')
                }
              >
                View Details
              </Button>
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="space-y-3 p-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-2 w-full" />
                      <div className="grid grid-cols-3 gap-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : balanceSummary && balanceSummary.balances.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {balanceSummary.balances.slice(0, 4).map((balance) => (
                  <BalanceCard key={balance.id} balance={balance} />
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
                <h2 className="text-xl font-semibold">Recent Requests</h2>
                <p className="text-muted-foreground text-sm">
                  Your last 5 leave requests
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push('/users/dashboard/workforce/leaves/requests')
                }
              >
                View All
              </Button>
            </div>

            {isLoading ? (
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
            ) : recentRequests && recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <LeaveRequestCard
                    key={request.id}
                    request={request}
                    from="employee-dashboard"
                  />
                ))}
              </div>
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
                      router.push('/users/dashboard/workforce/leaves/apply')
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
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push('/users/dashboard/workforce/leaves/apply')
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Apply for Leave
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push('/users/dashboard/workforce/leaves/requests')
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                My Requests
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push('/users/dashboard/workforce/leaves/balance')
                }
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Balance Details
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push('/users/dashboard/workforce/leaves/calendar')
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
              <CardTitle>Leave Summary {year}</CardTitle>
              <CardDescription>Your leave usage</CardDescription>
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
                        {balanceSummary.totalAvailable} days
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Used
                      </span>
                      <span className="text-lg font-semibold text-red-600">
                        {balanceSummary.totalUsed} days
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Pending
                      </span>
                      <span className="text-lg font-semibold text-yellow-600">
                        {balanceSummary.totalPending} days
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
                <CardTitle>Upcoming Leave</CardTitle>
                <CardDescription>Your scheduled time off</CardDescription>
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
