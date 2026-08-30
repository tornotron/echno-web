import { describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Two managers hold the same construction invoice. One decides it; the other's
 * page still carries the old status and still offers the action. The backend
 * refuses the second decision, and without a refetch the page goes on offering
 * it, failing the same way on every click. This is the race #344 closed on
 * stock adjustments and leave; the construction invoice runs the same
 * transitions through this workflow hook, so its error paths refetch the
 * document too.
 */
function failingMutation() {
  return {
    mutate: (
      _vars: unknown,
      options?: { onError?: (error: unknown) => void }
    ) => {
      options?.onError?.(new Error('Only submitted invoices can be approved'));
    },
    isPending: false,
  };
}

import * as realFinanceHooks from '@tornotron/echno-core/finance/hooks';

mock.module('@tornotron/echno-core/finance/hooks', () => ({
  ...realFinanceHooks,
  useSubmitConstructionInvoice: failingMutation,
  useApproveConstructionInvoice: failingMutation,
  useCancelConstructionInvoice: failingMutation,
  useRecordConstructionInvoicePayment: failingMutation,
}));

import * as realAuthorization from '@/hooks/use-authorization';

mock.module('@/hooks/use-authorization', () => ({
  ...realAuthorization,
  useAuthorization: () => ({ isSystemAdmin: true, isManager: false }),
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
  },
}));

const { useInvoiceWorkflow } = await import('./use-invoice-workflow');
const { invoiceKeys } = await import('@/hooks/invoices');

const INVOICE_ID = 'ci-31';

function seededClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(invoiceKeys.detail(INVOICE_ID), {
    id: INVOICE_ID,
    status: 'SUBMITTED',
  });
  return queryClient;
}

function wrapperFor(queryClient: QueryClient) {
  return function wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

function detailIsStale(queryClient: QueryClient): boolean {
  return Boolean(
    queryClient.getQueryState(invoiceKeys.detail(INVOICE_ID))?.isInvalidated
  );
}

describe('a construction-invoice decision that loses the race', () => {
  test('a failed approval refetches the document', () => {
    const queryClient = seededClient();
    const { result } = renderHook(() => useInvoiceWorkflow(), {
      wrapper: wrapperFor(queryClient),
    });

    expect(detailIsStale(queryClient)).toBe(false);
    result.current.approve(INVOICE_ID);
    expect(detailIsStale(queryClient)).toBe(true);
  });

  test('a failed cancel refetches it too', () => {
    const queryClient = seededClient();
    const { result } = renderHook(() => useInvoiceWorkflow(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.cancel(INVOICE_ID, 'Raised against the wrong project');
    expect(detailIsStale(queryClient)).toBe(true);
  });

  test('a failed submit and a failed payment refetch as well', () => {
    const queryClient = seededClient();
    const { result } = renderHook(() => useInvoiceWorkflow(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.submit(INVOICE_ID);
    expect(detailIsStale(queryClient)).toBe(true);

    const second = seededClient();
    const { result: again } = renderHook(() => useInvoiceWorkflow(), {
      wrapper: wrapperFor(second),
    });
    again.current.recordPayment(INVOICE_ID, 1000);
    expect(detailIsStale(second)).toBe(true);
  });
});
