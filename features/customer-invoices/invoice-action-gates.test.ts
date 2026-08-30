import { describe, expect, test } from 'bun:test';
import { InvoiceStatus } from '@tornotron/echno-core/finance/types';
import type { Invoice } from '@tornotron/echno-core/finance/types';
import {
  CANCEL_REASON_MAX_LENGTH,
  invoiceCancelGate,
  invoiceIssueGate,
  isValidCancelReason,
} from './invoice-action-gates';

/** A draft invoice with nothing paid: what both actions start from. */
function invoice(over: Partial<Invoice> = {}): Invoice {
  return {
    id: 'b2c3d4e5-0000-4000-8000-000000000001',
    invoiceNumber: 'INV-2026-0042',
    customerId: 'c3d4e5f6-0000-4000-8000-000000000002',
    customerName: 'Asset Homes Pvt Ltd',
    invoiceDate: '2026-08-01',
    dueDate: '2026-08-31',
    status: InvoiceStatus.DRAFT,
    subtotal: 50_000,
    taxTotal: 9000,
    total: 59_000,
    amountPaid: 0,
    balanceDue: 59_000,
    lines: [],
    ...over,
  } as unknown as Invoice;
}

describe('invoiceIssueGate', () => {
  test('a draft may be issued by someone holding the role', () => {
    const gate = invoiceIssueGate({ invoice: invoice(), canManage: true });
    expect(gate.visible).toBe(true);
    expect(gate.enabled).toBe(true);
  });

  test('a caller without the role is not offered the action at all', () => {
    const gate = invoiceIssueGate({ invoice: invoice(), canManage: false });
    expect(gate.visible).toBe(false);
    expect(gate.enabled).toBe(false);
  });

  // InvoiceService.issue takes a DRAFT and refuses everything else, naming the
  // status it found. An invoice a construction invoice raised arrives already
  // ISSUED and is covered by exactly this: it appears in the listing and is
  // offered no issue action.
  test.each([
    InvoiceStatus.ISSUED,
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.PAID,
    InvoiceStatus.CANCELLED,
  ])('an invoice that is already %s is offered no issue action', (status) => {
    const gate = invoiceIssueGate({
      invoice: invoice({ status }),
      canManage: true,
    });
    expect(gate.visible).toBe(false);
  });
});

describe('invoiceCancelGate', () => {
  test('an unpaid draft may be cancelled', () => {
    const gate = invoiceCancelGate({ invoice: invoice(), canManage: true });
    expect(gate.enabled).toBe(true);
    expect(gate.reason).toBeUndefined();
  });

  test('a draft carries no construction caveat, because nothing raises a draft', () => {
    // A construction invoice materializes its receivable already ISSUED, so a
    // draft is always a standalone one and the caveat would only be noise.
    const gate = invoiceCancelGate({ invoice: invoice(), canManage: true });
    expect(gate.caveat).toBeUndefined();
  });

  test('a caller without the role is not offered the action at all', () => {
    const gate = invoiceCancelGate({ invoice: invoice(), canManage: false });
    expect(gate.visible).toBe(false);
  });

  test('an already cancelled invoice is not offered it either', () => {
    const gate = invoiceCancelGate({
      invoice: invoice({ status: InvoiceStatus.CANCELLED }),
      canManage: true,
    });
    expect(gate.visible).toBe(false);
  });

  test.each([InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID])(
    'a %s invoice is refused with the credit-note answer, not hidden',
    (status) => {
      const gate = invoiceCancelGate({
        invoice: invoice({ status, amountPaid: 20_000, balanceDue: 39_000 }),
        canManage: true,
      });
      expect(gate.visible).toBe(true);
      expect(gate.enabled).toBe(false);
      expect(gate.reason).toContain('credit note');
    }
  );

  test('an issued invoice with a payment against it is refused the same way', () => {
    // InvoiceService.cancelInternal guards the ISSUED branch on amountPaid as
    // well as on the status, so a payment that has not yet moved the status is
    // still a refusal.
    const gate = invoiceCancelGate({
      invoice: invoice({
        status: InvoiceStatus.ISSUED,
        amountPaid: 100,
        balanceDue: 58_900,
      }),
      canManage: true,
    });
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('credit note');
  });

  test('an issued, unpaid invoice may be cancelled, with the source caveat attached', () => {
    // This is the row that may or may not be a construction invoice's
    // receivable. Nothing on the DTO settles it, so the action is offered and
    // the condition is stated rather than guessed at.
    const gate = invoiceCancelGate({
      invoice: invoice({ status: InvoiceStatus.ISSUED }),
      canManage: true,
    });
    expect(gate.enabled).toBe(true);
    expect(gate.caveat).toContain('construction invoice');
  });
});

describe('isValidCancelReason', () => {
  test('a reason with text passes', () => {
    expect(isValidCancelReason('Customer withdrew the order')).toBe(true);
  });

  test('an empty box fails, because the request parameter is required', () => {
    expect(isValidCancelReason('')).toBe(false);
  });

  test('whitespace only fails the same way', () => {
    expect(isValidCancelReason('  \n ')).toBe(false);
  });

  test('a reason at the limit passes', () => {
    expect(isValidCancelReason('x'.repeat(CANCEL_REASON_MAX_LENGTH))).toBe(
      true
    );
  });

  test('a longer reason fails here rather than in the reversal description column', () => {
    expect(isValidCancelReason('x'.repeat(CANCEL_REASON_MAX_LENGTH + 1))).toBe(
      false
    );
  });

  test('the limit leaves room for the prefix the reversal entry adds', () => {
    // "Reversal of " + a 30-character entry number + " - " is 45 characters,
    // and the description column holds 500.
    expect(CANCEL_REASON_MAX_LENGTH + 45).toBeLessThanOrEqual(500);
  });
});
