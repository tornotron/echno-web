/**
 * What a document still expects, and how to recognise the refusal that follows
 * from ignoring it.
 *
 * Two backends refuse an over-receipt on the same terms and name the same
 * payload field: the goods receipt against its purchase order
 * (echno-backend#659), and the site transfer against what was sent
 * (echno-backend#660). {@link isOverReceiptRefusal} and
 * {@link overReceiptExplanation} are shared by both. The arithmetic below is
 * the purchase order's alone, because a transfer reconciles per line against
 * its own sent quantity rather than per material across an order's lines.
 *
 * echno-backend#659 made a goods receipt reconcile against the order it cites.
 * Two things follow for a client. A line that would take a material past the
 * quantity ordered is refused with a 400 unless the payload acknowledges it, so
 * the client has to recognise that one refusal among all the others and offer
 * the way past it. And `PurchaseOrderItem.receivedQuantity` finally moves, so
 * an outstanding figure can be shown while somebody is typing rather than
 * discovered afterwards.
 *
 * The arithmetic here mirrors the server's on two points that are easy to get
 * subtly wrong:
 *
 * - it is **per material, summed across lines**, on both sides. An order may
 *   carry the same material on two lines and a receipt may too, and the server
 *   adds each side up before comparing, so a check done line by line here would
 *   pass a receipt the server refuses.
 * - a material that is **not on the order** reconciles nothing. It is not an
 *   error and it is common: a lorry can carry an item ordered separately or
 *   supplied free. Such a line has no outstanding figure at all, which is
 *   different from having one of zero.
 */
import { ApiError } from '@/lib/api/api-client';
import type { PurchaseOrderItem } from '@tornotron/echno-core/purchase-orders/types';

/** What one material's lines on an order add up to. */
export interface OrderedAgainstReceived {
  /** Quantity the order asked for, summed across its lines for the material. */
  ordered: number;
  /** Quantity already received against those lines before this receipt. */
  received: number;
  /** What is still expected. Never negative: a line already over-received is met. */
  outstanding: number;
}

/**
 * Sums an order's lines for one material.
 *
 * @param items - The cited order's line items, or `undefined` while it loads.
 * @param materialId - The material a receipt row is for.
 * @returns The figures, or `undefined` when the material is not on the order,
 *   which is a receipt line the order has nothing to say about rather than a
 *   line with nothing outstanding.
 */
export function orderedAgainstReceived(
  items: PurchaseOrderItem[] | undefined,
  materialId: number
): OrderedAgainstReceived | undefined {
  if (!items || !materialId) return undefined;
  const lines = items.filter((item) => item.materialId === materialId);
  if (lines.length === 0) return undefined;

  const ordered = lines.reduce(
    (sum, line) => sum + (line.orderedQuantity || 0),
    0
  );
  const received = lines.reduce(
    (sum, line) => sum + (line.receivedQuantity || 0),
    0
  );
  return { ordered, received, outstanding: Math.max(ordered - received, 0) };
}

/**
 * Whether the quantities on a form would be refused by the server.
 *
 * Deliberately takes every row rather than one, because the server sums the
 * receipt's own lines for a material before judging it: two rows of 60 against
 * an order for 100 is an over-receipt even though neither row is.
 *
 * @param rows - The receipt rows, as material and quantity pairs.
 * @param items - The cited order's line items.
 * @returns The material ids that would take the order past what it asked for.
 */
export function materialsOverReceipt(
  rows: ReadonlyArray<{ materialId: number; receivedQuantity: number }>,
  items: PurchaseOrderItem[] | undefined
): number[] {
  const offered = new Map<number, number>();
  for (const row of rows) {
    if (!row.materialId) continue;
    offered.set(
      row.materialId,
      (offered.get(row.materialId) ?? 0) + (row.receivedQuantity || 0)
    );
  }

  const over: number[] = [];
  for (const [materialId, quantity] of offered) {
    const figures = orderedAgainstReceived(items, materialId);
    if (!figures) continue;
    if (figures.received + quantity > figures.ordered) over.push(materialId);
  }
  return over;
}

/**
 * The sentence the backend appends to every over-receipt refusal, naming the
 * field that answers it. Matched rather than the prose around it because the
 * field name is contract and the prose is not.
 */
const ACKNOWLEDGEMENT_FIELD = 'allowOverReceipt';

/**
 * Whether a failed create was refused for over-receipt specifically.
 *
 * A 400 is not enough on its own: the same status carries a missing project, a
 * material that does not exist and every bean-validation failure on the
 * payload, and offering "file it anyway" for any of those would be offering an
 * acknowledgement of something nobody has been shown. The status is checked
 * too, so a 500 whose stack trace happens to mention the field is not mistaken
 * for a decision the user can make.
 *
 * @param error - Whatever the mutation rejected with.
 * @returns `true` when the server refused an over-receipt and named the way past it.
 */
export function isOverReceiptRefusal(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status !== 400) return false;
  return (error.message ?? '').includes(ACKNOWLEDGEMENT_FIELD);
}

/**
 * Where each backend's refusal stops naming figures and starts instructing the
 * client.
 *
 * Two of them, because the goods receipt and the site transfer word the
 * instruction differently: echno-backend#659 writes "If the delivery really did
 * exceed…", echno-backend#660 writes "If more really did arrive than was
 * sent…". Both then go on to name a payload field.
 *
 * These are matched on the prose, unlike {@link isOverReceiptRefusal}, which
 * matches on the field name. That is the right way round: recognising the
 * refusal at all has to be reliable, so it keys on contract. Trimming the tail
 * is presentation, and the cost of a marker going stale is an extra sentence
 * shown, not a decision offered for the wrong reason.
 */
const CLIENT_INSTRUCTIONS = [
  'If the delivery really did exceed',
  'If more really did arrive than was sent',
];

/**
 * The refusal as it should be read to a person.
 *
 * The server's sentence names the document, what was ordered or sent, what has
 * already arrived and what is now offered, and those figures are the whole
 * point of the refusal: they are what lets somebody recognise a typed digit.
 * Only the trailing instruction is dropped, because it tells the caller to set
 * a payload field, which is the client's job and not the receiver's.
 *
 * @param error - The refusal.
 * @returns The figures, with the API instruction removed.
 */
export function overReceiptExplanation(error: unknown): string {
  const message = error instanceof ApiError ? error.message : '';
  const cut = CLIENT_INSTRUCTIONS.map((marker) =>
    message.indexOf(marker)
  ).filter((index) => index !== -1);
  return (
    cut.length === 0 ? message : message.slice(0, Math.min(...cut))
  ).trim();
}
