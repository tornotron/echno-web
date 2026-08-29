import { afterEach, describe, expect, mock, test } from 'bun:test';
import * as realApiClient from '@/lib/api/api-client';

// Spy versions of the HTTP verbs the service calls. Kept in a file of their
// own because `mock.module` has to run before the service is imported, and the
// rest of the suite exercises the pure mapping functions against the real
// module.
const api = {
  get: mock(async (..._args: unknown[]) => ({}) as unknown),
  post: mock(async (..._args: unknown[]) => ({}) as unknown),
  put: mock(async (..._args: unknown[]) => ({}) as unknown),
  delete: mock(async (..._args: unknown[]) => ({}) as unknown),
};

mock.module('@/lib/api/api-client', () => ({
  ...realApiClient,
  api,
}));

const { stockAdjustmentsService } = await import('./stock-adjustments-service');

afterEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  api.put.mockReset();
  api.delete.mockReset();
});

describe('approve', () => {
  test('posts to the backend approval path for that document', async () => {
    api.post.mockImplementation(async () => ({ id: 14, status: 'processed' }));

    await stockAdjustmentsService.approve(14);

    expect(api.post.mock.calls).toHaveLength(1);
    expect(api.post.mock.calls[0][0]).toBe('/stock-adjustments/web/14/approve');
  });

  test('sends no body: the approver comes from the session', async () => {
    api.post.mockImplementation(async () => ({ id: 14 }));

    await stockAdjustmentsService.approve(14);

    expect(api.post.mock.calls[0][1]).toBeUndefined();
  });

  test('returns the posted document parsed', async () => {
    api.post.mockImplementation(async () => ({
      id: 14,
      adjustmentNumber: 'SA-2026-0014',
      status: 'processed',
      projectId: 4,
      approvedBy: 9,
      approvedAt: '2026-01-16T09:00:00',
      lineItems: [{ id: 3, materialId: 21, adjustmentQuantity: -20 }],
    }));

    const approved = await stockAdjustmentsService.approve(14);

    expect(approved.status).toBe('processed');
    expect(approved.approvedBy).toBe(9);
    expect(approved.approvedAt?.getFullYear()).toBe(2026);
    expect(approved.lineItems[0].materialId).toBe(21);
  });

  test('a refusal from the backend is not swallowed', async () => {
    api.post.mockImplementation(async () => {
      throw new realApiClient.ApiError(
        'Stock adjustment with ID 14 names no project',
        400
      );
    });

    expect(stockAdjustmentsService.approve(14)).rejects.toThrow(
      'names no project'
    );
  });
});

describe('reject', () => {
  test('posts to the backend rejection path for that document', async () => {
    api.post.mockImplementation(async () => ({ id: 14, status: 'rejected' }));

    await stockAdjustmentsService.reject(14, 'The count sheet is unsigned.');

    expect(api.post.mock.calls).toHaveLength(1);
    expect(api.post.mock.calls[0][0]).toBe('/stock-adjustments/web/14/reject');
  });

  test('sends the reason, and only the reason', async () => {
    api.post.mockImplementation(async () => ({ id: 14 }));

    await stockAdjustmentsService.reject(14, 'The count sheet is unsigned.');

    const body = api.post.mock.calls[0][1] as Record<string, unknown>;
    expect(body.reason).toBe('The count sheet is unsigned.');
    // The rejecter comes from the session, never the request body.
    expect(Object.keys(body)).toEqual(['reason']);
  });

  test('returns the rejected document parsed, refusal and all', async () => {
    api.post.mockImplementation(async () => ({
      id: 14,
      adjustmentNumber: 'SA-2026-0014',
      status: 'rejected',
      rejectedBy: 9,
      rejectedAt: '2026-01-16T09:00:00',
      rejectionReason: 'The count sheet is unsigned.',
      lineItems: [{ id: 3, materialId: 21, adjustmentQuantity: -20 }],
    }));

    const rejected = await stockAdjustmentsService.reject(14, 'unsigned');

    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectedBy).toBe(9);
    expect(rejected.rejectedAt?.getFullYear()).toBe(2026);
    expect(rejected.rejectionReason).toBe('The count sheet is unsigned.');
    // Nothing was posted, so the approval side stays empty.
    expect(rejected.approvedAt).toBeUndefined();
    expect(rejected.processedAt).toBeUndefined();
  });

  test('a refusal from the backend is not swallowed', async () => {
    api.post.mockImplementation(async () => {
      throw new realApiClient.ApiError(
        'Stock adjustment with ID 14 has already been rejected',
        400
      );
    });

    expect(
      stockAdjustmentsService.reject(14, 'again')
    ).rejects.toThrow('already been rejected');
  });
});
