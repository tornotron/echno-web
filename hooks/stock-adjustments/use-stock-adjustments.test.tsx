import { describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Two managers hold the same document. One decides it; the other's page still
 * says draft, because nothing told it otherwise, and still offers approve,
 * reject, edit and delete. The backend refuses the second decision with a 400
 * naming the real status, and the toast says so, but the page goes on offering
 * the action, so every further click repeats the same failure.
 *
 * The mutations therefore refetch the document when they fail, which is the one
 * moment the client has evidence that what it holds is stale.
 */
const approve = mock(async (_id: number) => {
  throw new Error('was rejected on 2026-08-29 and cannot be approved');
});
const reject = mock(async (_id: number, _reason: string) => {
  throw new Error('was posted to the stock ledger and cannot be rejected');
});

mock.module('@/services/stock-adjustments-service', () => ({
  stockAdjustmentsService: { approve, reject },
}));

const { useApproveStockAdjustment, useRejectStockAdjustment } =
  await import('./use-stock-adjustments');
const { stockAdjustmentKeys } = await import('./stock-adjustment-keys');

const ADJUSTMENT_ID = 21;

/** A client holding the stale copy of the document, as the open page does. */
function seededClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(stockAdjustmentKeys.detail(ADJUSTMENT_ID), {
    id: ADJUSTMENT_ID,
    status: 'draft',
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
    queryClient.getQueryState(stockAdjustmentKeys.detail(ADJUSTMENT_ID))
      ?.isInvalidated
  );
}

describe('a decision that loses the race', () => {
  test('a failed approval refetches the document', async () => {
    const queryClient = seededClient();
    const { result } = renderHook(() => useApproveStockAdjustment(), {
      wrapper: wrapperFor(queryClient),
    });

    expect(detailIsStale(queryClient)).toBe(false);
    result.current.mutate(ADJUSTMENT_ID);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(detailIsStale(queryClient)).toBe(true);
  });

  test('a failed rejection refetches it too', async () => {
    const queryClient = seededClient();
    const { result } = renderHook(() => useRejectStockAdjustment(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ id: ADJUSTMENT_ID, reason: 'Counted twice' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(detailIsStale(queryClient)).toBe(true);
  });
});
