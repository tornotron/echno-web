import { describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { financeKeys } from '@tornotron/echno-core/finance/hooks/keys';
import * as realInvoiceService from '@tornotron/echno-core/finance-invoice/services';

/**
 * The listing moved out of a screen-local client and onto core 2.3.0's
 * `financeInvoiceService.list`, cached under core's own key.
 *
 * Two things have to hold for that to be a move rather than a rewrite. The page
 * envelope has to survive, because the pager reads its total off it and cannot
 * recover it from a page of rows. And the key has to be the one core's
 * mutations invalidate: the screen refetches on a failed decision, and a
 * listing cached under a key that prefix no longer covers would sit there
 * offering an action the server has already refused.
 */
const list = mock(async (_params: unknown) => ({
  content: [
    {
      id: 'b2c3d4e5-0000-4000-8000-000000000001',
      invoiceNumber: 'INV-2026-0042',
    },
  ],
  totalElements: 41,
  totalPages: 3,
  number: 0,
  size: 20,
}));

mock.module('@tornotron/echno-core/finance-invoice/services', () => ({
  ...realInvoiceService,
  financeInvoiceService: { ...realInvoiceService.financeInvoiceService, list },
}));

const { useCustomerInvoices } = await import('./use-customer-invoices');

function wrapperFor(queryClient: QueryClient) {
  return function wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

function client() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe('useCustomerInvoices', () => {
  test('hands back the page envelope, not just its rows', async () => {
    const queryClient = client();
    const { result } = renderHook(() => useCustomerInvoices({ pageNo: 0 }), {
      wrapper: wrapperFor(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.content.length).toBe(1);
    expect(result.current.data?.content[0].invoiceNumber).toBe('INV-2026-0042');
    // The count the pager needs. A page of one row says nothing about the 41.
    expect(result.current.data?.totalElements).toBe(41);
    expect(result.current.data?.totalPages).toBe(3);
  });

  test('caches under the key the screen invalidates', async () => {
    const queryClient = client();
    const params = { pageNo: 1, openOnly: true };
    const { result } = renderHook(() => useCustomerInvoices(params), {
      wrapper: wrapperFor(queryClient),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // The entry is where core's mutations expect to find it.
    const cached = queryClient.getQueryData(financeKeys.invoicesList(params));
    expect(cached === undefined).toBe(false);

    // And the prefix the screen invalidates on a decision, successful or
    // refused, actually reaches it: an active listing under that prefix
    // refetches rather than sitting on rows the server has moved past.
    const before = list.mock.calls.length;
    queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(before));
  });
});
