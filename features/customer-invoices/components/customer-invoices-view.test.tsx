import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import * as realFinanceHooks from '@tornotron/echno-core/finance/hooks';
import type { PagedInvoice } from '@tornotron/echno-core/finance-invoice/services';

/**
 * The screen against the shape core's listing returns.
 *
 * The client it used to call unwrapped the Spring page into `{ rows, … }`;
 * core keeps the envelope and puts the invoices under `content`. Reading the
 * wrong one is not a crash, it is an empty table under a pager that still says
 * how many invoices there are, so it is worth a test rather than a glance.
 *
 * Assertions here stay on counts and strings: printing a Radix element into a
 * failure message hangs the reporter.
 */
function mutation() {
  return { mutate: mock((..._args: unknown[]) => {}), isPending: false };
}

let page: PagedInvoice | undefined;

mock.module('@tornotron/echno-core/finance/hooks', () => ({
  ...realFinanceHooks,
  useIssueInvoice: () => mutation(),
  useCancelInvoice: () => mutation(),
}));

mock.module('@/hooks/customer-invoices', () => ({
  useCustomerInvoices: () => ({
    data: page,
    isLoading: false,
    isError: false,
  }),
}));

mock.module('@/hooks/use-authorization', () => ({
  useAuthorization: () => ({ isSystemAdmin: true, isManager: false }),
}));

const { CustomerInvoicesView } = await import('./customer-invoices-view');

function invoice(over: Record<string, unknown> = {}) {
  return {
    id: 'b2c3d4e5-0000-4000-8000-000000000001',
    invoiceNumber: 'INV-2026-0042',
    customerName: 'Asset Homes Pvt Ltd',
    invoiceDate: '2026-08-01',
    dueDate: '2026-08-31',
    status: 'ISSUED',
    subtotal: 50_000,
    taxTotal: 9000,
    total: 59_000,
    amountPaid: 0,
    balanceDue: 59_000,
    lines: [],
    ...over,
  } as unknown as PagedInvoice['content'][number];
}

function screen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return render(createElement(CustomerInvoicesView), { wrapper });
}

afterEach(cleanup);

describe('CustomerInvoicesView', () => {
  test('renders the invoices core puts under content', () => {
    page = {
      content: [
        invoice(),
        invoice({
          id: 'b2c3d4e5-0000-4000-8000-000000000002',
          invoiceNumber: 'INV-2026-0043',
        }),
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 20,
    };

    const { queryAllByText } = screen();
    expect(queryAllByText('INV-2026-0042').length).toBe(1);
    expect(queryAllByText('INV-2026-0043').length).toBe(1);
    // The empty state must not be what a full page looks like.
    expect(queryAllByText('No customer invoices yet').length).toBe(0);
  });

  test('pages on the envelope total rather than the rows in hand', () => {
    // Page one of three. The rows say nothing about the other 40 invoices, so
    // the footer and the Next button both come off the envelope.
    page = {
      content: [invoice()],
      totalElements: 41,
      totalPages: 3,
      number: 0,
      size: 20,
    };

    const { queryAllByText, getByRole } = screen();
    expect(queryAllByText('41 invoices · page 1 of 3').length).toBe(1);
    expect((getByRole('button', { name: /Next/ }) as HTMLButtonElement).disabled).toBe(
      false
    );
  });

  test('an empty page reads as empty, not as a failure', () => {
    page = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 20,
    };

    const { queryAllByText } = screen();
    expect(queryAllByText('No customer invoices yet').length).toBe(1);
  });
});
