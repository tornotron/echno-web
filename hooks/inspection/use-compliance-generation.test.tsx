import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@tornotron/echno-core';
import type { ComplianceGenerationJob } from '@/types/compliance-job';

const start = mock(async (_projectId: number) => queued());
const getById = mock(async (_jobId: string) => queued());
const getLatestForProject = mock(
  async (_projectId: number) => null as ComplianceGenerationJob | null
);

mock.module('@/services/compliance-job-service', () => ({
  complianceJobService: { start, getById, getLatestForProject },
}));

const toast = {
  success: mock((..._args: unknown[]) => {}),
  error: mock((..._args: unknown[]) => {}),
  info: mock((..._args: unknown[]) => {}),
  warning: mock((..._args: unknown[]) => {}),
};

mock.module('@/lib/styles/toast-styles', () => ({ toast }));

const { useComplianceGeneration, COMPLIANCE_JOB_POLL_INTERVAL_MS } = await import(
  './use-compliance-generation'
);
const { inspectionKeys } = await import('./inspection-keys');

const JOB_ID = 'ac9c2f6e-0f9a-4a0e-9c2b-1a1d7e0b4c11';

function job(over: Partial<ComplianceGenerationJob> = {}): ComplianceGenerationJob {
  return {
    id: JOB_ID,
    projectId: 7,
    status: 'queued',
    rulesTotal: 24,
    rulesAssessed: 0,
    batchesTotal: 3,
    batchesDone: 0,
    createdCount: 0,
    errorMessage: null,
    attempt: 0,
    maxAttempts: 3,
    createdAt: '2026-08-29T10:00:00',
    startedAt: null,
    finishedAt: null,
    ...over,
  };
}

const queued = () => job();
const running = () =>
  job({
    status: 'running',
    attempt: 1,
    startedAt: '2026-08-29T10:00:02',
    rulesAssessed: 10,
    batchesDone: 1,
  });
const succeeded = () =>
  job({
    status: 'succeeded',
    attempt: 1,
    startedAt: '2026-08-29T10:00:02',
    finishedAt: '2026-08-29T10:01:02',
    rulesAssessed: 24,
    batchesDone: 3,
    createdCount: 4,
  });
const nothingToReport = () =>
  job({
    status: 'nothing-to-report',
    attempt: 1,
    startedAt: '2026-08-29T10:00:02',
    finishedAt: '2026-08-29T10:01:02',
    rulesAssessed: 24,
    batchesDone: 3,
    createdCount: 0,
  });
const failed = () =>
  job({
    status: 'failed',
    attempt: 3,
    startedAt: '2026-08-29T10:00:02',
    finishedAt: '2026-08-29T10:01:02',
    rulesAssessed: 10,
    batchesDone: 1,
    createdCount: 0,
    errorMessage: 'The AI response was cut short by its token limit.',
  });

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

function lastOptions(spy: { mock: { calls: unknown[][] } }): ToastOptions {
  return (spy.mock.calls.at(-1)?.[1] ?? {}) as ToastOptions;
}

function lastTitle(spy: { mock: { calls: unknown[][] } }): string {
  return String(spy.mock.calls.at(-1)?.[0] ?? '');
}

function setup(projectId = 7) {
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

  const { result } = renderHook(() => useComplianceGeneration(projectId), {
    wrapper,
  });
  return { result, invalidated, queryClient };
}

beforeEach(() => {
  start.mockReset();
  start.mockImplementation(async () => queued());
  getById.mockReset();
  getById.mockImplementation(async () => queued());
  getLatestForProject.mockReset();
  getLatestForProject.mockImplementation(async () => null);
  for (const spy of Object.values(toast)) spy.mockReset();
});

describe('starting a run', () => {
  test('accepts the work through the job endpoint and watches what came back', async () => {
    const { result } = setup();
    await waitFor(() => expect(getLatestForProject).toHaveBeenCalled());

    result.current.start();

    await waitFor(() => expect(start).toHaveBeenCalledTimes(1));
    expect(start.mock.calls.at(-1)?.[0]).toBe(7);
    await waitFor(() => expect(result.current.job?.id).toBe(JOB_ID));
    expect(result.current.isActive).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('a refused start still surfaces the reason the backend gave', async () => {
    start.mockImplementation(async () => {
      throw new ApiError('Invalid request', 400, 'This project has no type set.');
    });
    const { result } = setup();

    result.current.start();

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(lastOptions(toast.error).description).toBe(
      'This project has no type set.'
    );
    expect(result.current.isActive).toBe(false);
  });
});

// A second click on a project that already has a run in flight joins that run,
// enforced by a partial unique index on the backend, which answers with the
// existing job instead of refusing. That is a normal outcome and has to read
// like one: no error, and the run that is already going is what gets watched.
describe('joining a run that was already in flight', () => {
  test('an already-running job is adopted rather than reported as an error', async () => {
    start.mockImplementation(async () => running());
    getById.mockImplementation(async () => running());
    const { result } = setup();

    result.current.start();

    await waitFor(() => expect(result.current.job?.status).toBe('running'));
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
    expect(result.current.isActive).toBe(true);
    expect(result.current.joinedExistingRun).toBe(true);
  });

  test('the join is announced as information, not as a refusal', async () => {
    start.mockImplementation(async () => running());
    getById.mockImplementation(async () => running());
    const { result } = setup();

    result.current.start();

    await waitFor(() => expect(toast.info).toHaveBeenCalledTimes(1));
    expect(toast.error).not.toHaveBeenCalled();
    expect(lastTitle(toast.info)).toMatch(/already running/i);
  });

  // The likeliest second click: the same tab, on a run it queued moments ago
  // that no worker has picked up yet. The row comes back queued with nothing
  // else set, so the only thing that tells them apart is that this hook has
  // already seen the id.
  test('a second click on a run still waiting to be picked up is a join', async () => {
    const { result } = setup();

    result.current.start();
    await waitFor(() => expect(result.current.job?.id).toBe(JOB_ID));
    expect(result.current.joinedExistingRun).toBe(false);

    result.current.start();

    await waitFor(() => expect(result.current.joinedExistingRun).toBe(true));
    await waitFor(() => expect(toast.info).toHaveBeenCalledTimes(1));
    expect(toast.error).not.toHaveBeenCalled();
    expect(start).toHaveBeenCalledTimes(2);
  });

  // A run this tab was already watching after a reload, then clicked on.
  test('a click on a run the page was already watching is a join', async () => {
    getLatestForProject.mockImplementation(async () => queued());
    const { result } = setup();

    await waitFor(() => expect(result.current.job?.id).toBe(JOB_ID));

    result.current.start();

    await waitFor(() => expect(result.current.joinedExistingRun).toBe(true));
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('work this click actually queued is not announced as a join', async () => {
    const { result } = setup();

    result.current.start();

    await waitFor(() => expect(result.current.job?.id).toBe(JOB_ID));
    expect(result.current.joinedExistingRun).toBe(false);
    expect(toast.info).not.toHaveBeenCalled();
  });
});

describe('progress while the run is in flight', () => {
  test('the numbers the backend publishes reach the caller', async () => {
    start.mockImplementation(async () => running());
    getById.mockImplementation(async () => running());
    const { result } = setup();

    result.current.start();

    await waitFor(() => expect(result.current.job?.status).toBe('running'));
    expect(result.current.percent).toBe(42);
    expect(result.current.progressLabel).toContain('10');
    expect(result.current.progressLabel).toContain('24');
  });

  test('the job is polled while it is active and left alone once it is not', async () => {
    start.mockImplementation(async () => queued());
    getById.mockImplementation(async () => running());
    const { result } = setup();

    result.current.start();
    await waitFor(() => expect(result.current.job?.status).toBe('running'));

    // Nothing prompts these reads: the run is read again on its own while it is
    // in flight, which is what replaces the old spinner with real numbers.
    const callsWhileRunning = getById.mock.calls.length;
    await waitFor(
      () => expect(getById.mock.calls.length).toBeGreaterThan(callsWhileRunning),
      { timeout: 8000 }
    );

    getById.mockImplementation(async () => succeeded());
    await waitFor(() => expect(result.current.job?.status).toBe('succeeded'), {
      timeout: 8000,
    });
    await waitFor(() => expect(result.current.isActive).toBe(false));

    // And once it is over, it is left alone. A poll can already be in flight at
    // the moment the run ends, so the count is taken an interval later rather
    // than on the instant; polling that had not stopped would add a call for
    // every interval after that.
    await new Promise((resolve) =>
      setTimeout(resolve, COMPLIANCE_JOB_POLL_INTERVAL_MS)
    );
    const callsWhenFinished = getById.mock.calls.length;
    await new Promise((resolve) =>
      setTimeout(resolve, COMPLIANCE_JOB_POLL_INTERVAL_MS * 3)
    );
    expect(getById.mock.calls.length).toBe(callsWhenFinished);
  }, 40_000);
});

/** Starts a run and drives it to the given terminal state. */
async function runTo(final: ComplianceGenerationJob) {
  start.mockImplementation(async () => queued());
  getById.mockImplementation(async () => final);
  const harness = setup();
  harness.result.current.start();
  await waitFor(() => expect(harness.result.current.job?.id).toBe(JOB_ID));
  harness.result.current.refetch();
  await waitFor(() =>
    expect(harness.result.current.job?.status).toBe(final.status)
  );
  return harness;
}

// The five statuses, and the three that must never be mistaken for each other.
describe('how each outcome is reported', () => {
  test('a productive run reports what it created and refreshes the lists', async () => {
    const { result, invalidated } = await runTo(succeeded());

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(lastOptions(toast.success).description).toContain('4 compliances');
    expect(toast.error).not.toHaveBeenCalled();
    expect(invalidated).toContainEqual(inspectionKeys.lists());
    expect(result.current.outcome?.tone).toBe('success');
  });

  test('an empty run is not an error and not a productive run', async () => {
    const { result } = await runTo(nothingToReport());

    await waitFor(() => expect(toast.info).toHaveBeenCalledTimes(1));
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(lastOptions(toast.info).description).toMatch(/every rule/i);
    expect(lastOptions(toast.info).description).not.toMatch(/nothing was saved/i);
    expect(result.current.outcome?.tone).toBe('neutral');
  });

  test('a broken run says nothing was saved and never reads as a clean one', async () => {
    const { result } = await runTo(failed());

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
    const description = lastOptions(toast.error).description ?? '';
    expect(description).toMatch(/nothing was saved/i);
    expect(description).not.toMatch(/no new compliances were required/i);
    expect(result.current.outcome?.tone).toBe('failure');
  });

  test('the three outcomes do not share a channel, a title or a description', async () => {
    const seen: { channel: string; title: string; description: string }[] = [];

    await runTo(succeeded());
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    seen.push({
      channel: 'success',
      title: lastTitle(toast.success),
      description: lastOptions(toast.success).description ?? '',
    });
    for (const spy of Object.values(toast)) spy.mockReset();

    await runTo(nothingToReport());
    await waitFor(() => expect(toast.info).toHaveBeenCalledTimes(1));
    seen.push({
      channel: 'info',
      title: lastTitle(toast.info),
      description: lastOptions(toast.info).description ?? '',
    });
    for (const spy of Object.values(toast)) spy.mockReset();

    await runTo(failed());
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    seen.push({
      channel: 'error',
      title: lastTitle(toast.error),
      description: lastOptions(toast.error).description ?? '',
    });

    expect(new Set(seen.map((s) => s.channel)).size).toBe(3);
    expect(new Set(seen.map((s) => s.title)).size).toBe(3);
    expect(new Set(seen.map((s) => s.description)).size).toBe(3);
    for (const entry of seen) expect(entry.description.length).toBeGreaterThan(0);
  });

  test('an outcome is announced once, however many times the job is read again', async () => {
    const { result } = await runTo(succeeded());

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    result.current.refetch();
    result.current.refetch();
    await waitFor(() => expect(getById.mock.calls.length).toBeGreaterThan(1));
    expect(toast.success).toHaveBeenCalledTimes(1);
  });
});

// The hook takes the project as an argument, so it can be handed a different one
// without unmounting. A job id left over from the last project would then be
// polled against the new one, and the screen would show a run belonging to a
// project the user has navigated away from.
describe('when the screen moves to another project', () => {
  test('the run from the previous project is not carried into the new one', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    start.mockImplementation(async () => running());
    getById.mockImplementation(async () => running());

    const { result, rerender } = renderHook(
      ({ projectId }: { projectId: number }) =>
        useComplianceGeneration(projectId),
      { wrapper, initialProps: { projectId: 7 } }
    );

    result.current.start();
    await waitFor(() => expect(result.current.job?.status).toBe('running'));

    getLatestForProject.mockImplementation(async () => null);
    rerender({ projectId: 9 });

    await waitFor(() =>
      expect(getLatestForProject.mock.calls.at(-1)?.[0]).toBe(9)
    );
    await waitFor(() => expect(result.current.job).toBeNull());
    expect(result.current.isActive).toBe(false);
    expect(result.current.joinedExistingRun).toBe(false);
  });
});

// A page reloaded mid-run loses the job id it was holding, so the run has to be
// found again from the project. That is what GET /compliance/jobs?projectId= is
// for, and without it the user is back to a screen that says nothing.
describe('a page that was reloaded during a run', () => {
  test('picks the run back up from the project and keeps polling it', async () => {
    getLatestForProject.mockImplementation(async () => running());
    const { result } = setup();

    await waitFor(() => expect(result.current.job?.status).toBe('running'));
    expect(result.current.isActive).toBe(true);
    expect(result.current.progressLabel).toContain('10');
    expect(start).not.toHaveBeenCalled();
  });

  test('a finished run found on load is shown but not announced again', async () => {
    getLatestForProject.mockImplementation(async () => succeeded());
    const { result } = setup();

    await waitFor(() => expect(result.current.job?.status).toBe('succeeded'));
    expect(result.current.outcome?.tone).toBe('success');
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('a project that has never had a run shows nothing at all', async () => {
    const { result } = setup();

    await waitFor(() => expect(getLatestForProject).toHaveBeenCalledTimes(1));
    expect(result.current.job).toBeNull();
    expect(result.current.outcome).toBeNull();
    expect(result.current.isActive).toBe(false);
  });
});
