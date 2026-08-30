'use client';

import { Fragment, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCancelInvoice,
  useIssueInvoice,
} from '@tornotron/echno-core/finance/hooks';
import { InvoiceStatus } from '@tornotron/echno-core/finance/types';
import type { Invoice } from '@tornotron/echno-core/finance/types';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileSpreadsheet,
  Send,
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
import {
  customerInvoiceKeys,
  useCustomerInvoices,
} from '@/hooks/customer-invoices';
import { CUSTOMER_INVOICE_PAGE_SIZE } from '@/services/customer-invoices-service';
import type { CustomerInvoiceListParams } from '@/services/customer-invoices-service';
import { toast } from '@/lib/styles/toast-styles';
import { invoiceCancelGate, invoiceIssueGate } from '../invoice-action-gates';
import { clampPageNo } from '../paging';
import {
  CancelInvoiceDialog,
  IssueInvoiceDialog,
} from './customer-invoice-dialogs';

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
 * The values of the one filter control.
 *
 * `openOnly` is folded in here rather than given a checkbox of its own. It is
 * the only thing `status` cannot express, because an unpaid balance spans
 * `ISSUED` and `PARTIALLY_PAID`, and as a separate control it would let a user
 * build the legal but empty combination of `openOnly` with `PAID`.
 */
const OPEN_ONLY = 'OPEN_ONLY';
const ALL = 'ALL';

type FilterValue = typeof ALL | typeof OPEN_ONLY | InvoiceStatus;

const filterLabels: Record<FilterValue, string> = {
  [ALL]: 'All invoices',
  [OPEN_ONLY]: 'Open (still owed)',
  [InvoiceStatus.DRAFT]: 'Draft',
  [InvoiceStatus.ISSUED]: 'Issued',
  [InvoiceStatus.PARTIALLY_PAID]: 'Partially paid',
  [InvoiceStatus.PAID]: 'Paid',
  [InvoiceStatus.CANCELLED]: 'Cancelled',
};

const filterOrder: FilterValue[] = [
  ALL,
  InvoiceStatus.DRAFT,
  InvoiceStatus.ISSUED,
  OPEN_ONLY,
  InvoiceStatus.PARTIALLY_PAID,
  InvoiceStatus.PAID,
  InvoiceStatus.CANCELLED,
];

function filterToParams(
  filter: FilterValue
): Pick<CustomerInvoiceListParams, 'status' | 'openOnly'> {
  if (filter === ALL) return {};
  if (filter === OPEN_ONLY) return { openOnly: true };
  return { status: filter };
}

const statusStyles: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]:
    'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  [InvoiceStatus.ISSUED]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  [InvoiceStatus.PARTIALLY_PAID]:
    'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  [InvoiceStatus.PAID]:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  [InvoiceStatus.CANCELLED]:
    'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
};

function statusBadge(status: InvoiceStatus) {
  return (
    <Badge className={statusStyles[status]} variant="secondary">
      {filterLabels[status]}
    </Badge>
  );
}

/**
 * The accounts-receivable invoices, with the issue and cancel actions on each.
 *
 * Until the listing endpoint landed there was no way into these invoices from
 * the product at all: a draft could be created through the API and then never
 * issued, so no receivable was ever recognised against it. The Invoices screen
 * elsewhere under Finance is the construction-invoice module, which is a
 * different document on a different endpoint.
 *
 * The backend's refusals are applied before the request rather than after it:
 * see `../invoice-action-gates`.
 */
export function CustomerInvoicesView() {
  const queryClient = useQueryClient();
  const { isSystemAdmin, isManager } = useAuthorization();
  const [filter, setFilter] = useState<FilterValue>(ALL);
  const [pageNo, setPageNo] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [issueTarget, setIssueTarget] = useState<Invoice | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);

  const params: CustomerInvoiceListParams = {
    pageNo,
    pageSize: CUSTOMER_INVOICE_PAGE_SIZE,
    ...filterToParams(filter),
  };
  const { data, isLoading, isError } = useCustomerInvoices(params);
  const issueInvoice = useIssueInvoice();
  const cancelInvoice = useCancelInvoice();

  // Every mapping on InvoiceControllerWeb names system-admin and
  // project-manager, so this decides the actions and the reads alike.
  const canManage = isSystemAdmin || isManager;

  const rows = data?.rows ?? [];
  const totalPages = data?.totalPages ?? 0;

  // The page being read can stop existing: issuing the last draft on the final
  // page of a listing filtered to drafts removes the row that made that page.
  // Only judged once a response is in hand, since a page count of nothing is
  // what an unresolved query looks like.
  if (data && clampPageNo(pageNo, totalPages) !== pageNo) {
    setPageNo(clampPageNo(pageNo, totalPages));
  }

  /**
   * Drops the cached listing.
   *
   * This runs on failure as well as on success. Two people can hold the same
   * screen, and when one issues an invoice the other's rows still show it as a
   * draft with an Issue button on it. Refetching on the 400 settles the
   * disagreement in favour of the server, instead of leaving a button that
   * fails identically on every further click.
   */
  const refreshList = () => {
    queryClient.invalidateQueries({ queryKey: customerInvoiceKeys.lists() });
  };

  const reportError = (fallback: string) => (error: unknown) => {
    refreshList();
    toast.error(getErrorTitle(error, fallback), {
      description: getErrorMessage(error),
    });
  };

  function confirmIssue() {
    if (!issueTarget) return;
    const target = issueTarget;
    issueInvoice.mutate(target.id, {
      onSuccess: () => {
        refreshList();
        toast.success(`Issued ${target.invoiceNumber}`, {
          description: 'The receivable was posted to the ledger.',
        });
        setIssueTarget(null);
      },
      onError: reportError('The invoice could not be issued'),
    });
  }

  function confirmCancel(reason: string) {
    if (!cancelTarget) return;
    const target = cancelTarget;
    cancelInvoice.mutate(
      { id: target.id, reason },
      {
        onSuccess: () => {
          refreshList();
          toast.success(`Cancelled ${target.invoiceNumber}`, {
            description:
              target.status === InvoiceStatus.DRAFT
                ? 'The draft was cancelled. No ledger entry was posted.'
                : 'A reversing entry was posted to back out the receivable.',
          });
          setCancelTarget(null);
        },
        onError: reportError('The invoice could not be cancelled'),
      }
    );
  }

  const filterControl = (
    <Select
      value={filter}
      onValueChange={(next) => {
        setFilter(next as FilterValue);
        setPageNo(0);
      }}
    >
      <SelectTrigger className="w-[200px]" aria-label="Filter invoices">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {filterOrder.map((value) => (
          <SelectItem key={value} value={value}>
            {filterLabels[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

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
            <EmptyTitle>Invoices could not be loaded</EmptyTitle>
            <EmptyDescription>
              The receivables ledger did not respond. Refresh the page to try
              again.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">{filterControl}</div>

      {rows.length === 0 ? (
        <Card className="p-6">
          <Empty>
            <EmptyHeader>
              <FileSpreadsheet className="h-8 w-8 text-zinc-400" />
              <EmptyTitle>
                {filter === ALL
                  ? 'No customer invoices yet'
                  : 'No invoices match this filter'}
              </EmptyTitle>
              <EmptyDescription>
                {filter === ALL
                  ? 'Invoices raised to a customer appear here, along with the ones a construction invoice raises on approval.'
                  : 'Change the filter to see the invoices that are there.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-56" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((invoice) => {
                const expanded = expandedId === invoice.id;
                const issueGate = invoiceIssueGate({ invoice, canManage });
                const cancelGate = invoiceCancelGate({ invoice, canManage });

                return (
                  <Fragment key={invoice.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={
                            expanded
                              ? `Hide lines of ${invoice.invoiceNumber}`
                              : `Show lines of ${invoice.invoiceNumber}`
                          }
                          aria-expanded={expanded}
                          onClick={() =>
                            setExpandedId(expanded ? null : invoice.id)
                          }
                        >
                          {expanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.customerName ?? '—'}</TableCell>
                      <TableCell>{invoice.invoiceDate ?? '—'}</TableCell>
                      <TableCell>{invoice.dueDate ?? '—'}</TableCell>
                      <TableCell>{statusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(invoice.total)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(invoice.balanceDue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {issueGate.visible && (
                            <Button
                              size="sm"
                              disabled={!issueGate.enabled}
                              onClick={() => setIssueTarget(invoice)}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Issue
                            </Button>
                          )}
                          {cancelGate.visible && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!cancelGate.enabled}
                              title={cancelGate.reason}
                              onClick={() => setCancelTarget(invoice)}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {expanded && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="bg-zinc-50 dark:bg-zinc-900/40"
                        >
                          <div className="space-y-4 p-2">
                            {invoice.lines.length === 0 ? (
                              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                This invoice has no line items.
                              </p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">
                                      Quantity
                                    </TableHead>
                                    <TableHead className="text-right">
                                      Unit price
                                    </TableHead>
                                    <TableHead className="text-right">
                                      Tax
                                    </TableHead>
                                    <TableHead className="text-right">
                                      Line total
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {invoice.lines.map((line) => (
                                    <TableRow key={line.id}>
                                      <TableCell>
                                        {line.description ?? '—'}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums">
                                        {line.quantity}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums">
                                        {formatAmount(line.unitPrice)}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums">
                                        {formatAmount(line.taxAmount)}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums">
                                        {formatAmount(line.lineTotal)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}

                            {cancelGate.visible && cancelGate.reason && (
                              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {cancelGate.reason}
                              </p>
                            )}
                            {invoice.notes && (
                              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {invoice.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto text-sm text-zinc-500 dark:text-zinc-400">
          {data
            ? `${data.totalElements} invoice${data.totalElements === 1 ? '' : 's'} · page ${pageNo + 1}${
                totalPages > 0 ? ` of ${totalPages}` : ''
              }`
            : null}
        </span>
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
          // The envelope carries the total, so the last page is known rather
          // than inferred from a short one.
          disabled={pageNo + 1 >= totalPages}
          onClick={() => setPageNo(pageNo + 1)}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <IssueInvoiceDialog
        open={issueTarget !== null}
        onOpenChange={(open) => !open && setIssueTarget(null)}
        invoiceNumber={issueTarget?.invoiceNumber ?? ''}
        formattedTotal={formatAmount(issueTarget?.total ?? 0)}
        isPending={issueInvoice.isPending}
        onConfirm={confirmIssue}
      />
      <CancelInvoiceDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        invoiceNumber={cancelTarget?.invoiceNumber ?? ''}
        postsReversal={
          cancelTarget !== null && cancelTarget.status !== InvoiceStatus.DRAFT
        }
        caveat={
          cancelTarget
            ? invoiceCancelGate({ invoice: cancelTarget, canManage }).caveat
            : undefined
        }
        isPending={cancelInvoice.isPending}
        onConfirm={confirmCancel}
      />
    </div>
  );
}
