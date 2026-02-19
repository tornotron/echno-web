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
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { LeaveRequestCard } from '@/components/leave/leave-request-card';
import { StatCard } from '@/components/leave/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useOrganizationRequests,
  usePendingApprovalsCount,
  useAllLeavePolicies,
} from '@/hooks/leave/use-leave';
import { LeaveStatus } from '@/types/leave';
import { useCurrentUserEmployee } from '@/hooks/employee';
export function AdminDashboard() {
  const router = useRouter();
  const { data: employee } = useCurrentUserEmployee();
  const employeeId = employee?.id || 0;
  const { data: allOrgRequests, isLoading: requestsLoading } =
    useOrganizationRequests();
  const { data: pendingCount } = usePendingApprovalsCount(employeeId);
  const { data: policies, isLoading: policiesLoading } = useAllLeavePolicies();

  // Get recent requests (last 20) and calculate stats
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

  return (
    <div className="space-y-6">
      {/* Organization-Wide Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total Requests"
          value={totalRequests}
          color="blue"
          description="across organization"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={pendingRequests}
          color="yellow"
          description="awaiting approval"
        />
        <StatCard
          icon={CheckCircle}
          label="Approved"
          value={approvedRequests}
          color="green"
          description={`${totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0}% approval rate`}
        />
        <StatCard
          icon={Settings}
          label="Active Policies"
          value={activePolicies}
          color="blue"
          description="leave types configured"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column - Recent Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Requests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Recent Requests</h2>
                <p className="text-muted-foreground text-sm">
                  Latest leave requests across organization
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(
                    '/users/dashboard/workforce/leaves/organization-requests'
                  )
                }
              >
                View All
              </Button>
            </div>

            {requestsLoading ? (
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
            ) : allRequests && allRequests.length > 0 ? (
              <div className="space-y-4">
                {allRequests.slice(0, 5).map((request) => (
                  <LeaveRequestCard
                    key={request.id}
                    request={request}
                    from="admin-dashboard"
                  />
                ))}
              </div>
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
              <CardTitle>Request Status Breakdown</CardTitle>
              <CardDescription>Current status distribution</CardDescription>
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
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>Management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push('/users/dashboard/workforce/leaves/policies')
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
                    '/users/dashboard/workforce/leaves/organization-requests'
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
                    '/users/dashboard/workforce/leaves/organization-requests?status=PENDING_APPROVAL'
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
                  router.push('/users/dashboard/workforce/leaves/calendar')
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
              <CardTitle>Policy Overview</CardTitle>
              <CardDescription>Active leave policies</CardDescription>
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
                      router.push('/users/dashboard/workforce/leaves/policies')
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
                      router.push('/users/dashboard/workforce/leaves/policies')
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
              <CardTitle>System Health</CardTitle>
              <CardDescription>Leave management status</CardDescription>
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
