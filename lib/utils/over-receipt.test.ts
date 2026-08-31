/**
 * The arithmetic and the recognition behind the over-receipt flow.
 *
 * Both halves are pinned here rather than through the form, because both are
 * places where being nearly right is worse than being absent: an outstanding
 * figure computed per line rather than per material would tell somebody a
 * receipt is fine that the server then refuses, and a refusal recognised by
 * status alone would offer "file it anyway" for a missing project.
 *
 * Deleting `orderedAgainstReceived` takes the outstanding column with it and
 * these fail on a missing export. Deleting `isOverReceiptRefusal` takes the
 * acknowledgement dialog with it, so the deployed client goes back to a toast
 * with no route forward, which is the break this issue is about.
 */
import { describe, expect, test } from 'bun:test';
import { ApiError } from '@/lib/api/api-client';
import type { PurchaseOrderItem } from '@tornotron/echno-core/purchase-orders/types';
import {
  isOverReceiptRefusal,
  materialsOverReceipt,
  orderedAgainstReceived,
  overReceiptExplanation,
} from './over-receipt';

/** An order line, with only the fields the arithmetic reads spelled out. */
function line(
  materialId: number,
  ordered: number,
  received: number
): PurchaseOrderItem {
  return {
    id: materialId * 100 + received,
    materialId,
    materialName: `Material ${materialId}`,
    orderedQuantity: ordered,
    receivedQuantity: received,
    unitPrice: 0,
    totalPrice: 0,
  };
}

/** The sentence the backend actually sends, from echno-backend#659. */
const REFUSAL =
  'Purchase order PO-2026-000001 orders 100 of Cement 53 Grade, 95 has already ' +
  'been received against it, and this note receives a further 20, which would ' +
  'take it to 115. If the delivery really did exceed the order, send the note ' +
  'again with allowOverReceipt set, which records the excess and marks the note ' +
  'as an acknowledged over-receipt.';

describe('what the order still expects', () => {
  test('outstanding is what was ordered less what has arrived', () => {
    const figures = orderedAgainstReceived([line(7, 100, 95)], 7);

    expect(figures?.ordered).toBe(100);
    expect(figures?.received).toBe(95);
    expect(figures?.outstanding).toBe(5);
  });

  test('two order lines for one material are summed, as the server sums them', () => {
    const figures = orderedAgainstReceived(
      [line(7, 60, 10), line(7, 40, 5)],
      7
    );

    expect(figures?.ordered).toBe(100);
    expect(figures?.received).toBe(15);
    expect(figures?.outstanding).toBe(85);
  });

  test('a line already over-received is met, not owed a negative quantity', () => {
    expect(orderedAgainstReceived([line(7, 1, 5)], 7)?.outstanding).toBe(0);
  });

  test('a material that is not on the order has no figures at all', () => {
    expect(orderedAgainstReceived([line(7, 100, 0)], 9)).toBe(undefined);
  });

  test('an order that has not loaded yet has no figures either', () => {
    expect(orderedAgainstReceived(undefined, 7)).toBe(undefined);
  });
});

describe('which rows the server would refuse', () => {
  test('a receipt inside what is outstanding is not flagged', () => {
    const over = materialsOverReceipt(
      [{ materialId: 7, receivedQuantity: 5 }],
      [line(7, 100, 95)]
    );

    expect(over.length).toBe(0);
  });

  test('one past the outstanding quantity is flagged', () => {
    const over = materialsOverReceipt(
      [{ materialId: 7, receivedQuantity: 6 }],
      [line(7, 100, 95)]
    );

    expect(over).toEqual([7]);
  });

  test('two rows for one material are added up before judging', () => {
    const over = materialsOverReceipt(
      [
        { materialId: 7, receivedQuantity: 60 },
        { materialId: 7, receivedQuantity: 60 },
      ],
      [line(7, 100, 0)]
    );

    expect(over).toEqual([7]);
  });

  test('a material not on the order is never flagged, however much arrives', () => {
    const over = materialsOverReceipt(
      [{ materialId: 9, receivedQuantity: 10_000 }],
      [line(7, 100, 0)]
    );

    expect(over.length).toBe(0);
  });
});

describe('recognising the one refusal the user can answer', () => {
  test('the over-receipt refusal is recognised', () => {
    expect(isOverReceiptRefusal(new ApiError(REFUSAL, 400))).toBe(true);
  });

  test('another 400 is not, so nothing offers to file it anyway', () => {
    const other = new ApiError(
      'Project with ID null was not found in this organization.',
      400
    );

    expect(isOverReceiptRefusal(other)).toBe(false);
  });

  test('a server error naming the field is not a decision to put to the user', () => {
    expect(isOverReceiptRefusal(new ApiError(REFUSAL, 500))).toBe(false);
  });

  test('a network failure with no server sentence is not one either', () => {
    expect(isOverReceiptRefusal(new Error('Failed to fetch'))).toBe(false);
  });
});

describe('what the refusal reads as', () => {
  test('the figures survive', () => {
    const explanation = overReceiptExplanation(new ApiError(REFUSAL, 400));

    expect(explanation).toContain('PO-2026-000001');
    expect(explanation).toContain('orders 100 of Cement 53 Grade');
    expect(explanation).toContain('95 has already been received');
    expect(explanation).toContain('would take it to 115');
  });

  test('the instruction to set a payload field does not', () => {
    const explanation = overReceiptExplanation(new ApiError(REFUSAL, 400));

    expect(explanation).not.toContain('allowOverReceipt');
    expect(explanation).not.toContain('send the note again');
  });
});
