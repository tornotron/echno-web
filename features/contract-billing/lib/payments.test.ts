import { describe, expect, test } from 'bun:test';
import {
  BillPaymentAuthority,
  BillPaymentAuthorizeBlock,
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
  authorizeWaitReason,
  authorizedByText,
  authorizerChangeText,
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
    authorizerActive: true,
    readerIsAuthorizer: false,
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

const signable = { readerMayAuthorize: true };

describe('paymentActions', () => {
  test("someone who is not the project's authorizer gets no actions, whatever their role", () => {
    expect(
      paymentActions(
        { status: BillPaymentStatus.REQUESTED, provider: MANUAL, ...signable },
        false
      )
    ).toEqual([]);
  });

  test('a requested payment is authorized or rejected, whatever carries it', () => {
    for (const provider of [MANUAL, RAZORPAY]) {
      expect(
        paymentActions(
          { status: BillPaymentStatus.REQUESTED, provider, ...signable },
          true
        )
      ).toEqual(['authorize', 'reject']);
    }
  });

  test('the authorizer cannot sign a payment they raised, but can withdraw it', () => {
    expect(
      paymentActions(
        {
          status: BillPaymentStatus.REQUESTED,
          provider: MANUAL,
          readerMayAuthorize: false,
        },
        true
      )
    ).toEqual(['reject']);
  });

  test('an authorized manual payment is recorded; a provider one is sent again', () => {
    expect(
      paymentActions(
        { status: BillPaymentStatus.AUTHORIZED, provider: MANUAL, ...signable },
        true
      )
    ).toEqual(['record', 'reject']);
    expect(
      paymentActions(
        {
          status: BillPaymentStatus.AUTHORIZED,
          provider: RAZORPAY,
          ...signable,
        },
        true
      )
    ).toEqual(['sync', 'reject']);
  });

  test('a payment with the provider can only be asked about, and an ended one nothing', () => {
    expect(
      paymentActions(
        { status: BillPaymentStatus.PROCESSING, provider: FAKE, ...signable },
        true
      )
    ).toEqual(['sync']);
    for (const status of [
      BillPaymentStatus.SETTLED,
      BillPaymentStatus.FAILED,
      BillPaymentStatus.REJECTED,
      BillPaymentStatus.REVERSED,
    ]) {
      expect(
        paymentActions({ status, provider: FAKE, ...signable }, true)
      ).toEqual([]);
    }
  });
});

const requested = (authorizeBlock?: BillPaymentAuthorizeBlock) => ({
  status: BillPaymentStatus.REQUESTED,
  authorizeBlock,
});

describe('why the Authorize button is absent', () => {
  test('each reason says who can unblock it', () => {
    const named = view({ authorizerName: 'Meera' });
    expect(
      authorizeWaitReason(
        requested(BillPaymentAuthorizeBlock.NOT_THE_AUTHORIZER),
        named
      )
    ).toBe("Waiting for Meera, this project's payment authorizer.");
    expect(
      authorizeWaitReason(
        requested(BillPaymentAuthorizeBlock.OWN_REQUEST),
        named
      )
    ).toContain('You raised this payment');
    expect(
      authorizeWaitReason(
        requested(BillPaymentAuthorizeBlock.RAISED_BY_THE_AUTHORIZER),
        named
      )
    ).toContain(
      "Meera raised this payment and is the project's only payment authorizer"
    );
    expect(
      authorizeWaitReason(
        requested(BillPaymentAuthorizeBlock.NO_AUTHORIZER),
        view({ authorizerName: undefined, authorizerActive: false })
      )
    ).toContain('has no payment authorizer');
    expect(
      authorizeWaitReason(
        requested(BillPaymentAuthorizeBlock.NO_AUTHORIZER),
        view({ authorizerName: 'Meera', authorizerActive: false })
      )
    ).toContain(
      "Meera, this project's payment authorizer, is no longer active"
    );
  });

  test('nothing to say when the reader may sign, or the payment is past that step', () => {
    expect(authorizeWaitReason(requested(undefined), view())).toBeNull();
    expect(
      authorizeWaitReason(
        { status: BillPaymentStatus.AUTHORIZED, authorizeBlock: undefined },
        view()
      )
    ).toBeNull();
  });

  test('an authorization says the capacity it was given in, and an old self-authorization says so', () => {
    expect(
      authorizedByText({
        authorizedByName: 'Meera',
        authorizedAs: BillPaymentAuthority.PROJECT_AUTHORIZER,
        selfAuthorized: false,
      })
    ).toBe("Authorized by Meera, the project's payment authorizer");
    expect(
      authorizedByText({ authorizedByName: 'Admin', selfAuthorized: true })
    ).toBe('Authorized by Admin, who raised it');
    expect(authorizedByText({ selfAuthorized: false })).toBeNull();
  });

  test('a change of authorizer reads as a sentence', () => {
    expect(
      authorizerChangeText({
        id: 'c1',
        employeeName: 'Meera',
        changedByName: 'Ravi',
      })
    ).toBe('Ravi named Meera');
    expect(
      authorizerChangeText({
        id: 'c2',
        previousEmployeeName: 'Meera',
        employeeName: 'Arun',
        changedByName: 'Ravi',
      })
    ).toBe('Ravi replaced Meera with Arun');
    expect(
      authorizerChangeText({
        id: 'c3',
        previousEmployeeName: 'Arun',
        changedByName: 'Ravi',
      })
    ).toBe('Ravi cleared Arun');
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
