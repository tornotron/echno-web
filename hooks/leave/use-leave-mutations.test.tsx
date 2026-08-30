import { describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * The employee's page and the approver's page hold the same request. Once the
 * approver decides it, the employee's copy still says pending and still offers
 * Withdraw; the backend refuses it, and without a refetch the button stays
 * there, failing the same way on every click.
 */
const withdrawRequest = mock(
  async (_requestId: number, _employeeId: number) => {
    throw new Error('Leave request has already been approved');
  }
);

mock.module('@/services/leave-service', () => ({
  leaveService: { withdrawRequest },
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
  },
}));

const { useWithdrawLeaveRequest } = await import('./use-leave-mutations');
const { leaveKeys } = await import('./use-leave');

const REQUEST_ID = 88;
const EMPLOYEE_ID = 12;

function wrapperFor(queryClient: QueryClient) {
  return function wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe('a withdrawal that loses the race', () => {
  test('refetches the request rather than leaving the button on a decided one', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(leaveKeys.request(REQUEST_ID), {
      id: REQUEST_ID,
      status: 'pending',
    });

    const { result } = renderHook(() => useWithdrawLeaveRequest(), {
      wrapper: wrapperFor(queryClient),
    });

    expect(
      Boolean(
        queryClient.getQueryState(leaveKeys.request(REQUEST_ID))?.isInvalidated
      )
    ).toBe(false);

    result.current.mutate({ requestId: REQUEST_ID, employeeId: EMPLOYEE_ID });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(
      Boolean(
        queryClient.getQueryState(leaveKeys.request(REQUEST_ID))?.isInvalidated
      )
    ).toBe(true);
  });
});
