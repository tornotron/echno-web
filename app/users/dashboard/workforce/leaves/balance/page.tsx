'use client';

import { AppLayout } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import {
  mockEmployeeLeaveQuotas,
  getEmployeeLeaveRequests,
} from '@/components/shared/mock-data';
import {
  getLeaveTypeLabel,
  getLeaveTypeColor,
  getLeaveStatusColor,
  getLeaveStatusLabel,
} from '@/types/leave';
import { format } from 'date-fns';

export default function LeaveBalancePage() {
  // For demo, using employee ID 1 (Rajesh Kumar)
  const employeeId = '1';
  const quota = mockEmployeeLeaveQuotas.find(
    (q) => q.employeeId === employeeId
  );
  const leaveRequests = getEmployeeLeaveRequests(employeeId);

  if (!quota) {
    return <div>No leave quota found</div>;
  }

  const totalAllocated = quota.balances.reduce(
    (sum, b) => sum + b.allocated,
    0
  );
  const totalUsed = quota.balances.reduce((sum, b) => sum + b.used, 0);
  const totalPending = quota.balances.reduce((sum, b) => sum + b.pending, 0);
  const totalAvailable = quota.balances.reduce(
    (sum, b) => sum + b.available + b.carriedForward,
    0
  );

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              My Leave Balance
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              {quota.employeeName} • {quota.department}
            </p>
          </div>
          <Link href="/users/dashboard/workforce/leaves/apply">
            <Button className="mt-4 md:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              Apply for Leave
            </Button>
          </Link>
        </div>
        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Allocated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalAllocated}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalAvailable}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Used</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalUsed}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalPending}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>{' '}
        {/* Leave Balance by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Balance by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {quota.balances.map((balance) => {
                const totalQuota = balance.allocated + balance.carriedForward;
                const consumed = balance.used + balance.pending;
                const percentageUsed =
                  totalQuota > 0 ? (consumed / totalQuota) * 100 : 0;

                return (
                  <div key={balance.leaveType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getLeaveTypeColor(balance.leaveType)}>
                          {getLeaveTypeLabel(balance.leaveType)}
                        </Badge>
                        {balance.carriedForward > 0 && (
                          <Badge variant="outline" className="text-xs">
                            +{balance.carriedForward} carried forward
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {balance.available + balance.carriedForward}
                        </p>
                        <p className="text-xs text-zinc-500">
                          of {totalQuota} days
                        </p>
                      </div>
                    </div>

                    <Progress value={percentageUsed} className="h-2" />

                    <div className="flex justify-between text-sm text-zinc-500">
                      <span>Used: {balance.used} days</span>
                      <span>Pending: {balance.pending} days</span>
                      {balance.encashable > 0 && (
                        <span className="text-green-600">
                          Encashable: {balance.encashable} days
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        {/* Recent Leave Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Leave Requests</CardTitle>
              <Link href="/users/dashboard/workforce/leaves">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveRequests.length === 0 ? (
                <div className="py-8 text-center text-zinc-500">
                  <AlertCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No leave requests found</p>
                </div>
              ) : (
                leaveRequests.slice(0, 5).map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge className={getLeaveTypeColor(leave.leaveType)}>
                          {getLeaveTypeLabel(leave.leaveType)}
                        </Badge>
                        <Badge className={getLeaveStatusColor(leave.status)}>
                          {getLeaveStatusLabel(leave.status)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">
                        {format(leave.fromDate, 'dd MMM yyyy')} -{' '}
                        {format(leave.toDate, 'dd MMM yyyy')}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {leave.reason}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold">{leave.daysCount}</p>
                      <p className="text-xs text-zinc-500">days</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        {/* Leave Policy Information */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <AlertCircle className="h-5 w-5" />
              Leave Policy Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
            <p>
              • Leave requests should be submitted at least 3 days in advance
            </p>
            <p>• Sick leaves exceeding 3 days require a medical certificate</p>
            <p>
              • Earned leaves can be carried forward to the next year (max 10
              days)
            </p>
            <p>• Casual leaves cannot be combined with holidays</p>
            <p>• Contact HR for any leave-related queries: hr@echno.com</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
