import { describe, expect, test } from 'bun:test';
import {
  BillPaymentProvider,
  BillPaymentState,
  BillPaymentStatus,
  type BillPayments,
} from '@tornotron/echno-core/contract-billing/types';
import {
  PAYMENT_STATE_CLASSES,
  PAYMENT_STATE_LABELS,
  PAYMENT_STATUS_CLASSES,
  PAYMENT_STATUS_LABELS,
  PROVIDER_NOTES,
  parsePaymentAmount,
  paymentActions,
  raiseBlockedReason,
} from './payments';

const { MANUAL, FAKE, RAZORPAY } = BillPaymentProvider;

function view(overrides: Partial<BillPayments> = {}): BillPayments {
  return {
    billId: 'b1',
    billNumber: 'RA-01',
    provider: MANUAL,
    paymentState: BillPaymentState.UNPAID,
    amountDue: 1000,
    inFlight: false,
    beneficiaryReady: true,
    payments: [],
    ...overrides,
  };
}

describe('payment labels', () => {
  test('every status, state and provider says something', () => {
    for (const status of Object.values(BillPaymentStatus)) {
      expect(PAYMENT_STATUS_LABELS[status]).toBeTruthy();
      expect(PAYMENT_STATUS_CLASSES[status]).toBeTruthy();
    }
    for (const state of Object.values(BillPaymentState)) {
      expect(PAYMENT_STATE_LABELS[state]).toBeTruthy();
      expect(PAYMENT_STATE_CLASSES[state]).toBeTruthy();
    }
    for (const provider of Object.values(BillPaymentProvider)) {
      expect(PROVIDER_NOTES[provider]).toBeTruthy();
    }
    expect(PROVIDER_NOTES[FAKE]).toContain('no money moves');
  });
});

describe('paymentActions', () => {
  test('someone who cannot authorize gets no actions', () => {
    expect(
      paymentActions(
        { status: BillPaymentStatus.REQUESTED, provider: MANUAL },
        false
      )
    ).toEqual([]);
  });

  test('a requested payment is authorized or rejected, whatever carries it', () => {
    for (const provider of [MANUAL, RAZORPAY]) {
      expect(
        paymentActions({ status: BillPaymentStatus.REQUESTED, provider }, true)
      ).toEqual(['authorize', 'reject']);
    }
  });

  test('an authorized manual payment is recorded; a provider one is sent again', () => {
    expect(
      paymentActions(
        { status: BillPaymentStatus.AUTHORIZED, provider: MANUAL },
        true
      )
    ).toEqual(['record', 'reject']);
    expect(
      paymentActions(
        { status: BillPaymentStatus.AUTHORIZED, provider: RAZORPAY },
        true
      )
    ).toEqual(['sync', 'reject']);
  });

  test('a payment with the provider can only be asked about, and an ended one nothing', () => {
    expect(
      paymentActions(
        { status: BillPaymentStatus.PROCESSING, provider: FAKE },
        true
      )
    ).toEqual(['sync']);
    for (const status of [
      BillPaymentStatus.SETTLED,
      BillPaymentStatus.FAILED,
      BillPaymentStatus.REJECTED,
      BillPaymentStatus.REVERSED,
    ]) {
      expect(paymentActions({ status, provider: FAKE }, true)).toEqual([]);
    }
  });
});

describe('raiseBlockedReason', () => {
  test('an unpaid or part-paid bill with nothing in flight can be paid', () => {
    expect(raiseBlockedReason(view())).toBeNull();
    expect(
      raiseBlockedReason(view({ paymentState: BillPaymentState.PART_PAID }))
    ).toBeNull();
  });

  test('says why when it cannot', () => {
    expect(raiseBlockedReason(view({ paymentState: undefined }))).toContain(
      'final approval'
    );
    expect(
      raiseBlockedReason(view({ paymentState: BillPaymentState.PAID }))
    ).toContain('fully paid');
    expect(
      raiseBlockedReason(
        view({ paymentState: BillPaymentState.NOTHING_PAYABLE })
      )
    ).toContain('Nothing');
    expect(raiseBlockedReason(view({ inFlight: true }))).toContain(
      'in progress'
    );
  });

  test('a provider needs the bank details and a manual payment does not', () => {
    expect(
      raiseBlockedReason(view({ provider: RAZORPAY, beneficiaryReady: false }))
    ).toContain('IFSC');
    expect(
      raiseBlockedReason(view({ provider: MANUAL, beneficiaryReady: false }))
    ).toBeNull();
  });
});

describe('parsePaymentAmount', () => {
  test('reads an amount up to what is due', () => {
    expect(parsePaymentAmount('400.50', 1000)).toEqual({
      ok: true,
      amount: 400.5,
    });
    expect(parsePaymentAmount('1000', 1000)).toEqual({
      ok: true,
      amount: 1000,
    });
  });

  test('refuses blank, zero, too many places and more than is due', () => {
    for (const raw of ['', '0', 'abc', '-1']) {
      expect(parsePaymentAmount(raw, 1000).ok).toBe(false);
    }
    expect(parsePaymentAmount('1.234', 1000).ok).toBe(false);
    expect(parsePaymentAmount('1000.01', 1000).ok).toBe(false);
  });
});
