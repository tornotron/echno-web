'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Check, MapPin, X } from 'lucide-react';
import type { Attendance } from '@tornotron/echno-core/attendance/types';
import { DataTable, type DataTableColumn } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { TableCell } from '@/components/shadcn/table';
import {
  canDecideAttendanceApproval,
  type AttendanceApprovalViewer,
} from '@/features/attendance/lib/approval-gate';
import { geofenceExceptionReason } from '@/features/attendance/lib/geofence-exceptions';

/** A decision the approver can take on a row. */
export type AttendanceDecision = 'APPROVED' | 'REJECTED';

interface Props {
  /** The page of held days the server returned, newest day first. */
  records: Attendance[];
  /**
   * How many days are waiting in total, from the count endpoint.
   *
   * Deliberately a separate input rather than `records.length`. The listing is
   * capped server-side, so once the queue is longer than the cap its length
   * stops being the answer, and a figure derived from it would quietly stick at
   * the cap while the real backlog grew.
   */
  waitingCount?: number;
  isLoading?: boolean;
  isError?: boolean;
  /** The signed-in employee and their role cohort, for the per-row gate. */
  viewer: AttendanceApprovalViewer;
  /** Raised when the approver decides a row. */
  onDecide: (record: Attendance, decision: AttendanceDecision) => void;
  /** True while a decision is in flight, to disable the controls. */
  isDeciding?: boolean;
}

/**
 * The away-from-site days waiting on the signed-in approver.
 *
 * Two properties of this list decide how it is presented, and getting either
 * wrong makes the screen claim something untrue.
 *
 * **It is the held days, not everything pending.** `checkIn` builds every
 * attendance record at `approvalStatus = pending` and nothing moves it until
 * somebody decides, so pending is an ordinary record's resting state and a
 * listing of everything a record manager may decide would be the tenant's whole
 * attendance history. The endpoint therefore also filters
 * `requiresGeofenceApproval`, which is why the wording throughout says "away
 * from site" and never "everything I can approve".
 *
 * **The viewer's own held day is never in it**, for a record manager as much as
 * for anyone else, matching the refusal `requireActorMayApprove` puts ahead of
 * the role check. So a supervisor's own trip off site is missing from their
 * queue by design, and describing the list as complete would be a lie about
 * their own record.
 *
 * The gate still runs per row. Every row the endpoint returns is one the server
 * would accept a decision on, so it should never refuse one; running it anyway
 * is what keeps the buttons and the server's answer from drifting apart if the
 * queue's filter is ever widened.
 */
export function AttendanceApprovalQueue({
  records,
  waitingCount,
  isLoading = false,
  isError = false,
  viewer,
  onDecide,
  isDeciding = false,
}: Props) {
  const columns: DataTableColumn<Attendance>[] = [
    {
      id: 'employee',
      header: 'Employee',
      cell: (record) => (
        <TableCell>
          <Link
            href={`/users/dashboard/attendance/${record.id}`}
            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {record.employeeName}
          </Link>
        </TableCell>
      ),
    },
    {
      id: 'date',
      header: 'Day',
      cell: (record) => (
        <TableCell>{format(record.date, 'MMM d, yyyy')}</TableCell>
      ),
    },
    {
      id: 'project',
      header: 'Site',
      cell: (record) => <TableCell>{record.projectName}</TableCell>,
    },
    {
      id: 'reason',
      header: 'Reason given',
      cell: (record) => (
        <TableCell className="text-zinc-600 dark:text-zinc-400">
          {geofenceExceptionReason(record) ?? 'No reason recorded'}
        </TableCell>
      ),
    },
    {
      id: 'decision',
      header: 'Decision',
      headClassName: 'text-right',
      cell: (record) => {
        // The server has already excluded rows this viewer may not decide, so
        // this normally passes. It is kept because it is what puts the buttons
        // and the endpoint under one rule instead of two that happen to agree.
        if (!canDecideAttendanceApproval(record, viewer)) {
          return (
            <TableCell className="text-right text-sm text-zinc-500">
              Not yours to decide
            </TableCell>
          );
        }

        return (
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
                disabled={isDeciding}
                onClick={() => onDecide(record, 'REJECTED')}
              >
                <X className="mr-1 h-4 w-4" />
                Reject
              </Button>
              <Button
                size="sm"
                disabled={isDeciding}
                onClick={() => onDecide(record, 'APPROVED')}
              >
                <Check className="mr-1 h-4 w-4" />
                Approve
              </Button>
            </div>
          </TableCell>
        );
      },
    },
  ];

  // Only meaningful once the listing has arrived: before that `records` is
  // empty for a reason that has nothing to do with the cap.
  const capped =
    !isLoading && waitingCount !== undefined && waitingCount > records.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant={waitingCount ? 'destructive' : 'secondary'}>
          {waitingCount ?? 0} waiting
        </Badge>
        {capped && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing the {records.length} most recent. Decide these and the rest
            follow.
          </span>
        )}
      </div>

      <DataTable
        data={records}
        columns={columns}
        getRowId={(record) => record.id}
        isLoading={isLoading}
        isError={isError}
        searchPlaceholder="Search by employee or site…"
        searchPredicate={(record, query) =>
          `${record.employeeName} ${record.projectName}`
            .toLowerCase()
            .includes(query.toLowerCase())
        }
        entityNoun={{ one: 'day', many: 'days' }}
        emptyIcon={<MapPin className="size-6" />}
        emptyTitle="Nothing waiting on you"
        emptyDescription="No away-from-site day is held for your decision. Your own days are not listed here: somebody else decides those."
        errorTitle="Could not load the queue"
        errorDescription="The days waiting on you could not be fetched. Please try again."
      />
    </div>
  );
}
