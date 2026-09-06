'use client';

/**
 * The one sentence a reader needs about where this transfer's stock actually
 * is, said before they reach the line items.
 *
 * echno-backend#660 made an in-transit quantity mean different things at
 * different points in a transfer's life, and the figure alone does not say
 * which. A quantity sitting against a `PENDING` transfer is a lorry on a road
 * and nothing is wrong; the same quantity against a `COMPLETED` one is stock
 * that left one site and never arrived at the other. Against a `CANCELLED` one
 * it is neither: the outbound leg was reversed, the material is back on the
 * sending balance, and the line's figure is only a record of what it once
 * carried.
 *
 * The classification is {@link inTransitMeaning}, shared with the items card so
 * a line and the notice above it can never tell the reader two different
 * stories.
 */

import { AlertTriangle } from 'lucide-react';
import type { SiteTransfer } from '@tornotron/echno-core/site-transfers/types';
import {
  crossesProjectBoundary,
  inTransitMeaning,
  totalInTransit,
} from '@/lib/inventory/site-transfer-legs';

interface TransferInTransitNoticeProps {
  transfer: SiteTransfer;
}

/**
 * @param props.transfer - The transfer being explained.
 * @returns The notice, or nothing when the transfer has no in-transit figure
 *   worth explaining.
 */
export function TransferInTransitNotice({
  transfer,
}: TransferInTransitNoticeProps) {
  if (!crossesProjectBoundary(transfer)) {
    return (
      <div className="text-muted-foreground rounded-lg border p-4 text-sm">
        A transfer between two stores on one project arrives as it is created:
        the material never leaves that site&apos;s custody, so there is nothing
        to confirm and nothing in transit.
      </div>
    );
  }

  const inTransit = totalInTransit(transfer);
  if (inTransit <= 0) return null;

  const meaning = inTransitMeaning(transfer);

  if (meaning === 'settled') {
    return (
      <div className="text-muted-foreground rounded-lg border p-4 text-sm">
        This transfer was cancelled and the {inTransit} it sent went back to the
        sending site. The in-transit figures below are what it carried before
        that, not stock anybody is waiting on.
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {meaning === 'on-the-lorry'
          ? `${inTransit} left the sending site and has not been confirmed at the receiving one. It is counted at neither site until somebody there records what arrived.`
          : `${inTransit} is unaccounted for: less arrived than was sent. Nothing has been written off, and it stays open until a stock adjustment naming this transfer closes it.`}
      </span>
    </div>
  );
}
