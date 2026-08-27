'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  Loader2,
  FileEdit,
  AlertCircle,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useAttendanceByEmployee } from '@tornotron/echno-core/attendance/hooks';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import type { RegularizationDetail } from '@tornotron/echno-core/attendance/types';

// ─── Status config ────────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

function statusVariant(
  status: string
): 'default' | 'destructive' | 'outline' | 'secondary' {
  if (status === 'approved') return 'default';
  if (status === 'rejected') return 'destructive';
  return 'outline';
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmployeeRegularizationView({
  hideHeader = false,
}: {
  hideHeader?: boolean;
}) {
  const router = useRouter();
  const { data: employee } = useCurrentUserEmployee();
  const employeeId = employee?.id;

  // Backend has no dedicated "regularizations by employee" endpoint, so we
  // derive them from the employee's attendance records (each record embeds
  // its own regularization request when one exists).
  const today = new Date();
  const startDate = format(subDays(today, 89), 'yyyy-MM-dd');
  const endDate = format(today, 'yyyy-MM-dd');
  const { data: records = [], isLoading } = useAttendanceByEmployee(
    employeeId,
    startDate,
    endDate
  );

  const regularizations = useMemo<RegularizationDetail[]>(
    () =>
      records
        .filter((rec) => rec.regularization)
        .map((rec) => ({
          ...rec.regularization!,
          employeeId: rec.employeeId,
          employeeName: rec.employeeName,
          attendanceDate: rec.date,
          projectId: rec.projectId,
          projectName: rec.projectName,
        })),
    [records]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const filtered = useMemo(() => {
    let result = regularizations;
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          (r.projectName ?? '').toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          (r.attendanceDate
            ? format(r.attendanceDate, 'dd MMM yyyy').toLowerCase().includes(q)
            : false)
      );
    }
    // Newest first
    return [...result].toSorted(
      (a, b) => b.requestedAt.getTime() - a.requestedAt.getTime()
    );
  }, [regularizations, statusFilter, searchQuery]);

  const stats = {
    total: regularizations.length,
    pending: regularizations.filter((r) => r.status === 'pending').length,
    approved: regularizations.filter((r) => r.status === 'approved').length,
    rejected: regularizations.filter((r) => r.status === 'rejected').length,
  };

  function goToAttendance(reg: RegularizationDetail) {
    router.push(`/users/dashboard/attendance/${reg.attendanceId}`);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {!hideHeader && (
        <PageHeader
          title="My Regularizations"
          description="Track the status of your regularization requests"
          actions={
            <Button
              variant="outline"
              onClick={() => router.push('/users/dashboard/attendance/history')}
            >
              <FileEdit className="mr-2 h-4 w-4" />
              Request from History
            </Button>
          }
        />
      )}

      {/* Stats */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Requests
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {stats.total}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <FileEdit className="size-4 text-zinc-700 dark:text-zinc-300" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all-time</p>
          </div>
          <div className="flex flex-col gap-1 sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {stats.pending}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting review
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Approved</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {stats.approved}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              successfully processed
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Rejected</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                {stats.rejected}
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                <XCircle className="size-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">declined</p>
          </div>
        </div>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search by date, project, reason…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as FilterStatus)}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-xs text-zinc-500">
            {stats.total} total · {stats.pending} pending
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-zinc-400" />
              <p className="text-zinc-600 dark:text-zinc-400">Loading…</p>
            </div>
          ) : filtered.length === 0 ? (
            <Empty variant="inline">
              <EmptyMedia variant="icon">
                <AlertCircle className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>
                  {regularizations.length === 0
                    ? 'No regularization requests yet'
                    : 'No matching requests'}
                </EmptyTitle>
                <EmptyDescription>
                  {regularizations.length === 0
                    ? 'Go to Attendance History and open a record with missing events.'
                    : 'Try adjusting your filters.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="divide-y lg:hidden">
                {filtered.map((reg) => (
                  <div
                    key={reg.id}
                    className="hover:bg-muted/50 cursor-pointer p-4"
                    onClick={() => goToAttendance(reg)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {reg.attendanceDate
                            ? format(reg.attendanceDate, 'EEE, dd MMM yyyy')
                            : '—'}
                        </p>
                        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                          {reg.projectName ?? '—'}
                        </p>
                      </div>
                      <Badge variant={statusVariant(reg.status)}>
                        {statusLabel(reg.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {reg.reason}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {reg.missingEvents.map((evt, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {evt.replaceAll('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    {reg.status === 'rejected' && reg.rejectionReason && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                        Reason: {reg.rejectionReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Missing Events</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((reg) => (
                      <TableRow
                        key={reg.id}
                        className="hover:bg-accent cursor-pointer"
                        onClick={() => goToAttendance(reg)}
                      >
                        <TableCell>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {reg.attendanceDate
                              ? format(reg.attendanceDate, 'EEE, dd MMM')
                              : '—'}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {reg.attendanceDate
                              ? format(reg.attendanceDate, 'yyyy')
                              : ''}
                          </p>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {reg.projectName ?? '—'}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {reg.missingEvents.map((evt, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs"
                              >
                                {evt.replaceAll('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="max-w-[220px] cursor-default truncate text-sm text-zinc-700 dark:text-zinc-300">
                                  {reg.reason}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                className="max-w-xs"
                              >
                                <p>{reg.reason}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {format(reg.requestedAt, 'dd MMM, h:mm a')}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={statusVariant(reg.status)}>
                              {statusLabel(reg.status)}
                            </Badge>
                            {reg.status === 'rejected' &&
                              reg.rejectionReason && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                  {reg.rejectionReason}
                                </p>
                              )}
                          </div>
                        </TableCell>

                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => goToAttendance(reg)}
                                >
                                  <ExternalLink className="h-4 w-4 text-zinc-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View attendance</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
