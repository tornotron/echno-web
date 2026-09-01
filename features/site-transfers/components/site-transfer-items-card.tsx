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
import { Package } from 'lucide-react';
import type {
  SiteTransfer,
  SiteTransferItem,
} from '@tornotron/echno-core/site-transfers/types';
import { SiteTransferStatus } from '@tornotron/echno-core/site-transfers/types';
import { crossesProjectBoundary } from '@/lib/inventory/site-transfer-legs';

interface SiteTransferItemsCardProps {
  transfer: SiteTransfer;
}

/**
 * How a line's in-transit figure should be read.
 *
 * The same number means two different things depending on whether anybody has
 * confirmed the line yet, and echno-backend#660 turns on the difference:
 *
 * - on a transfer still open it is stock on a lorry, and nothing is wrong;
 * - once the transfer has been received it is an **open variance** — the
 *   sending site is down the full sent quantity, the receiving site is up what
 *   arrived, and the difference is unaccounted for. The transfer deliberately
 *   writes no loss movement for it, because a loss written automatically is a
 *   stock correction nobody authorised.
 */
function inTransitReading(
  transfer: SiteTransfer,
  item: SiteTransferItem
): 'none' | 'on-the-lorry' | 'open-variance' {
  if (item.inTransitQuantity <= 0) return 'none';
  return transfer.status === SiteTransferStatus.pending
    ? 'on-the-lorry'
    : 'open-variance';
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
 * @param props.transfer - The site transfer whose items are shown.
 */
export function SiteTransferItemsCard({
  transfer,
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
            <p className="text-muted-foreground mt-1">
              Less arrived than was sent. The sending site is down the full sent
              quantity and the receiving site is up what arrived; the difference
              has not been written off, and it stays open until a stock
              adjustment naming this transfer closes it.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
