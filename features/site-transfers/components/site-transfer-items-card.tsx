'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import Link from 'next/link';
import { Package } from 'lucide-react';
import type {
  SiteTransfer,
  SiteTransferItem,
} from '@tornotron/echno-core/site-transfers/types';
import {
  crossesProjectBoundary,
  inTransitMeaning,
} from '@/lib/inventory/site-transfer-legs';
import { routes } from '@/nav';
import {
  stockAdjustmentStatusLabels,
  type StockAdjustment,
} from '@/types/resource';

interface SiteTransferItemsCardProps {
  transfer: SiteTransfer;
  /**
   * The stock adjustments raised against this transfer, if any have been read.
   *
   * The variance is the transfer's own figure, but whether anybody has answered
   * it lives on another document entirely, so it is passed in rather than
   * fetched here. An empty array means the lookup came back with nothing, which
   * is what leaves the variance open.
   */
  closingAdjustments?: StockAdjustment[];
}

/**
 * How a line's in-transit figure should be read, or `none` when the line has
 * no quantity in transit to read.
 *
 * The status decides the meaning; see {@link inTransitMeaning}, which the whole
 * transfer's notice reads from too so the line and the summary cannot disagree.
 */
function inTransitReading(
  transfer: SiteTransfer,
  item: SiteTransferItem
): 'none' | 'on-the-lorry' | 'open-variance' | 'settled' {
  if (item.inTransitQuantity <= 0) return 'none';
  return inTransitMeaning(transfer);
}

/**
 * Read-only card listing a site transfer's material lines: what was sent, what
 * was recorded as arriving, what is still unaccounted for, the value that left
 * the sending site, and any remarks.
 *
 * The received column distinguishes a line nobody has confirmed (`—`) from one
 * confirmed as receiving nothing (`0`). Those are different statements: the
 * first says the lorry has not been looked at, the second says it was and this
 * material was not on it.
 *
 * The value shown is the transfer's own, which is what the stock was worth when
 * it left the sending site. No arrival value is computed here: the server
 * prices the inbound leg at the cost the outbound leg carried, read back off
 * the ledger, precisely because the sending balance may hold none of the
 * material by the time the lorry is unloaded, and pricing off it then would
 * come back as zero.
 *
 * The footer under an open variance is the only place the transfer offers an
 * act. It appears on a `COMPLETED` transfer that arrived short and nowhere
 * else: a cancelled transfer's leftover in-transit figure is history, and a
 * pending one's is a lorry on a road. Sending somebody to correct a balance in
 * either case would be sending them to invent a discrepancy. The reading comes
 * from {@link inTransitMeaning} rather than from the status, so the line, the
 * notice above and this offer cannot disagree.
 *
 * @param props.transfer - The site transfer whose items are shown.
 * @param props.closingAdjustments - Adjustments already raised against it.
 */
export function SiteTransferItemsCard({
  transfer,
  closingAdjustments = [],
}: SiteTransferItemsCardProps) {
  const twoStep = crossesProjectBoundary(transfer);
  let openVariance = 0;
  for (const item of transfer.items) {
    if (inTransitReading(transfer, item) === 'open-variance') {
      openVariance += item.inTransitQuantity;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Transfer Items
          <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
            {transfer.items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Material</TableHead>
                <TableHead>Sent</TableHead>
                {twoStep && <TableHead>Received</TableHead>}
                {twoStep && <TableHead>In Transit</TableHead>}
                <TableHead>Transfer Value</TableHead>
                <TableHead className="pr-6">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfer.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={twoStep ? 6 : 4}
                    className="text-muted-foreground py-6 text-center text-sm"
                  >
                    No items
                  </TableCell>
                </TableRow>
              )}
              {transfer.items.map((item) => {
                const reading = inTransitReading(transfer, item);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6 font-medium">
                      {item.materialName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.sentQuantity}
                    </TableCell>
                    {twoStep && (
                      <TableCell className="text-muted-foreground">
                        {item.receivedQuantity == null ? (
                          <span title="Nobody has confirmed this line yet">
                            —
                          </span>
                        ) : (
                          item.receivedQuantity
                        )}
                      </TableCell>
                    )}
                    {twoStep && (
                      <TableCell
                        className={
                          reading === 'open-variance'
                            ? 'font-medium text-amber-700 dark:text-amber-400'
                            : 'text-muted-foreground'
                        }
                      >
                        {item.inTransitQuantity}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {item.transferValue == null
                        ? '—'
                        : `₹${item.transferValue.toLocaleString('en-IN')}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground pr-6">
                      {item.remarks ?? '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {openVariance > 0 && (
          <div className="border-t p-4 text-sm text-amber-800 dark:text-amber-300">
            <p className="font-medium">
              {openVariance} unaccounted for on this transfer
            </p>
            {closingAdjustments.length === 0 ? (
              <>
                <p className="text-muted-foreground mt-1">
                  Less arrived than was sent. The sending site is down the full
                  sent quantity and the receiving site is up what arrived; the
                  difference has not been written off, and it stays open until a
                  stock adjustment naming this transfer closes it.
                </p>
                <Link
                  href={`${routes.resources.stockAdjustments.new}?fromTransfer=${transfer.id}`}
                  className="mt-2 inline-block font-medium underline underline-offset-4"
                >
                  Raise the stock adjustment that closes this
                </Link>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mt-1">
                  {closingAdjustments.length > 1
                    ? 'Less arrived than was sent. These stock adjustments were raised to answer it; the correction reaches the balance when one of them is approved.'
                    : 'Less arrived than was sent. This stock adjustment was raised to answer it; the correction reaches the balance when it is approved.'}
                </p>
                <ul className="mt-2 space-y-1">
                  {closingAdjustments.map((adjustment) => (
                    <li key={adjustment.id}>
                      <Link
                        href={
                          routes.resources.stockAdjustments.detail(
                            adjustment.id
                          ).href
                        }
                        className="font-medium underline underline-offset-4"
                      >
                        {adjustment.adjustmentNumber}
                      </Link>{' '}
                      <span className="text-muted-foreground">
                        {stockAdjustmentStatusLabels[adjustment.status] ??
                          adjustment.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
