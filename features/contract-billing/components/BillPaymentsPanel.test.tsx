/**
 * What the payment panel offers each reader and what it sends. The role gate
 * and the hooks are stubs; every module replaced here is put back when the
 * file ends, because `mock.module` is process-wide and would otherwise keep
 * answering in whichever file runs next.
 *
 * Assertions are on strings, counts and booleans, never on a rendered node.
 */
import { afterAll, afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realHooks from '@tornotron/echno-core/contract-billing/hooks';
import {
  BillPaymentProvider,
  BillPaymentState,
  BillPaymentStatus,
  type Bill,
  type BillPayment,
  type BillPayments,
} from '@tornotron/echno-core/contract-billing/types';
import * as realUseCan from '@/hooks/use-can';
import * as realToastStyles from '@/lib/styles/toast-styles';
import { BILLING_SIGN_ACCESS, PAYABLES_ACCESS } from '@/nav/access/roles';
import type { AccessConfig } from '@/nav/access/roles';

// Copied now: a namespace object is live, so a mocked module reads as the mock.
const originals = {
  hooks: { ...realHooks },
  useCan: { ...realUseCan },
  toast: { ...realToastStyles },
};

let view: BillPayments;
let granted: AccessConfig[] = [];

const mutation = () => ({
  mutate: mock((..._args: unknown[]) => {}),
  isPending: false,
});
const raise = mutation();
const authorize = mutation();
const reject = mutation();
const record = mutation();
const sync = mutation();

mock.module('@tornotron/echno-core/contract-billing/hooks', () => ({
  ...originals.hooks,
  useBillPayments: () => ({ data: view, isPending: false, isError: false }),
  useRaiseBillPayment: () => raise,
  useAuthorizeBillPayment: () => authorize,
  useRejectBillPayment: () => reject,
  useRecordBillPayment: () => record,
  useSyncBillPayment: () => sync,
}));
mock.module('@/hooks/use-can', () => ({
  ...originals.useCan,
  useCan: (config: AccessConfig) => ({
    allowed: granted.includes(config),
    isLoading: false,
  }),
}));
mock.module('@/lib/styles/toast-styles', () => ({
  toast: { success: () => {}, error: () => {} },
}));

const { BillPaymentsPanel } = await import('./BillPaymentsPanel');

afterAll(() => {
  mock.module(
    '@tornotron/echno-core/contract-billing/hooks',
    () => originals.hooks
  );
  mock.module('@/hooks/use-can', () => originals.useCan);
  mock.module('@/lib/styles/toast-styles', () => originals.toast);
});

afterEach(() => {
  cleanup();
  granted = [];
  for (const m of [raise, authorize, reject, record, sync])
    m.mutate.mockClear();
});

const BILL = { id: 'b1', contractorName: 'Sree Builders' } as Bill;

function payment(overrides: Partial<BillPayment> = {}): BillPayment {
  return {
    id: 'p1',
    billId: 'b1',
    amount: 400,
    status: BillPaymentStatus.REQUESTED,
    provider: BillPaymentProvider.MANUAL,
    test: false,
    selfAuthorized: false,
    ...overrides,
  };
}

function payments(overrides: Partial<BillPayments> = {}): BillPayments {
  return {
    billId: 'b1',
    billNumber: 'RA-01',
    provider: BillPaymentProvider.MANUAL,
    amountRecorded: 1000,
    amountPaid: 0,
    amountDue: 1000,
    paymentState: BillPaymentState.UNPAID,
    inFlight: false,
    beneficiaryReady: true,
    payments: [],
    ...overrides,
  };
}

function panel() {
  return render(<BillPaymentsPanel bill={BILL} />);
}

describe('raising a payment', () => {
  test('a member without the role reads the figures and gets no form', () => {
    view = payments();
    const page = panel();
    expect(page.queryByText('Raise payment')).toBeNull();
    expect(page.queryAllByText('Due').length).toBe(1);
  });

  test('blank pays what is due', () => {
    granted = [BILLING_SIGN_ACCESS];
    view = payments();
    fireEvent.click(panel().getByText('Raise payment'));
    expect(raise.mutate.mock.calls[0]?.[0]).toEqual({
      billId: 'b1',
      req: { amount: 1000, note: undefined },
    });
  });

  test('more than is due is refused here, and nothing is sent', () => {
    granted = [BILLING_SIGN_ACCESS];
    view = payments();
    const page = panel();
    fireEvent.change(page.getByLabelText('Amount'), {
      target: { value: '1000.01' },
    });
    fireEvent.click(page.getByText('Raise payment'));
    expect(raise.mutate.mock.calls.length).toBe(0);
    expect(
      page.queryAllByText('That is more than is due on this bill.').length
    ).toBe(1);
  });

  test('a payment in flight takes the form away and says why', () => {
    granted = [BILLING_SIGN_ACCESS];
    view = payments({ inFlight: true, payments: [payment()] });
    const page = panel();
    expect(page.queryByText('Raise payment')).toBeNull();
    expect(
      (page.container.textContent ?? '').includes('A payment is in progress')
    ).toBe(true);
  });
});

describe('the second signature', () => {
  test('someone who can only raise cannot authorize', () => {
    granted = [BILLING_SIGN_ACCESS];
    view = payments({ inFlight: true, payments: [payment()] });
    expect(panel().queryByText('Authorize')).toBeNull();
  });

  test('authorizing through a provider says money goes straight away, and sends the id', () => {
    granted = [PAYABLES_ACCESS];
    view = payments({
      provider: BillPaymentProvider.RAZORPAY,
      inFlight: true,
      payments: [payment({ provider: BillPaymentProvider.RAZORPAY })],
    });
    const page = panel();
    fireEvent.click(page.getByText('Authorize'));
    expect(
      (document.body.textContent ?? '').includes(
        'through the provider straight away'
      )
    ).toBe(true);
    const buttons = page.getAllByText('Authorize');
    fireEvent.click(buttons.at(-1) as HTMLElement);
    expect(authorize.mutate.mock.calls[0]?.[0]).toBe('p1');
  });

  test('a manual payment that is signed is recorded with its bank reference', () => {
    granted = [PAYABLES_ACCESS];
    view = payments({
      inFlight: true,
      payments: [payment({ status: BillPaymentStatus.AUTHORIZED })],
    });
    const page = panel();
    fireEvent.click(page.getByText('Record as paid'));
    fireEvent.change(page.getByLabelText('Bank reference'), {
      target: { value: ' UTR-1 ' },
    });
    const buttons = page.getAllByText('Record as paid');
    fireEvent.click(buttons.at(-1) as HTMLElement);
    const args = record.mutate.mock.calls[0]?.[0] as {
      paymentId: string;
      req: { bankReference: string };
    };
    expect(args.paymentId).toBe('p1');
    expect(args.req.bankReference).toBe('UTR-1');
  });

  test('a rejection needs a reason', () => {
    granted = [PAYABLES_ACCESS];
    view = payments({ inFlight: true, payments: [payment()] });
    const page = panel();
    fireEvent.click(page.getByText('Reject'));
    const confirm = () => {
      const buttons = page.getAllByText('Reject');
      return buttons.at(-1) as HTMLButtonElement;
    };
    expect(confirm().disabled).toBe(true);
    fireEvent.change(page.getByLabelText('Reason'), {
      target: { value: 'Wrong amount' },
    });
    fireEvent.click(confirm());
    expect(reject.mutate.mock.calls[0]?.[0]).toEqual({
      paymentId: 'p1',
      text: 'Wrong amount',
    });
  });

  test('a provider payment offers Check status, and an error from it shows', () => {
    granted = [PAYABLES_ACCESS];
    view = payments({
      provider: BillPaymentProvider.RAZORPAY,
      inFlight: true,
      payments: [
        payment({
          provider: BillPaymentProvider.RAZORPAY,
          status: BillPaymentStatus.AUTHORIZED,
          lastError: 'Razorpay gave no usable answer',
        }),
      ],
    });
    const page = panel();
    expect(page.queryAllByText('Razorpay gave no usable answer').length).toBe(
      1
    );
    fireEvent.click(page.getByText('Check status'));
    expect(sync.mutate.mock.calls[0]?.[0]).toBe('p1');
  });
});

describe('what the page says', () => {
  test('test mode is unmissable, and each test payment says no money moved', () => {
    view = payments({
      provider: BillPaymentProvider.FAKE,
      payments: [
        payment({
          provider: BillPaymentProvider.FAKE,
          test: true,
          status: BillPaymentStatus.SETTLED,
        }),
      ],
    });
    const text = panel().container.textContent ?? '';
    expect(text.includes('Test payments')).toBe(true);
    expect(text.includes('Test, no money moved')).toBe(true);
  });

  test('a payment that went past what was due says finance must reconcile', () => {
    view = payments({
      payments: [
        payment({ status: BillPaymentStatus.SETTLED, appliedAmount: 100 }),
      ],
    });
    expect((panel().container.textContent ?? '').includes('to reconcile')).toBe(
      true
    );
  });
});
