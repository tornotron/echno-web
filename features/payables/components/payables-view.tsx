'use client';

import { useState } from 'react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import { useVendors } from '@tornotron/echno-core/vendor/hooks';
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
} from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/shadcn/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { useAuthorization } from '@/hooks/use-authorization';
import { usePayables } from '@/hooks/payables';
import {
  useCreatePayable,
  useRecordPayablePayment,
} from '@/hooks/payables';
import { PAYABLE_PAGE_SIZE } from '@/services/payables-service';
import type {
  Payable,
  PayableCreationRequest,
  PayableListParams,
} from '@/services/payables-service';
import { toast } from '@/lib/styles/toast-styles';
import { payablePaymentGate } from '../payable-action-gates';
import { clampPageNo } from '@/lib/paging';
import { CreatePayableDialog } from './create-payable-dialog';
import { RecordPaymentDialog } from './record-payment-dialog';

const amountFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatAmount(value: number): string {
  return amountFormat.format(value);
}

/**
 * Reports a failed action.
 *
 * The mutation hooks invalidate on settle, success or failure alike, so a lost
 * race refetches rather than leaving a row offering a payment the server has
 * already refused. This only has to say what happened.
 *
 * @param fallback - The title to show when the error carries none of its own.
 * @returns A mutation `onError` handler.
 */
const reportError = (fallback: string) => (error: unknown) => {
  toast.error(getErrorTitle(error, fallback), {
    description: getErrorMessage(error),
  });
};

/** The values of the filter control. */
const ALL = 'ALL';
const OUTSTANDING = 'OUTSTANDING';
/** A vendor filter is `VENDOR:<id>`, so one control covers all three shapes. */
const VENDOR_PREFIX = 'VENDOR:';

/**
 * Turns the filter selection into the parameters the service reads.
 *
 * There is no filtered listing on the server: outstanding and by-vendor are
 * separate unpaged endpoints, so the choice here decides which endpoint is
 * called rather than adding a query parameter to one of them. That is also why
 * the two of them cannot be combined.
 *
 * @param filter - The selected filter value.
 * @returns The list parameters for it.
 */
function filterToParams(
  filter: string
): Pick<PayableListParams, 'outstandingOnly' | 'vendorId'> {
  if (filter === OUTSTANDING) return { outstandingOnly: true };
  if (filter.startsWith(VENDOR_PREFIX)) {
    return { vendorId: Number(filter.slice(VENDOR_PREFIX.length)) };
  }
  return {};
}

/** Whether the selected filter reaches an endpoint that pages. */
function isPaged(filter: string): boolean {
  return filter === ALL;
}

function settlementBadge(payable: Payable) {
  if (payable.amountDue <= 0) {
    return (
      <Badge
        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
        variant="secondary"
      >
        Settled
      </Badge>
    );
  }
  if (payable.amountPaid > 0) {
    return (
      <Badge
        className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
        variant="secondary"
      >
        Part paid
      </Badge>
    );
  }
  return (
    <Badge
      className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      variant="secondary"
    >
      Open
    </Badge>
  );
}

/**
 * The vendor payables, with the payment action on each.
 *
 * Until this screen there was no way into the module from the product at all:
 * payables existed only in the database, so nobody could see what was
 * outstanding to a vendor or record a payment against it.
 *
 * The backend's refusals are applied before the request rather than after it:
 * see `../payable-action-gates`.
 */
export function PayablesView() {
  const { isSystemAdmin } = useAuthorization();
  const { data: employee } = useCurrentUserEmployee();
  const { data: vendors = [] } = useVendors();
  const [filter, setFilter] = useState<string>(ALL);
  const [pageNo, setPageNo] = useState(0);
  const [paymentTarget, setPaymentTarget] = useState<Payable | null>(null);
  const [creating, setCreating] = useState(false);

  const paged = isPaged(filter);
  const params: PayableListParams = {
    ...(paged ? { pageNo, pageSize: PAYABLE_PAGE_SIZE } : {}),
    ...filterToParams(filter),
  };
  const { data, isLoading, isError } = usePayables(params);
  const createPayable = useCreatePayable();
  const recordPayment = useRecordPayablePayment();

  // Every mapping on PayableControllerWeb names system-admin alone, the reads
  // included, so this decides the actions and the screen's reads alike.
  const canManage = isSystemAdmin;

  const rows = data?.rows ?? [];
  const totalPages = data?.totalPages ?? 0;

  // The page being read can stop existing under the user. Only judged once a
  // response is in hand, since a page count of nothing is also what an
  // unresolved query looks like.
  if (paged && data && clampPageNo(pageNo, totalPages) !== pageNo) {
    setPageNo(clampPageNo(pageNo, totalPages));
  }

  function confirmPayment(paymentAmount: number) {
    if (!paymentTarget) return;
    const target = paymentTarget;
    recordPayment.mutate(
      { id: target.id, paymentAmount },
      {
        onSuccess: (updated) => {
          toast.success(`Recorded ${formatAmount(paymentAmount)}`, {
            description:
              updated.amountDue <= 0
                ? `${target.payableNumber} is now settled.`
                : `${formatAmount(updated.amountDue)} still owed on ${target.payableNumber}.`,
          });
          setPaymentTarget(null);
        },
        onError: reportError('The payment could not be recorded'),
      }
    );
  }

  function confirmCreate(request: PayableCreationRequest) {
    createPayable.mutate(request, {
      onSuccess: (created) => {
        toast.success(`Raised ${created.payableNumber}`, {
          description: `${formatAmount(created.amountRecorded)} owed to ${created.contractorName}.`,
        });
        setCreating(false);
      },
      onError: reportError('The payable could not be raised'),
    });
  }

  const filterControl = (
    <Select
      value={filter}
      onValueChange={(next) => {
        setFilter(next);
        setPageNo(0);
      }}
    >
      <SelectTrigger className="w-[240px]" aria-label="Filter payables">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All payables</SelectItem>
        <SelectItem value={OUTSTANDING}>Outstanding (still owed)</SelectItem>
        {vendors.map((vendor) => (
          <SelectItem
            key={vendor.id}
            value={`${VENDOR_PREFIX}${vendor.id}`}
          >
            {vendor.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const raiseButton = canManage ? (
    <Button size="sm" onClick={() => setCreating(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Raise payable
    </Button>
  ) : null;

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Payables could not be loaded</EmptyTitle>
            <EmptyDescription>
              The payables ledger did not respond. Refresh the page to try
              again.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    );
  }

  const totalDue = rows.reduce(
    (running, row) => running + Math.max(row.amountDue, 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {filterControl}
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatAmount(totalDue)} owed across the payables shown
        </span>
        <div className="ml-auto">{raiseButton}</div>
      </div>

      {rows.length === 0 ? (
        <Card className="p-6">
          <Empty>
            <EmptyHeader>
              <Wallet className="h-8 w-8 text-zinc-400" />
              <EmptyTitle>
                {filter === ALL
                  ? 'No payables yet'
                  : 'No payables match this filter'}
              </EmptyTitle>
              <EmptyDescription>
                {filter === ALL
                  ? 'Amounts owed to contractors and vendors appear here once they are raised.'
                  : 'Change the filter to see the payables that are there.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payable</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Raised by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Recorded</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Owed</TableHead>
                <TableHead className="w-44" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((payable) => {
                const gate = payablePaymentGate({ payable, canManage });

                return (
                  <TableRow key={payable.id}>
                    <TableCell className="font-medium">
                      {payable.payableNumber}
                    </TableCell>
                    <TableCell>{payable.contractorName}</TableCell>
                    <TableCell>{payable.vendorName ?? '—'}</TableCell>
                    <TableCell>{payable.projectName ?? '—'}</TableCell>
                    <TableCell>
                      {/* PayableDto nests the employee with the name already
                          on it, so this needs no lookup and cannot name the
                          wrong person the way a user-id join would. */}
                      {payable.createdBy?.name ?? '—'}
                    </TableCell>
                    <TableCell>{settlementBadge(payable)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(payable.amountRecorded)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(payable.amountPaid)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(payable.amountDue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {gate.visible && (
                          <Button
                            size="sm"
                            disabled={!gate.enabled}
                            title={gate.reason}
                            onClick={() => setPaymentTarget(payable)}
                          >
                            <Banknote className="mr-2 h-4 w-4" />
                            Record payment
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto text-sm text-zinc-500 dark:text-zinc-400">
          {data
            ? `${data.totalElements} payable${data.totalElements === 1 ? '' : 's'}${
                paged
                  ? ` · page ${pageNo + 1}${totalPages > 0 ? ` of ${totalPages}` : ''}`
                  : ''
              }`
            : null}
        </span>
        {/* The outstanding and by-vendor endpoints answer one unpaged list, so
            there is nothing to page through under those filters. */}
        {paged && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={pageNo === 0}
              onClick={() => setPageNo(pageNo - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pageNo + 1 >= totalPages}
              onClick={() => setPageNo(pageNo + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <RecordPaymentDialog
        open={paymentTarget !== null}
        onOpenChange={(open) => !open && setPaymentTarget(null)}
        payable={paymentTarget}
        formatAmount={formatAmount}
        isPending={recordPayment.isPending}
        onConfirm={confirmPayment}
      />
      <CreatePayableDialog
        open={creating}
        onOpenChange={setCreating}
        createdByEmployeeId={employee?.id}
        takenNumbers={rows.map((row) => row.payableNumber)}
        isPending={createPayable.isPending}
        onConfirm={confirmCreate}
      />
    </div>
  );
}
