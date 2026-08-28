import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
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

/** The 409 the backend sends once its write retries are exhausted. */
const conflict = () =>
  new ApiError('Conflict', 409, 'A generation for this project is running.');

/** The 502 the backend sends when the model's answer came back incomplete. */
const incomplete = () =>
  new ApiError('Bad gateway', 502, 'The AI response was truncated.');

/** The copy the success path uses when a finished run produced nothing. */
const EMPTY_RESULT_COPY = 'No new compliances were required.';

interface ToastOptions {
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

/** The options object handed to the most recent call on a toast channel. */
function lastOptions(spy: { mock: { calls: unknown[][] } }): ToastOptions {
  return (spy.mock.calls.at(-1)?.[1] ?? {}) as ToastOptions;
}

/** The title handed to the most recent call on a toast channel. */
function lastTitle(spy: { mock: { calls: unknown[][] } }): string {
  return String(spy.mock.calls.at(-1)?.[0] ?? '');
}

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

// Two generations for the same project overlapped and the backend ran out of
// write retries, so this one was abandoned. The project is fine and the work is
// worth repeating, so a 409 has to read as "run it again", not as a failure of
// the request and not as a finished analysis.
describe('useRegenerateCompliance — two generations collided', () => {
  test('a 409 warns and offers a retry instead of an error', async () => {
    regenerateCompliance.mockImplementation(async () => {
      throw conflict();
    });
    const { result } = setup();

    result.current.mutate(7);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
    expect(lastOptions(toast.warning).action?.label).toBeTruthy();
  });

  test('the retry button runs the analysis again for the same project', async () => {
    regenerateCompliance.mockImplementation(async () => {
      throw conflict();
    });
    const { result } = setup();

    result.current.mutate(7);
    await waitFor(() => expect(toast.warning).toHaveBeenCalledTimes(1));

    const retry = lastOptions(toast.warning).action;
    expect(retry).toBeDefined();
    act(() => {
      retry!.onClick();
    });

    await waitFor(() => expect(regenerateCompliance).toHaveBeenCalledTimes(2));
    expect(regenerateCompliance.mock.calls.at(-1)?.[0]).toBe(7);
  });

  test('a 409 never reads as a run that finished with nothing to report', async () => {
    regenerateCompliance.mockImplementation(async () => {
      throw conflict();
    });
    const { result } = setup();

    result.current.mutate(7);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.success).not.toHaveBeenCalled();
    expect(lastOptions(toast.warning).description ?? '').not.toContain(
      EMPTY_RESULT_COPY
    );
    // The user has to be told the run produced nothing, and told to repeat it.
    expect(lastOptions(toast.warning).description ?? '').toMatch(
      /nothing was saved/i
    );
  });
});

// The model's answer came back truncated, or left a rule unassessed, so the
// backend refused the whole run rather than saving the part it did assess. That
// used to arrive as a 200 with an empty list, which is indistinguishable from a
// clean run. It must now be unmistakably an error, and it must not offer a
// retry, because re-running an over-long catalogue truncates the same way.
describe('useRegenerateCompliance — the model answered incompletely', () => {
  test('a 502 reports a failed analysis and offers no retry', async () => {
    regenerateCompliance.mockImplementation(async () => {
      throw incomplete();
    });
    const { result } = setup();

    result.current.mutate(7);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
    expect(lastOptions(toast.error).action).toBeUndefined();
  });

  test('a 502 says nothing was saved rather than nothing was found', async () => {
    regenerateCompliance.mockImplementation(async () => {
      throw incomplete();
    });
    const { result } = setup();

    result.current.mutate(7);

    await waitFor(() => expect(result.current.isError).toBe(true));
    const description = lastOptions(toast.error).description ?? '';
    expect(description).not.toContain(EMPTY_RESULT_COPY);
    expect(description).toMatch(/nothing was saved/i);
    // The backend's own wording is not shown, because "Bad gateway" reads as a
    // network fault the user should retry.
    expect(description).not.toContain('Bad gateway');
    expect(lastTitle(toast.error)).not.toContain('Bad gateway');
  });

  test('the two statuses do not collapse into the same message', async () => {
    regenerateCompliance.mockImplementation(async () => {
      throw new ApiError('Conflict', 409);
    });
    const conflictRun = setup();
    conflictRun.result.current.mutate(7);
    await waitFor(() => expect(toast.warning).toHaveBeenCalledTimes(1));
    const conflictCopy = lastOptions(toast.warning).description;

    regenerateCompliance.mockImplementation(async () => {
      throw incomplete();
    });
    const incompleteRun = setup();
    incompleteRun.result.current.mutate(7);
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    const incompleteCopy = lastOptions(toast.error).description;

    expect(conflictCopy).toBeTruthy();
    expect(incompleteCopy).toBeTruthy();
    expect(conflictCopy).not.toBe(incompleteCopy);
  });
});
