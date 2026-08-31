/**
 * The voucher states the screens have to tell apart.
 *
 * echno-backend#636 left the product in a state where a verified voucher could
 * be neither edited nor cancelled, because the freeze landed and the cancel
 * action had no client. These are the rules that close it, and each case here
 * corresponds to a refusal the backend actually makes.
 *
 * The two that are easy to get backwards, and so are the ones worth pinning:
 *
 * - a **verified** voucher can still be **cancelled**. Gating cancel on the
 *   same condition as edit is the obvious mistake, and it would re-create the
 *   dead end this whole change exists to open.
 * - verification is refused on `CANCELLED` **only**. Gating it on "completed"
 *   or on any other status would hide the action on a `FAILED` or `REFUNDED`
 *   voucher whose figures are still worth checking.
 */
import { describe, expect, test } from 'bun:test';
import { ConstructionPaymentVoucherStatus } from '@/types/finance/payment';
import {
  canCancelPayment,
  canEditPayment,
  canVerifyPayment,
  editRefusalReason,
  isPaymentCancelled,
  isPaymentVerified,
  settablePaymentStatuses,
  type PaymentLifecycleState,
} from './payment-lifecycle';

const STAMP = {
  verifiedBy: 7,
  verifiedAt: '2026-08-31T10:00:00Z',
};

function voucher(over: Partial<PaymentLifecycleState> = {}) {
  return {
    status: ConstructionPaymentVoucherStatus.PENDING,
    ...over,
  } satisfies PaymentLifecycleState;
}

describe('a fresh voucher', () => {
  const fresh = voucher();

  test('can be edited', () => {
    expect(canEditPayment(fresh)).toBe(true);
  });

  test('can be verified', () => {
    expect(canVerifyPayment(fresh)).toBe(true);
  });

  test('can be cancelled', () => {
    expect(canCancelPayment(fresh)).toBe(true);
  });

  test('has nothing to explain about editing', () => {
    expect(editRefusalReason(fresh)).toBeUndefined();
  });
});

describe('a verified voucher', () => {
  const verified = voucher({
    status: ConstructionPaymentVoucherStatus.COMPLETED,
    ...STAMP,
  });

  test('reads as verified', () => {
    expect(isPaymentVerified(verified)).toBe(true);
  });

  test('cannot be edited, because the PUT is refused', () => {
    expect(canEditPayment(verified)).toBe(false);
  });

  test('cannot be verified a second time', () => {
    expect(canVerifyPayment(verified)).toBe(false);
  });

  test('can still be cancelled, which is the only way to correct it', () => {
    // The case the whole change turns on. Cancelling a verified voucher is not
    // editing the figures its verification attested to; it withdraws the
    // document those figures were on. Gating cancel on the edit rule instead
    // would leave the voucher with no way out at all.
    expect(canCancelPayment(verified)).toBe(true);
  });

  test('says the freeze is why, and names the way out', () => {
    const reason = editRefusalReason(verified);

    expect(reason).toContain('verified');
    expect(reason).toContain('Cancel it and raise a replacement');
  });
});

describe('a half-stamped voucher is not a verified one', () => {
  test('a verifier with no time does not count', () => {
    const half = voucher({ verifiedBy: 7 });

    expect(isPaymentVerified(half)).toBe(false);
    expect(canEditPayment(half)).toBe(true);
  });

  test('a time with no verifier does not count', () => {
    const half = voucher({ verifiedAt: '2026-08-31T10:00:00Z' });

    expect(isPaymentVerified(half)).toBe(false);
    expect(canEditPayment(half)).toBe(true);
  });
});

describe('a cancelled voucher', () => {
  const cancelled = voucher({
    status: ConstructionPaymentVoucherStatus.CANCELLED,
  });

  test('reads as cancelled', () => {
    expect(isPaymentCancelled(cancelled)).toBe(true);
  });

  test('cannot be edited', () => {
    expect(canEditPayment(cancelled)).toBe(false);
  });

  test('cannot be cancelled a second time', () => {
    // Cancelling is one-way. A second cancel button on a voided voucher is an
    // action whose only outcome is a 400.
    expect(canCancelPayment(cancelled)).toBe(false);
  });

  test('cannot be verified: it is the one status with nothing left to check', () => {
    expect(canVerifyPayment(cancelled)).toBe(false);
  });

  test('a cancelled voucher that was verified is still not editable or cancellable', () => {
    // The stamp survives the cancellation on purpose, so this combination is
    // real rather than contradictory, and neither action comes back with it.
    const both = voucher({
      status: ConstructionPaymentVoucherStatus.CANCELLED,
      ...STAMP,
    });

    expect(canEditPayment(both)).toBe(false);
    expect(canCancelPayment(both)).toBe(false);
    expect(canVerifyPayment(both)).toBe(false);
    expect(isPaymentVerified(both)).toBe(true);
  });
});

describe('verification is refused on CANCELLED and on nothing else', () => {
  test('every other status can still be verified', () => {
    // The pin against gating the action on "completed", which would quietly
    // withdraw it from a failed or refunded voucher whose figures are exactly
    // the ones somebody wants checked.
    const verifiable = Object.values(ConstructionPaymentVoucherStatus).filter(
      (status) => status !== ConstructionPaymentVoucherStatus.CANCELLED
    );

    expect(verifiable.length).toBe(5);
    for (const status of verifiable) {
      expect(canVerifyPayment(voucher({ status }))).toBe(true);
    }
  });

  test('FAILED and REFUNDED specifically', () => {
    expect(
      canVerifyPayment(
        voucher({ status: ConstructionPaymentVoucherStatus.FAILED })
      )
    ).toBe(true);
    expect(
      canVerifyPayment(
        voucher({ status: ConstructionPaymentVoucherStatus.REFUNDED })
      )
    ).toBe(true);
  });

  test('every status other than CANCELLED is still editable', () => {
    const editable = Object.values(ConstructionPaymentVoucherStatus).filter(
      (status) => status !== ConstructionPaymentVoucherStatus.CANCELLED
    );

    for (const status of editable) {
      expect(canEditPayment(voucher({ status }))).toBe(true);
    }
  });
});

describe('the statuses an edit form may offer', () => {
  test('leaves CANCELLED out', () => {
    // Setting it through the update is refused: cancelling is its own action
    // with a required reason. An option whose only outcome is a 400 is worse
    // than no option.
    expect(settablePaymentStatuses).not.toContain(
      ConstructionPaymentVoucherStatus.CANCELLED
    );
  });

  test('keeps every other status', () => {
    expect(settablePaymentStatuses).toEqual([
      ConstructionPaymentVoucherStatus.PENDING,
      ConstructionPaymentVoucherStatus.PROCESSING,
      ConstructionPaymentVoucherStatus.COMPLETED,
      ConstructionPaymentVoucherStatus.FAILED,
      ConstructionPaymentVoucherStatus.REFUNDED,
    ]);
  });

  test('is derived from the enum, so a new status is offered without an edit here', () => {
    expect(settablePaymentStatuses.length).toBe(
      Object.values(ConstructionPaymentVoucherStatus).length - 1
    );
  });
});
