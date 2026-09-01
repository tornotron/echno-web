/**
 * Which of a site transfer's two legs have been written, and what a person can
 * therefore still do to it.
 *
 * echno-backend#660 made this depend entirely on whether the transfer crosses a
 * site boundary, and the asymmetry is the design rather than a special case:
 *
 * - **Within one project** both legs are written at creation. The material is
 *   handed from one store to another on a site whose storekeeper is accountable
 *   for it throughout, so there is no window in which nobody is, and nothing to
 *   confirm. Such a transfer comes back `COMPLETED` with every line received in
 *   full, and offering to receive or cancel it would be offering an act with no
 *   referent.
 * - **Between two projects** there is a lorry, a road, and a gap of hours or
 *   days. Creation writes the outbound leg only, and the stock is in transit
 *   until somebody at the far end records what arrived.
 *
 * The server refuses both actions on a within-project transfer, so this is not
 * the guard that keeps the ledger right. It is what stops a screen offering a
 * button whose only outcome is a 400.
 */
import type { SiteTransfer } from '@tornotron/echno-core/site-transfers/types';
import { SiteTransferStatus } from '@tornotron/echno-core/site-transfers/types';

/**
 * Whether the transfer moves material out of one project and into another.
 *
 * Read off the two project ids rather than the two storage locations: a
 * transfer between two stores on one project has different projects on neither
 * end, whatever the locations say.
 *
 * A transfer whose payload carries no project id on one side is treated as not
 * crossing a boundary, which is the conservative answer: it offers no action
 * rather than offering one the server will refuse.
 *
 * @param transfer - The transfer to judge.
 * @returns `true` when the two projects differ.
 */
export function crossesProjectBoundary(transfer: SiteTransfer): boolean {
  const { sendingProjectId, receivingProjectId } = transfer;
  if (!sendingProjectId || !receivingProjectId) return false;
  return sendingProjectId !== receivingProjectId;
}

/**
 * Whether a delivery can still be recorded against this transfer.
 *
 * A completed one has nothing left in transit and a cancelled one was never
 * delivered, so both are refused server-side.
 *
 * @param transfer - The transfer to judge.
 * @returns `true` when the receive action is reachable.
 */
export function canReceive(transfer: SiteTransfer): boolean {
  if (!crossesProjectBoundary(transfer)) return false;
  return (
    transfer.status === SiteTransferStatus.pending ||
    transfer.status === SiteTransferStatus.partiallyTransferred
  );
}

/**
 * Whether this transfer can still be abandoned in transit.
 *
 * Only from `PENDING`. Once anything has been received, part of the material is
 * standing at the far site and its fate is a decision for a stock adjustment
 * rather than a reversal, which is why a partially received transfer offers no
 * cancellation even though it is plainly unfinished.
 *
 * @param transfer - The transfer to judge.
 * @returns `true` when the cancel action is reachable.
 */
export function canCancel(transfer: SiteTransfer): boolean {
  if (!crossesProjectBoundary(transfer)) return false;
  return transfer.status === SiteTransferStatus.pending;
}

/**
 * What is still on the lorry, or unaccounted for, across the whole transfer.
 *
 * @param transfer - The transfer to total.
 * @returns The sum of every line's in-transit quantity.
 */
export function totalInTransit(transfer: SiteTransfer): number {
  let total = 0;
  for (const item of transfer.items) {
    total += item.inTransitQuantity;
  }
  return total;
}
