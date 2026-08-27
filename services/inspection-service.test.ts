import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as realCore from '@tornotron/echno-core';

// Spy on the shared client's POST. Compliance generation is the one inspection
// call issued through it directly, so this records exactly that request.
const api = {
  post: mock(async (..._args: unknown[]) => [] as unknown),
};

mock.module('@tornotron/echno-core', () => ({
  ...realCore,
  api,
}));

const { inspectionService } = await import('./inspection-service');

/** The RequestOptions argument of the most recent api.post call. */
function lastPostOptions(): { timeout?: number; retries?: number } {
  const calls = api.post.mock.calls;
  return (calls.at(-1)![3] ?? {}) as { timeout?: number; retries?: number };
}

beforeEach(() => {
  // An empty result is the "generation ran, nothing new applied" answer, and
  // is the right default for the tests that only inspect the request.
  api.post.mockReset();
  api.post.mockImplementation(async () => []);
});

describe('inspectionService.regenerateCompliance', () => {
  test('asks for the regenerate endpoint with the project id', async () => {
    await inspectionService.regenerateCompliance(7);

    const [endpoint, body, params] = api.post.mock.calls.at(-1)!;
    expect(endpoint).toBe('/inspections/web/compliance/regenerate');
    expect(body).toEqual({});
    expect(params).toEqual({ projectId: 7 });
  });

  // The bug this guards: generation waits on an external AI model and was
  // measured at 34-47 seconds on staging, so the client's 30-second default
  // aborted it every time and reported a timeout for work that had in fact
  // succeeded. The budget has to clear that default, and has to stay under the
  // 60 seconds the reverse proxy allows an upstream response to take, or the
  // user gets a raw gateway error instead of one the app can explain.
  test('allows more than the default budget, and less than the proxy ceiling', async () => {
    await inspectionService.regenerateCompliance(7);

    const { timeout } = lastPostOptions();
    expect(timeout).toBeGreaterThan(30_000);
    expect(timeout).toBeLessThan(60_000);
  });

  // Retrying would start a second analysis behind the first for no benefit.
  test('does not retry', async () => {
    await inspectionService.regenerateCompliance(7);

    expect(lastPostOptions().retries).toBe(0);
  });

  test('returns [] when the backend answers with an unexpected shape', async () => {
    api.post.mockImplementation(async () => ({ unexpected: true }));

    expect(await inspectionService.regenerateCompliance(7)).toEqual([]);
  });
});
