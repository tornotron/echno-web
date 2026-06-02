'use client';

import { useState } from 'react';
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
import { Input } from '@/components/shadcn/input';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/shadcn/tooltip';
import {
  CheckCircle,
  XCircle,
  Search,
  Clock,
  User,
  Building,
  Calendar,
  FileText,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/lib/styles/toast-styles';
import { useAttendanceRole } from '@/hooks/attendance';
import {
  usePendingRegularizations,
  useProcessRegularization,
} from '@/hooks/attendance-regularization';
import { useCurrentUserEmployee } from '@/hooks/employee';
import type { RegularizationDetail } from '@/types/attendance/regularization';

// ─── Component ────────────────────────────────────────────────────────────────

export function RegularizationManagement({
  hideHeader = false,
}: {
  hideHeader?: boolean;
}) {
  const router = useRouter();
  const { canApprove } = useAttendanceRole();
  const { data: currentEmployee } = useCurrentUserEmployee();
  const currentUserIdentifier =
    currentEmployee?.name ?? currentEmployee?.employeeId ?? 'manager';

  // Data
  const { data: regularizations = [], isLoading } = usePendingRegularizations();
  const processMutation = useProcessRegularization();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRegularization, setSelectedRegularization] =
    useState<RegularizationDetail | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Filtering
  const filtered = regularizations.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.employeeName ?? r.requestedBy).toLowerCase().includes(q) ||
      (r.projectName ?? '').toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
    );
  });

  // Handlers
  function handleApprove(reg: RegularizationDetail) {
    processMutation.mutate(
      {
        id: reg.id,
        status: 'APPROVED',
        approvedBy: currentUserIdentifier,
      },
      {
        onSuccess: () => toast.success('Regularization approved'),
        onError: () => toast.error('Failed to approve regularization'),
      }
    );
  }

  function openRejectDialog(reg: RegularizationDetail) {
    setSelectedRegularization(reg);
    setRejectionReason('');
    setRejectDialogOpen(true);
  }

  function handleReject() {
    if (!selectedRegularization) return;
    processMutation.mutate(
      {
        id: selectedRegularization.id,
        status: 'REJECTED',
        approvedBy: currentUserIdentifier,
        rejectionReason: rejectionReason || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Regularization rejected');
          setRejectDialogOpen(false);
          setSelectedRegularization(null);
        },
        onError: () => toast.error('Failed to reject regularization'),
      }
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        {!hideHeader && <Header />}
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-zinc-400" />
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading regularization requests…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hideHeader && <Header />}

      {/* Statistics */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pending Requests
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {regularizations.length}
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
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Employees
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {
                  new Set(
                    regularizations.map((r) => r.employeeId ?? r.requestedBy)
                  ).size
                }
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <User className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              with open requests
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Projects</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {
                  new Set(
                    regularizations
                      .filter((r) => r.projectId)
                      .map((r) => r.projectId)
                  ).size
                }
              </p>
              <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <Building className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">affected</p>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search by employee, project…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
          <span className="ml-auto text-xs text-zinc-500">
            {filtered.length} pending
          </span>
        </CardHeader>

        {filtered.length === 0 ? (
          <CardContent>
            <Empty variant="inline">
              <EmptyMedia variant="icon">
                <CheckCircle className="size-6 text-green-500" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>
                  {regularizations.length === 0
                    ? 'All caught up!'
                    : 'No matching requests'}
                </EmptyTitle>
                <EmptyDescription>
                  {regularizations.length === 0
                    ? 'There are no pending regularization requests.'
                    : 'Try adjusting your search query.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Missing Events</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested</TableHead>
                    {canApprove && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((reg) => (
                    <TableRow key={reg.id}>
                      {/* Employee */}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <User className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {reg.employeeName ?? reg.requestedBy}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">
                              {reg.requestedBy}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Project */}
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Building className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {reg.projectName ?? '—'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {reg.attendanceDate
                              ? format(reg.attendanceDate, 'MMM d, yyyy')
                              : '—'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Missing Events */}
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

                      {/* Reason */}
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="max-w-[200px] cursor-default truncate text-sm text-zinc-700 dark:text-zinc-300">
                                {reg.reason}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p>{reg.reason}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>

                      {/* Requested At */}
                      <TableCell>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {format(reg.requestedAt, 'MMM d, h:mm a')}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      {canApprove && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      router.push(
                                        `/users/dashboard/attendance/${reg.attendanceId}`
                                      )
                                    }
                                  >
                                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View attendance</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => openRejectDialog(reg)}
                              disabled={processMutation.isPending}
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 text-white hover:bg-green-700"
                              onClick={() => handleApprove(reg)}
                              disabled={processMutation.isPending}
                            >
                              <CheckCircle className="mr-1 h-3.5 w-3.5" />
                              Approve
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span>Reject Regularization</span>
            </DialogTitle>
            <DialogDescription>
              {selectedRegularization && (
                <>
                  Reject regularization request from{' '}
                  <strong>
                    {selectedRegularization.employeeName ??
                      selectedRegularization.requestedBy}
                  </strong>
                  {selectedRegularization.attendanceDate && (
                    <>
                      {' '}
                      for{' '}
                      {format(
                        selectedRegularization.attendanceDate,
                        'MMMM d, yyyy'
                      )}
                    </>
                  )}
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedRegularization && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
                <div className="mb-2 flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Employee&apos;s Reason
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {selectedRegularization.reason}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Rejection Reason{' '}
                <span className="text-zinc-400">(optional)</span>
              </label>
              <Textarea
                placeholder="Explain why this request is being rejected…"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Header() {
  return (
    <PageHeader
      title="Regularization Requests"
      description="Review and manage pending attendance regularization requests"
    />
  );
}
