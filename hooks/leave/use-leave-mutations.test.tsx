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

/**
 * The same race from the other side. Two approvers hold the same pending
 * request; one decides it, and the other's screen still lists it and still
 * offers Approve, Reject and Delegate. The same 400 now also arrives as a 403,
 * for an account with no employee record in this organization, since the
 * backend reads the approver from the session rather than the payload.
 */
async function refuse(): Promise<never> {
  throw new Error('Leave request has already been decided');
}

const approveRequest = mock(refuse);
const rejectRequest = mock(refuse);
const delegateApproval = mock(refuse);

mock.module('@/services/leave-service', () => ({
  leaveService: {
    withdrawRequest,
    approveRequest,
    rejectRequest,
    delegateApproval,
  },
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
  },
}));

const {
  useWithdrawLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useDelegateApproval,
} = await import('./use-leave-mutations');
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

describe('a decision that loses the race', () => {
  const DECISIONS = [
    { name: 'approve', hook: useApproveLeaveRequest },
    { name: 'reject', hook: useRejectLeaveRequest },
    { name: 'delegate', hook: useDelegateApproval },
  ];

  for (const { name, hook } of DECISIONS) {
    test(`${name} refetches the request and this approver's queue`, async () => {
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
      queryClient.setQueryData(leaveKeys.pendingApprovals(EMPLOYEE_ID), [
        { id: REQUEST_ID },
      ]);
      queryClient.setQueryData(leaveKeys.pendingApprovalsCount(EMPLOYEE_ID), 1);

      const { result } = renderHook(() => hook(), {
        wrapper: wrapperFor(queryClient),
      });

      const invalidated = () => [
        Boolean(
          queryClient.getQueryState(leaveKeys.request(REQUEST_ID))
            ?.isInvalidated
        ),
        Boolean(
          queryClient.getQueryState(leaveKeys.pendingApprovals(EMPLOYEE_ID))
            ?.isInvalidated
        ),
        Boolean(
          queryClient.getQueryState(
            leaveKeys.pendingApprovalsCount(EMPLOYEE_ID)
          )?.isInvalidated
        ),
      ];

      expect(invalidated()).toEqual([false, false, false]);

      result.current.mutate({
        requestId: REQUEST_ID,
        approverId: EMPLOYEE_ID,
        dto: { comments: 'Cover arranged.' },
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // All three, or the screen keeps a queue entry and a count that say the
      // request is still this approver's to decide.
      expect(invalidated()).toEqual([true, true, true]);
    });
  }
});
