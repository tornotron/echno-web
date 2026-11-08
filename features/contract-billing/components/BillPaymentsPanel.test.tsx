/**
 * What the payment panel offers each reader and what it sends. Raising is a
 * role; every step after it belongs to the project's payment authorizer, which
 * the server reports per reader. The role gate and the hooks are stubs; every
 * module replaced here is put back when the file ends, because `mock.module` is process-wide and would otherwise keep
 * answering in whichever file runs next.
 *
 * Assertions are on strings, counts and booleans, never on a rendered node.
 */
import { afterAll, afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realHooks from '@tornotron/echno-core/contract-billing/hooks';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import {
  BillPaymentAuthorizeBlock,
  BillPaymentProvider,
  BillPaymentState,
  BillPaymentStatus,
  type Bill,
  type BillPayment,
  type BillPayments,
  type ProjectPaymentAuthorizer,
} from '@tornotron/echno-core/contract-billing/types';
import { EmployeeStatus } from '@tornotron/echno-core/employee/types';
import * as realUseCan from '@/hooks/use-can';
import * as realToastStyles from '@/lib/styles/toast-styles';
import { BILLING_SIGN_ACCESS, PAYABLES_ACCESS } from '@/nav/access/roles';
import type { AccessConfig } from '@/nav/access/roles';

// Copied now: a namespace object is live, so a mocked module reads as the mock.
const originals = {
  hooks: { ...realHooks },
  employeeHooks: { ...realEmployeeHooks },
  useCan: { ...realUseCan },
  toast: { ...realToastStyles },
};

let view: BillPayments;
let authorizer: ProjectPaymentAuthorizer;
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
const setAuthorizer = mutation();
const clearAuthorizer = mutation();

mock.module('@tornotron/echno-core/contract-billing/hooks', () => ({
  ...originals.hooks,
  useBillPayments: () => ({ data: view, isPending: false, isError: false }),
  useRaiseBillPayment: () => raise,
  useAuthorizeBillPayment: () => authorize,
  useRejectBillPayment: () => reject,
  useRecordBillPayment: () => record,
  useSyncBillPayment: () => sync,
  usePaymentAuthorizer: () => ({
    data: authorizer,
    isPending: false,
    isError: false,
  }),
  useSetPaymentAuthorizer: () => setAuthorizer,
  useClearPaymentAuthorizer: () => clearAuthorizer,
}));
mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...originals.employeeHooks,
  useEmployeeLookup: () => ({
    data: [
      {
        id: 3,
        employeeId: 'E3',
        name: 'Meera',
        designation: 'Accounts',
        status: EmployeeStatus.active,
        organizationId: 1,
      },
      {
        id: 4,
        employeeId: 'E4',
        name: 'Arun',
        designation: '',
        status: EmployeeStatus.active,
        organizationId: 1,
      },
      {
        id: 5,
        employeeId: 'E5',
        name: 'Gone',
        designation: '',
        status: EmployeeStatus.resigned,
        organizationId: 1,
      },
    ],
  }),
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
  mock.module(
    '@tornotron/echno-core/employee/hooks',
    () => originals.employeeHooks
  );
  mock.module('@/hooks/use-can', () => originals.useCan);
  mock.module('@/lib/styles/toast-styles', () => originals.toast);
});

afterEach(() => {
  cleanup();
  granted = [];
  for (const m of [
    raise,
    authorize,
    reject,
    record,
    sync,
    setAuthorizer,
    clearAuthorizer,
  ])
    m.mutate.mockClear();
  authorizer = projectAuthorizer();
});

const BILL = {
  id: 'b1',
  projectId: 7,
  contractorName: 'Sree Builders',
} as Bill;

function projectAuthorizer(
  overrides: Partial<ProjectPaymentAuthorizer> = {}
): ProjectPaymentAuthorizer {
  return {
    projectId: 7,
    employeeId: 3,
    employeeName: 'Meera',
    active: true,
    readerIsAuthorizer: false,
    readerMayChange: false,
    changes: [],
    ...overrides,
  };
}
authorizer = projectAuthorizer();

function payment(overrides: Partial<BillPayment> = {}): BillPayment {
  return {
    id: 'p1',
    billId: 'b1',
    amount: 400,
    status: BillPaymentStatus.REQUESTED,
    provider: BillPaymentProvider.MANUAL,
    test: false,
    selfAuthorized: false,
    readerMayAuthorize: false,
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
    projectId: 7,
    authorizerEmployeeId: 3,
    authorizerName: 'Meera',
    authorizerActive: true,
    readerIsAuthorizer: false,
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
  test('someone who can only raise cannot authorize, and is told who can', () => {
    granted = [BILLING_SIGN_ACCESS];
    view = payments({
      inFlight: true,
      payments: [
        payment({
          authorizeBlock: BillPaymentAuthorizeBlock.NOT_THE_AUTHORIZER,
        }),
      ],
    });
    const page = panel();
    expect(page.queryByText('Authorize')).toBeNull();
    expect(
      (page.container.textContent ?? '').includes(
        "Waiting for Meera, this project's payment authorizer."
      )
    ).toBe(true);
  });

  test('the old payables role no longer signs; only the project authorizer does', () => {
    granted = [PAYABLES_ACCESS, BILLING_SIGN_ACCESS];
    view = payments({
      inFlight: true,
      payments: [
        payment({
          authorizeBlock: BillPaymentAuthorizeBlock.NOT_THE_AUTHORIZER,
        }),
      ],
    });
    const page = panel();
    expect(page.queryByText('Authorize')).toBeNull();
    expect(page.queryByText('Reject')).toBeNull();
  });

  test('the authorizer who raised a payment may withdraw it but not sign it, and is told why', () => {
    view = payments({
      readerIsAuthorizer: true,
      inFlight: true,
      payments: [
        payment({ authorizeBlock: BillPaymentAuthorizeBlock.OWN_REQUEST }),
      ],
    });
    const page = panel();
    expect(page.queryByText('Authorize')).toBeNull();
    expect(page.queryAllByText('Reject').length).toBe(1);
    expect(
      (page.container.textContent ?? '').includes('You raised this payment')
    ).toBe(true);
  });

  test('authorizing through a provider says money goes straight away, and sends the id', () => {
    view = payments({
      readerIsAuthorizer: true,
      provider: BillPaymentProvider.RAZORPAY,
      inFlight: true,
      payments: [
        payment({
          provider: BillPaymentProvider.RAZORPAY,
          readerMayAuthorize: true,
        }),
      ],
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
    view = payments({
      readerIsAuthorizer: true,
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
    view = payments({
      readerIsAuthorizer: true,
      inFlight: true,
      payments: [payment()],
    });
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
    view = payments({
      readerIsAuthorizer: true,
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

describe("the project's payment authorizer", () => {
  test('everyone sees who it is, and only a manager may change it', () => {
    view = payments();
    let page = panel();
    expect((page.container.textContent ?? '').includes('Meera')).toBe(true);
    expect(page.queryByText('Save')).toBeNull();
    cleanup();

    authorizer = projectAuthorizer({ readerMayChange: true });
    page = panel();
    expect(page.queryAllByText('Save').length).toBe(1);
    expect(page.queryAllByText('Clear').length).toBe(1);
  });

  test('a project with no authorizer says its payments wait', () => {
    authorizer = projectAuthorizer({
      employeeId: undefined,
      employeeName: undefined,
      active: false,
    });
    view = payments({
      authorizerEmployeeId: undefined,
      authorizerName: undefined,
      authorizerActive: false,
    });
    const text = panel().container.textContent ?? '';
    expect(
      text.includes('No one is named, so payments on this project wait.')
    ).toBe(true);
  });

  test('clearing sends the project id', () => {
    authorizer = projectAuthorizer({ readerMayChange: true });
    view = payments();
    fireEvent.click(panel().getByText('Clear'));
    expect(clearAuthorizer.mutate.mock.calls[0]?.[0]).toBe(7);
  });

  test('the history reads as sentences', () => {
    authorizer = projectAuthorizer({
      changes: [
        {
          id: 'c1',
          previousEmployeeName: 'Arun',
          employeeName: 'Meera',
          changedByName: 'Ravi',
        },
      ],
    });
    view = payments();
    expect(
      (panel().container.textContent ?? '').includes(
        'Ravi replaced Arun with Meera'
      )
    ).toBe(true);
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
