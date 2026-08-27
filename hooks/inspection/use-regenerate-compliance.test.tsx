import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@tornotron/echno-core';

const regenerateCompliance = mock(async (_projectId: number) => [] as unknown[]);

mock.module('@/services/inspection-service', () => ({
  inspectionService: { regenerateCompliance },
}));

const toast = {
  success: mock((..._args: unknown[]) => {}),
  error: mock((..._args: unknown[]) => {}),
  info: mock((..._args: unknown[]) => {}),
  warning: mock((..._args: unknown[]) => {}),
};

mock.module('@/lib/styles/toast-styles', () => ({ toast }));

const { useRegenerateCompliance } = await import('./use-regenerate-compliance');
const { inspectionKeys } = await import('./inspection-keys');

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const invalidated: unknown[] = [];
  const realInvalidate = queryClient.invalidateQueries.bind(queryClient);
  queryClient.invalidateQueries = (filters?: { queryKey?: unknown }) => {
    invalidated.push(filters?.queryKey);
    return realInvalidate(filters as never);
  };

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  const { result } = renderHook(() => useRegenerateCompliance(), { wrapper });
  return { result, invalidated };
}

beforeEach(() => {
  regenerateCompliance.mockReset();
  regenerateCompliance.mockImplementation(async () => []);
  for (const spy of Object.values(toast)) spy.mockReset();
});

describe('useRegenerateCompliance — the analysis finished', () => {
  test('reports success and refreshes the lists', async () => {
    const { result, invalidated } = setup();

    result.current.mutate(7);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
    expect(invalidated).toContainEqual(inspectionKeys.lists());
  });
});

// The behaviour this ticket turned on. The browser gives up waiting at its own
// deadline, but the request already reached the backend, which runs the
// analysis to the end and saves the compliances it produced. Treating that as a
// failure is what made the module look broken: the results existed, one reload
// away. So a timeout must refresh the lists and say the work is still running,
// not raise an error toast.
describe('useRegenerateCompliance — nobody waited long enough', () => {
  test('an aborted request refreshes the lists instead of reporting failure', async () => {
    regenerateCompliance.mockImplementation(async () => {
      throw ApiError.timeout();
    });
    const { result, invalidated } = setup();

    result.current.mutate(7);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidated).toContainEqual(inspectionKeys.lists());
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledTimes(1);
  });

  test('a 504 from the proxy is treated the same way', async () => {
    regenerateCompliance.mockImplementation(async () => {
      throw new ApiError('Request timeout', 504);
    });
    const { result, invalidated } = setup();

    result.current.mutate(7);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidated).toContainEqual(inspectionKeys.lists());
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledTimes(1);
  });
});

describe('useRegenerateCompliance — the analysis was refused', () => {
  // A precondition the user has to fix (no project type, no state in the
  // address, no rules for the jurisdiction) still has to surface as an error
  // carrying the backend's explanation.
  test('a 400 keeps its error toast', async () => {
    regenerateCompliance.mockImplementation(async () => {
      throw new ApiError(
        'Invalid request',
        400,
        'This project has no type set.'
      );
    });
    const { result } = setup();

    result.current.mutate(7);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.info).not.toHaveBeenCalled();
    expect(toast.error.mock.calls.at(-1)![1]).toMatchObject({
      description: 'This project has no type set.',
    });
  });
});
