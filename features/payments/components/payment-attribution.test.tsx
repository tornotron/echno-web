/**
 * Three independent facts about a voucher, shown independently.
 *
 * The bug this pins was real and came out of review: the raiser was rendered
 * inside the verification card, whose condition is `verifiedBy && verifiedAt`.
 * So the one voucher that never named its raiser was the unverified one, which
 * is precisely when the name matters. The backend refuses a verification from
 * the account that raised the voucher, so "who raised this" is the question
 * somebody asks before verifying, not after.
 *
 * The second pairing worth pinning is the opposite mistake: a cancelled voucher
 * keeps its verification stamp on purpose, so the two cards coexist rather than
 * one replacing the other.
 *
 * Assertions are on counts and strings, never on a rendered node: an assertion
 * that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { ConstructionPaymentVoucherStatus } from '@/types/finance/payment';
import {
  PaymentAttribution,
  type PaymentAttributionState,
} from './payment-attribution';

afterEach(cleanup);

function show(payment: Partial<PaymentAttributionState> = {}) {
  const { container } = render(
    createElement(PaymentAttribution, {
      payment: {
        status: ConstructionPaymentVoucherStatus.PENDING,
        ...payment,
      } as PaymentAttributionState,
    })
  );
  return (container.textContent ?? '').replaceAll(/\s+/g, ' ');
}

const STAMP = {
  verifiedBy: 7,
  verifiedByName: 'Anita Rao',
  verifiedAt: '2026-08-31T10:00:00Z',
};

describe('the raiser', () => {
  test('is shown on an unverified voucher', () => {
    // The regression this file exists for. Nested under the verification stamp,
    // this was the one case that showed nothing.
    const text = show({ raisedBy: 4, raisedByName: 'Hrishi K' });

    expect(text).toContain('Raised by');
    expect(text).toContain('Hrishi K');
  });

  test('is shown on a verified voucher too, beside the verifier', () => {
    const text = show({ raisedBy: 4, raisedByName: 'Hrishi K', ...STAMP });

    expect(text).toContain('Hrishi K');
    expect(text).toContain('Anita Rao');
  });

  test('is shown on a cancelled voucher', () => {
    const text = show({
      status: ConstructionPaymentVoucherStatus.CANCELLED,
      raisedBy: 4,
      raisedByName: 'Hrishi K',
    });

    expect(text).toContain('Hrishi K');
  });

  test('falls back to the id form when the backend resolved no name', () => {
    const text = show({ raisedBy: 4 });

    expect(text).toContain('User #4');
  });

  test('is omitted entirely when the voucher records no raiser', () => {
    expect(show()).not.toContain('Raised by');
  });
});

describe('the verification stamp', () => {
  test('names the verifier rather than their id', () => {
    // `verifiedByName` was on the backend DTO all along and the core schema was
    // stripping it, which is why this used to render `User #7`.
    const text = show(STAMP);

    expect(text).toContain('Anita Rao');
    expect(text).not.toContain('User #7');
  });

  test('falls back to the id form when the backend resolved no name', () => {
    const text = show({ verifiedBy: 7, verifiedAt: STAMP.verifiedAt });

    expect(text).toContain('User #7');
  });

  test('is absent on an unverified voucher', () => {
    expect(show()).not.toContain('Verification');
  });

  test('needs both halves: a verifier with no time is not a stamp', () => {
    expect(show({ verifiedBy: 7 })).not.toContain('Verification');
  });
});

describe('a cancelled voucher', () => {
  test('says why it was voided', () => {
    const text = show({
      status: ConstructionPaymentVoucherStatus.CANCELLED,
      cancellationReason: 'Duplicate of CPMT-000118',
    });

    expect(text).toContain('Cancellation');
    expect(text).toContain('Duplicate of CPMT-000118');
  });

  test('says so plainly when no reason came back', () => {
    const text = show({
      status: ConstructionPaymentVoucherStatus.CANCELLED,
    });

    expect(text).toContain('No reason was recorded.');
  });

  test('keeps its verification stamp alongside the cancellation', () => {
    // Deliberate rather than contradictory: the document is voided, the record
    // that it was checked first is not. Replacing one card with the other would
    // erase half the audit trail.
    const text = show({
      status: ConstructionPaymentVoucherStatus.CANCELLED,
      cancellationReason: 'Duplicate of CPMT-000118',
      ...STAMP,
    });

    expect(text).toContain('Verified');
    expect(text).toContain('Anita Rao');
    expect(text).toContain('Cancelled');
    expect(text).toContain('Duplicate of CPMT-000118');
  });

  test('an uncancelled voucher shows no cancellation card', () => {
    expect(show(STAMP)).not.toContain('Cancellation');
  });
});
