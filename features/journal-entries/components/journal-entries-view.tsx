'use client';

import { Fragment, useState } from 'react';
import {
  useJournalEntries,
  useReverseJournalEntry,
} from '@tornotron/echno-core/finance/hooks';
import { JournalEntryStatus } from '@tornotron/echno-core/finance/types';
import type { JournalEntry } from '@tornotron/echno-core/finance/types';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Undo2,
} from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
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
import { useAuthorization } from '@/hooks/use-authorization';
import { toast } from '@/lib/styles/toast-styles';
import { journalEntryReversalGate } from '../reversal-gate';
import { ReverseJournalEntryDialog } from './reverse-journal-entry-dialog';

const PAGE_SIZE = 20;

const amountFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatAmount(value: number): string {
  return amountFormat.format(value);
}

/** Total debits on an entry, which by the posting rules equals total credits. */
function entryTotal(entry: JournalEntry): number {
  return entry.lines.reduce((sum, line) => sum + line.debit, 0);
}

function statusBadge(status: JournalEntryStatus) {
  const styles: Record<JournalEntryStatus, string> = {
    [JournalEntryStatus.POSTED]:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    [JournalEntryStatus.REVERSED]:
      'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    [JournalEntryStatus.DRAFT]:
      'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  };
  return (
    <Badge className={styles[status]} variant="secondary">
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

/**
 * The ledger's journal entries, with the reversal action on each one.
 *
 * A posted entry is immutable: the only correction the backend offers is
 * `POST /finance/journal-entries/web/reverse`, which posts a mirror entry.
 * Until this view existed the only reversal a user could trigger was the
 * implicit one inside invoice cancellation, so an entry posted by hand, or any
 * entry that did not come from an invoice, could only be corrected through the
 * API.
 *
 * The backend's refusals are applied before the request rather than after it:
 * see `../reversal-gate`.
 */
export function JournalEntriesView() {
  const { isSystemAdmin, isManager } = useAuthorization();
  const [pageNo, setPageNo] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reverseTarget, setReverseTarget] = useState<JournalEntry | null>(null);

  const {
    data: entries = [],
    isLoading,
    isError,
  } = useJournalEntries(pageNo, PAGE_SIZE);
  const reverseEntry = useReverseJournalEntry();

  // Reversal is limited to system-admin and project-manager, the same set the
  // controller's @PreAuthorize names. The server is still the authority; this
  // only stops a request that was always going to be refused.
  const canReverse = isSystemAdmin || isManager;

  function confirmReversal(reason: string) {
    if (!reverseTarget) return;
    const target = reverseTarget;
    reverseEntry.mutate(
      { id: target.id, dto: { reason } },
      {
        onSuccess: (reversal) => {
          toast.success(`Reversed ${target.entryNumber}`, {
            description: `Reversing entry ${reversal.entryNumber} was posted to the ledger.`,
          });
          setReverseTarget(null);
        },
        onError: (error) =>
          toast.error(getErrorTitle(error, 'Reversal failed'), {
            description: getErrorMessage(error),
          }),
      }
    );
  }

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
            <EmptyTitle>Journal entries could not be loaded</EmptyTitle>
            <EmptyDescription>
              The ledger did not respond. Refresh the page to try again.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="p-6">
        <Empty>
          <EmptyHeader>
            <BookOpen className="h-8 w-8 text-zinc-400" />
            <EmptyTitle>
              {pageNo === 0 ? 'No journal entries yet' : 'No entries on this page'}
            </EmptyTitle>
            <EmptyDescription>
              {pageNo === 0
                ? 'Entries appear here as invoices, payments and manual postings reach the ledger.'
                : 'Go back a page to see the entries that are there.'}
            </EmptyDescription>
          </EmptyHeader>
          {pageNo > 0 && (
            <Button variant="outline" onClick={() => setPageNo(pageNo - 1)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous page
            </Button>
          )}
        </Empty>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Entry</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const expanded = expandedId === entry.id;
              const gate = journalEntryReversalGate({ entry, canReverse });

              return (
                <Fragment key={entry.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={
                          expanded
                            ? `Hide lines of ${entry.entryNumber}`
                            : `Show lines of ${entry.entryNumber}`
                        }
                        aria-expanded={expanded}
                        onClick={() => setExpandedId(expanded ? null : entry.id)}
                      >
                        {expanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.entryNumber}
                    </TableCell>
                    <TableCell>{entry.entryDate ?? '—'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-zinc-500 dark:text-zinc-400">
                      {entry.sourceType ?? '—'}
                    </TableCell>
                    <TableCell>{statusBadge(entry.status)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(entryTotal(entry))}
                    </TableCell>
                  </TableRow>

                  {expanded && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-zinc-50 dark:bg-zinc-900/40">
                        <div className="space-y-4 p-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Account</TableHead>
                                <TableHead>Narration</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entry.lines.map((line) => (
                                <TableRow key={line.id}>
                                  <TableCell>
                                    {line.accountCode
                                      ? `${line.accountCode} · ${line.accountName ?? ''}`.trim()
                                      : (line.accountName ?? '—')}
                                  </TableCell>
                                  <TableCell className="text-zinc-500 dark:text-zinc-400">
                                    {line.narration ?? '—'}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {line.debit > 0 ? formatAmount(line.debit) : '—'}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {line.credit > 0 ? formatAmount(line.credit) : '—'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>

                          {gate.visible && (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {gate.reason ??
                                  'Reversing posts a second entry with the debits and credits swapped. It cannot be undone.'}
                              </p>
                              <Button
                                variant="outline"
                                disabled={!gate.enabled}
                                onClick={() => setReverseTarget(entry)}
                              >
                                <Undo2 className="mr-2 h-4 w-4" />
                                Reverse
                              </Button>
                            </div>
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

      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto text-sm text-zinc-500 dark:text-zinc-400">
          Page {pageNo + 1}
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
          // The list endpoint returns a bare array with no total, so a short
          // page is the only signal that this is the last one.
          disabled={entries.length < PAGE_SIZE}
          onClick={() => setPageNo(pageNo + 1)}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <ReverseJournalEntryDialog
        open={reverseTarget !== null}
        onOpenChange={(open) => !open && setReverseTarget(null)}
        entryNumber={reverseTarget?.entryNumber ?? ''}
        isPending={reverseEntry.isPending}
        onConfirm={confirmReversal}
      />
    </div>
  );
}
