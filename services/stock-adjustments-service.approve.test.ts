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
