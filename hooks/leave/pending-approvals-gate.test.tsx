/**
 * The sidebar asks for the pending-approvals badge with `0` for anyone who
 * cannot approve leave. That `0` has to keep the query off: the backend reads
 * the approver from the session, so a non-manager's request would be a 403
 * on every authenticated page.
 */

import { describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const getPendingApprovalsCount = mock(async () => 3);

mock.module('@tornotron/echno-core/leave/services', () => ({
  leaveService: { getPendingApprovalsCount },
}));

const { usePendingApprovalsCount, leaveKeys } =
  await import('@tornotron/echno-core/leave/hooks');

function wrapperFor(queryClient: QueryClient) {
  return function wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

function freshClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe('usePendingApprovalsCount', () => {
  test('issues no fetch for approver id 0', async () => {
    getPendingApprovalsCount.mockClear();
    const queryClient = freshClient();
    const { result } = renderHook(() => usePendingApprovalsCount(0), {
      wrapper: wrapperFor(queryClient),
    });

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(getPendingApprovalsCount).toHaveBeenCalledTimes(0);
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(
      queryClient.getQueryState(leaveKeys.pendingApprovalsCount(0))?.status
    ).not.toBe('success');
  });

  test('fetches once for a real approver and leaves the id out of the call', async () => {
    getPendingApprovalsCount.mockClear();
    const queryClient = freshClient();
    const { result } = renderHook(() => usePendingApprovalsCount(12), {
      wrapper: wrapperFor(queryClient),
    });

    await waitFor(() => expect(result.current.data).toBe(3));

    expect(getPendingApprovalsCount).toHaveBeenCalledTimes(1);
    expect(getPendingApprovalsCount.mock.calls[0]).toEqual([]);
    expect(queryClient.getQueryData(leaveKeys.pendingApprovalsCount(12))).toBe(
      3
    );
  });
});
