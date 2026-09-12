'use client';

/**
 * The decided-requests view of the regularization queue.
 *
 * The queue only ever listed pending work, which left the "Approved by X"
 * stamp on an attendance day with nowhere to link: a row with an approver has
 * by definition left the pending list. This card is that destination. It reads
 * the register narrowed on the server by outcome and by approver or requester,
 * so an approver link lands on rows that actually exist.
 *
 * The register answers with the base DTO, so the columns are the ones it
 * carries: requester, when, what was missing, why, and the decision.
 */

import Link from 'next/link';
import { format } from 'date-fns';
import { CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { employeeFilterHref } from '@/hooks/use-employee-filter';
import { routes } from '@/nav';
import {
  useRegularizationRegister,
  type RegisterStatus,
} from '@/hooks/attendance/use-regularization-register';

/** The `?status=` values the decided tab accepts, in URL form. */
export const REGISTER_STATUS_PARAMS = ['approved', 'rejected'] as const;
export type RegisterStatusParam = (typeof REGISTER_STATUS_PARAMS)[number];

/** Maps the URL's lower-case status onto the register's enum, or none. */
export function registerStatusFromParam(
  value: string | null
): RegisterStatus | undefined {
  if (value === 'approved') return 'APPROVED';
  if (value === 'rejected') return 'REJECTED';
  return undefined;
}

/**
 * The href an "Approved by X" or "Rejected by X" stamp links to: the decided
 * tab, narrowed to that outcome and that approver. Outcome travels with the
 * link because the two share the `approvedById` column, so without it the
 * two lists collapse into one.
 */
export function approverRegisterHref(
  approverId: number,
  status: 'approved' | 'rejected'
): string {
  return employeeFilterHref(
    `${routes.attendance.regularizations}?tab=decided&status=${status}`,
    approverId,
    'approver'
  );
}

interface RegularizationRegisterCardProps {
  status?: RegisterStatus;
  onStatusChange: (status: RegisterStatusParam | null) => void;
  approvedById?: number;
  requestedById?: number;
}

export function RegularizationRegisterCard({
  status,
  onStatusChange,
  approvedById,
  requestedById,
}: RegularizationRegisterCardProps) {
  const { data, isLoading, isError } = useRegularizationRegister({
    status,
    approvedById,
    requestedById,
  });
  const rows = data?.rows ?? [];
  const total = data?.totalElements ?? 0;

  const outcomes: { value: RegisterStatusParam | null; label: string }[] = [
    { value: null, label: 'All' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];
  const active: RegisterStatusParam | null =
    status === 'APPROVED'
      ? 'approved'
      : status === 'REJECTED'
        ? 'rejected'
        : null;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2 border-b px-4 py-2">
        {outcomes.map((o) => (
          <Button
            key={o.label}
            size="sm"
            variant={o.value === active ? 'default' : 'outline'}
            onClick={() => onStatusChange(o.value)}
          >
            {o.label}
          </Button>
        ))}
        <span className="ml-auto text-xs text-zinc-500">
          {rows.length < total
            ? `${rows.length} of ${total} decided`
            : `${rows.length} decided`}
        </span>
      </CardHeader>

      {isLoading ? (
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-zinc-400" />
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading decided requests…
          </p>
        </CardContent>
      ) : isError ? (
        <CardContent>
          <Empty variant="inline">
            <EmptyHeader>
              <EmptyTitle>Could not load decided requests</EmptyTitle>
              <EmptyDescription>Try again in a moment.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      ) : rows.length === 0 ? (
        <CardContent>
          <Empty variant="inline">
            <EmptyMedia variant="icon">
              <CheckCircle className="size-6 text-zinc-400" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No decided requests</EmptyTitle>
              <EmptyDescription>
                Nothing has been approved or rejected under this filter.
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
                  <TableHead>Requested by</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Missing Events</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead className="text-right">Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {reg.requestedById ? (
                          <Link
                            href={employeeFilterHref(
                              `${routes.attendance.regularizations}?tab=decided`,
                              reg.requestedById,
                              'requester'
                            )}
                            className="hover:underline"
                          >
                            {reg.requestedBy}
                          </Link>
                        ) : (
                          reg.requestedBy
                        )}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {format(reg.requestedAt, 'MMM d, yyyy h:mm a')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {reg.missingEvents.map((event) => (
                          <Badge key={event} variant="outline">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-xs truncate text-sm text-zinc-600 dark:text-zinc-400">
                        {reg.reason}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          reg.status === 'approved' ? 'default' : 'destructive'
                        }
                      >
                        {reg.status === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                      {reg.approvedBy && (
                        <p className="mt-1 text-xs text-zinc-500">
                          by{' '}
                          {reg.approvedById ? (
                            <Link
                              href={approverRegisterHref(
                                reg.approvedById,
                                reg.status === 'approved'
                                  ? 'approved'
                                  : 'rejected'
                              )}
                              className="hover:underline"
                            >
                              {reg.approvedBy}
                            </Link>
                          ) : (
                            reg.approvedBy
                          )}
                          {reg.approvedAt &&
                            ` · ${format(reg.approvedAt, 'MMM d, yyyy h:mm a')}`}
                        </p>
                      )}
                      {reg.rejectionReason && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {reg.rejectionReason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        asChild
                      >
                        <Link
                          href={`/users/dashboard/attendance/${reg.attendanceId}`}
                        >
                          <ExternalLink className="h-4 w-4 text-zinc-500" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
