import { describe, expect, test } from 'bun:test';
import type { StockAdjustment } from '@/types/resource';
import {
  REJECTION_REASON_MAX_LENGTH,
  canRejectStockAdjustment,
  isDecided,
  rejectionReasonError,
  stockAdjustmentAmendmentGate,
} from './decision-gates';

/** A draft raised by user 7, so each test can decide it one way or the other. */
function draft(over: Partial<StockAdjustment> = {}): StockAdjustment {
  return {
    id: 1,
    adjustmentNumber: 'SA-2026-0001',
    status: 'draft',
    projectId: 4,
    submittedBy: 7,
    lineItems: [{ id: 1, materialId: 21 }],
    ...over,
  } as unknown as StockAdjustment;
}

const REJECTED = { status: 'rejected', rejectedAt: new Date() } as const;
const POSTED = { status: 'processed', processedAt: new Date() } as const;

describe('canRejectStockAdjustment', () => {
  test('a role holder may reject a draft', () => {
    expect(
      canRejectStockAdjustment({ adjustment: draft(), canReject: true })
    ).toBe(true);
  });

  test('the raiser may reject their own draft', () => {
    // The whole point of a separate gate. Approval refuses this; rejection does
    // not, because it posts no ledger entry for a second pair of eyes to check
    // and the raiser can already delete the draft outright.
    expect(
      canRejectStockAdjustment({
        adjustment: draft({ submittedBy: 9 }),
        canReject: true,
      })
    ).toBe(true);
  });

  test('a document with no project can still be rejected', () => {
    // Approval refuses it because there is no balance to correct. That is a
    // reason to refuse the document, not a reason the refusal cannot be
    // recorded.
    expect(
      canRejectStockAdjustment({
        adjustment: draft({ projectId: undefined, lineItems: [] }),
        canReject: true,
      })
    ).toBe(true);
  });

  test('a caller without a decision role is not offered the action', () => {
    expect(
      canRejectStockAdjustment({ adjustment: draft(), canReject: false })
    ).toBe(false);
  });

  test('an already rejected document cannot be rejected again', () => {
    expect(
      canRejectStockAdjustment({
        adjustment: draft(REJECTED),
        canReject: true,
      })
    ).toBe(false);
  });

  test('a posted document cannot be rejected', () => {
    expect(
      canRejectStockAdjustment({ adjustment: draft(POSTED), canReject: true })
    ).toBe(false);
  });

  test('the status alone decides it, without the timestamp', () => {
    expect(
      canRejectStockAdjustment({
        adjustment: draft({ status: 'rejected' }),
        canReject: true,
      })
    ).toBe(false);
  });
});

describe('isDecided', () => {
  test('a draft is not decided', () => {
    expect(isDecided(draft())).toBe(false);
  });

  test('a rejected document is', () => {
    expect(isDecided(draft(REJECTED))).toBe(true);
  });

  test('a posted document is', () => {
    expect(isDecided(draft(POSTED))).toBe(true);
  });
});

describe('stockAdjustmentAmendmentGate', () => {
  test('a draft can be edited and deleted', () => {
    const gate = stockAdjustmentAmendmentGate(draft());
    expect(gate.allowed).toBe(true);
    expect(gate.rejected).toBe(false);
    expect(gate.reason).toBeUndefined();
  });

  test('a rejected document can be neither, and says why', () => {
    const gate = stockAdjustmentAmendmentGate(draft(REJECTED));
    expect(gate.allowed).toBe(false);
    expect(gate.rejected).toBe(true);
    expect(gate.reason).toContain('Raise a fresh adjustment');
  });

  test('a posted document can be neither either', () => {
    const gate = stockAdjustmentAmendmentGate(draft(POSTED));
    expect(gate.allowed).toBe(false);
    expect(gate.rejected).toBe(false);
    expect(gate.reason).toContain('posted to the stock ledger');
  });

  test('a rejection that also carries a posting reads as the rejection', () => {
    const gate = stockAdjustmentAmendmentGate(draft({ ...POSTED, ...REJECTED }));
    expect(gate.rejected).toBe(true);
  });
});

describe('rejectionReasonError', () => {
  test('a reason is required', () => {
    expect(rejectionReasonError('')).toContain('Give a reason');
  });

  test('whitespace is not a reason', () => {
    expect(rejectionReasonError('   \n  ')).toContain('Give a reason');
  });

  test('a real reason passes', () => {
    expect(rejectionReasonError('The count sheet is unsigned.')).toBeUndefined();
  });

  test('the cap is the column width, and the boundary is inside it', () => {
    expect(REJECTION_REASON_MAX_LENGTH).toBe(500);
    expect(
      rejectionReasonError('x'.repeat(REJECTION_REASON_MAX_LENGTH))
    ).toBeUndefined();
  });

  test('one character over the cap is refused, with the count', () => {
    const error = rejectionReasonError(
      'x'.repeat(REJECTION_REASON_MAX_LENGTH + 1)
    );
    expect(error).toContain('capped at 500');
    expect(error).toContain('501');
  });

  test('the cap applies to what is sent, which is the trimmed reason', () => {
    const padded = `  ${'x'.repeat(REJECTION_REASON_MAX_LENGTH)}  `;
    expect(padded.length).toBeGreaterThan(REJECTION_REASON_MAX_LENGTH);
    expect(rejectionReasonError(padded)).toBeUndefined();
  });
});
