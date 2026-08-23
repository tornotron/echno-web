import { afterEach, describe, expect, mock, test } from 'bun:test';
import * as realApiClient from '@/lib/api/api-client';

// Spy versions of the HTTP verbs the service calls. Each test sets the
// implementation it needs and inspects the recorded call arguments.
const api = {
  get: mock(async (..._args: unknown[]) => [] as unknown),
  post: mock(async (..._args: unknown[]) => ({}) as unknown),
  patch: mock(async (..._args: unknown[]) => ({}) as unknown),
  put: mock(async (..._args: unknown[]) => ({}) as unknown),
  delete: mock(async (..._args: unknown[]) => ({}) as unknown),
};

// Keep the real ApiError so the service's `instanceof`/status handling is real;
// swap only the `api` object for the spies above.
mock.module('@/lib/api/api-client', () => ({
  ...realApiClient,
  api,
}));

const { leaveService } = await import('./leave-service');

/** Query params passed to the most recent api.get call. */
function lastGetParams(): unknown {
  const calls = api.get.mock.calls;
  return calls[calls.length - 1][1];
}

/** Endpoint passed to the most recent api.get call. */
function lastGetEndpoint(): unknown {
  const calls = api.get.mock.calls;
  return calls[calls.length - 1][0];
}

afterEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  api.patch.mockReset();
  api.put.mockReset();
  api.delete.mockReset();
});

describe('count endpoints default to zero', () => {
  test('getPendingApprovalsCount returns the backend count', async () => {
    api.get.mockImplementation(async () => ({ count: 3 }));
    expect(await leaveService.getPendingApprovalsCount(5)).toBe(3);
    expect(lastGetEndpoint()).toBe(
      '/leave-requests/web/pending-approvals/count'
    );
    expect(lastGetParams()).toEqual({ approverId: 5 });
  });

  test('getPendingApprovalsCount falls back to 0 when count is absent', async () => {
    api.get.mockImplementation(async () => ({}));
    expect(await leaveService.getPendingApprovalsCount(5)).toBe(0);
  });

  test('getUnreadCount returns the backend count and defaults to 0', async () => {
    api.get.mockImplementation(async () => ({ count: 7 }));
    expect(await leaveService.getUnreadCount(9)).toBe(7);
    api.get.mockImplementation(async () => ({}));
    expect(await leaveService.getUnreadCount(9)).toBe(0);
  });
});

describe('calculateDays', () => {
  test('returns the computed total', async () => {
    api.post.mockImplementation(async () => ({ totalDays: 2.5 }));
    const result = await leaveService.calculateDays({
      startDate: '2026-01-01',
      endDate: '2026-01-03',
    });
    expect(result).toEqual({ totalDays: 2.5 });
    expect(api.post.mock.calls[0][0]).toBe(
      '/leave-requests/web/calculate-days'
    );
  });

  test('defaults totalDays to 0 when the backend omits it', async () => {
    api.post.mockImplementation(async () => ({}));
    const result = await leaveService.calculateDays({
      startDate: '2026-01-01',
      endDate: '2026-01-01',
    });
    expect(result.totalDays).toBe(0);
  });
});

describe('canApprove', () => {
  test('maps the flag and reason through', async () => {
    api.get.mockImplementation(async () => ({
      canApprove: true,
      reason: 'is manager',
    }));
    expect(await leaveService.canApprove(1, 2)).toEqual({
      canApprove: true,
      reason: 'is manager',
    });
  });

  test('defaults canApprove to false when absent', async () => {
    api.get.mockImplementation(async () => ({}));
    const result = await leaveService.canApprove(1, 2);
    expect(result.canApprove).toBe(false);
    expect(result.reason).toBeUndefined();
  });
});

describe('getApprovalChain', () => {
  test('falls back to the requested id and an empty chain', async () => {
    api.get.mockImplementation(async () => ({}));
    const result = await leaveService.getApprovalChain(88);
    expect(result.requestId).toBe(88);
    expect(result.approvals).toEqual([]);
  });

  test('uses the backend requestId when present', async () => {
    api.get.mockImplementation(async () => ({ requestId: 5, approvals: [] }));
    const result = await leaveService.getApprovalChain(88);
    expect(result.requestId).toBe(5);
  });
});

describe('getLeaveCount', () => {
  test('parses the backend date and count', async () => {
    api.get.mockImplementation(async () => ({
      date: '2026-01-10',
      count: 4,
    }));
    const result = await leaveService.getLeaveCount(1, '2026-01-15');
    expect(result.count).toBe(4);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.getTime()).toBe(new Date('2026-01-10').getTime());
  });

  test('falls back to the requested date and a zero count', async () => {
    api.get.mockImplementation(async () => ({}));
    const result = await leaveService.getLeaveCount(1, '2026-01-15');
    expect(result.count).toBe(0);
    expect(result.date.getTime()).toBe(new Date('2026-01-15').getTime());
  });
});

describe('checkConflicts', () => {
  test('returns no conflicts and an empty list by default', async () => {
    api.get.mockImplementation(async () => ({ hasConflict: false }));
    const result = await leaveService.checkConflicts(1, '2026-01-01', '2026-01-05');
    expect(result.hasConflict).toBe(false);
    expect(result.conflictingRequests).toEqual([]);
    expect(lastGetParams()).toEqual({
      employeeId: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-05',
    });
  });

  test('parses the conflicting requests when present', async () => {
    api.get.mockImplementation(async () => ({
      hasConflict: true,
      conflictingRequests: [{ id: 10, employeeId: 1, leavePolicyId: 2 }],
    }));
    const result = await leaveService.checkConflicts(1, '2026-01-01', '2026-01-05');
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingRequests).toHaveLength(1);
    expect(result.conflictingRequests[0].id).toBe(10);
  });
});

describe('optional query params are omitted when not supplied', () => {
  test('getEmployeeBalances adds year only when given', async () => {
    api.get.mockImplementation(async () => []);
    await leaveService.getEmployeeBalances(3);
    expect(lastGetParams()).toEqual({ employeeId: 3 });

    await leaveService.getEmployeeBalances(3, 2026);
    expect(lastGetParams()).toEqual({ employeeId: 3, year: 2026 });
  });

  test('getEmployeeRequests keeps page 0 but drops an undefined size', async () => {
    api.get.mockImplementation(async () => []);
    await leaveService.getEmployeeRequests(4, 0);
    expect(lastGetParams()).toEqual({ employeeId: 4, page: 0 });
  });

  test('getOrganizationRequests passes undefined params when none are set', async () => {
    api.get.mockImplementation(async () => []);
    await leaveService.getOrganizationRequests();
    expect(lastGetParams()).toBeUndefined();
  });

  test('getOrganizationRequests passes a params object once a page is set', async () => {
    api.get.mockImplementation(async () => []);
    await leaveService.getOrganizationRequests(2, 25);
    expect(lastGetParams()).toEqual({ page: 2, size: 25 });
  });
});

describe('array-returning endpoints guard against non-array payloads', () => {
  test('getTransactionHistory returns [] when the payload is not an array', async () => {
    api.get.mockImplementation(async () => ({ unexpected: true }));
    expect(await leaveService.getTransactionHistory(1)).toEqual([]);
  });

  test('getNotifications returns [] when the payload is not an array', async () => {
    api.get.mockImplementation(async () => null);
    expect(await leaveService.getNotifications(1)).toEqual([]);
  });

  test('getOrganizationCalendar returns [] when the payload is not an array', async () => {
    api.get.mockImplementation(async () => ({}));
    expect(
      await leaveService.getOrganizationCalendar(1, '2026-01-01', '2026-01-31')
    ).toEqual([]);
  });
});

describe('parse failures are surfaced as 422 ApiErrors', () => {
  test('getAllPolicies wraps a malformed item as an ApiError', async () => {
    api.get.mockImplementation(async () => [{ leaveTypeName: 'Casual' }]);
    const error = (await leaveService
      .getAllPolicies()
      .catch((error_) => error_)) as realApiClient.ApiError;
    expect(error).toBeInstanceOf(realApiClient.ApiError);
    expect(error.status).toBe(422);
    expect(error.message).toContain('leave policies');
  });

  test('getAllPolicies returns [] when the payload is not an array', async () => {
    api.get.mockImplementation(async () => ({}));
    expect(await leaveService.getAllPolicies()).toEqual([]);
  });

  test('getAllPolicies parses a valid policy list', async () => {
    api.get.mockImplementation(async () => [
      { id: 1, organizationId: 2, leaveTypeName: 'Casual' },
    ]);
    const policies = await leaveService.getAllPolicies();
    expect(policies).toHaveLength(1);
    expect(policies[0].id).toBe(1);
    expect(policies[0].leaveTypeName).toBe('Casual');
  });

  test('getPolicyById wraps a malformed single object as an ApiError', async () => {
    api.get.mockImplementation(async () => ({ leaveTypeName: 'Casual' }));
    const error = (await leaveService
      .getPolicyById(1)
      .catch((error_) => error_)) as realApiClient.ApiError;
    expect(error).toBeInstanceOf(realApiClient.ApiError);
    expect(error.status).toBe(422);
  });
});
