/**
 * Job polling (web #444): the status card polls while the job is QUEUED or
 * RUNNING and stops once it is DONE. Reaching DONE or FAILED invalidates the
 * BIM cache so the model list refreshes, and a job fetch that fails before
 * any status arrived is reported rather than shown as "Starting" (web #457).
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, waitFor } from '@testing-library/react';
import { ApiError } from '@tornotron/echno-core';
import { bimKeys } from '@tornotron/echno-core/bim/hooks/keys';
import * as realBimServices from '@tornotron/echno-core/bim/services';

const JOB = '44444444-4444-4444-4444-444444444444';
const statuses = ['QUEUED', 'RUNNING', 'DONE', 'DONE', 'DONE'];
let polls = 0;
const getJob = mock(async () => {
  const status = statuses[Math.min(polls, statuses.length - 1)];
  polls += 1;
  return {
    id: JOB,
    modelId: 'm',
    versionId: 'v',
    status,
    attempt: 1,
    maxAttempts: 3,
    elementCount: 40,
    storeyCount: 2,
  };
});
mock.module('@tornotron/echno-core/bim/services', () => ({
  ...realBimServices,
  bimService: { ...realBimServices.bimService, getJob },
}));

const { ImportJobStatus, describeImportJob } = await import('./import-job-status');

afterEach(() => cleanup());

describe('ImportJobStatus', () => {
  test('polls through QUEUED and RUNNING and stops at DONE', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(ImportJobStatus, { jobId: JOB, intervalMs: 20 })
      )
    );
    const card = view.getByTestId('import-job-status');
    await waitFor(() => expect(card.dataset.status).toBe('DONE'), { timeout: 3000 });
    const pollsAtDone = polls;
    expect(pollsAtDone).toBeGreaterThanOrEqual(3);
    await new Promise((r) => setTimeout(r, 150));
    expect(polls).toBe(pollsAtDone);
    expect(card.textContent).toContain('40 elements across 2 storeys');
  });

  test('reaching DONE invalidates the BIM cache so the model list refreshes', async () => {
    getJob.mockImplementationOnce(async () => ({
      id: JOB,
      modelId: 'm',
      versionId: 'v',
      status: 'DONE',
      attempt: 1,
      maxAttempts: 3,
      elementCount: 1,
      storeyCount: 1,
    }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // A model list the tab would be showing, seeded as fresh.
    client.setQueryData(bimKeys.projectModels(7), []);
    expect(client.getQueryState(bimKeys.projectModels(7))?.isInvalidated).toBe(false);
    const view = render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(ImportJobStatus, { jobId: JOB, intervalMs: 20 })
      )
    );
    const card = view.getByTestId('import-job-status');
    await waitFor(() => expect(card.dataset.status).toBe('DONE'));
    await waitFor(() =>
      expect(client.getQueryState(bimKeys.projectModels(7))?.isInvalidated).toBe(true)
    );
  });

  test('a job fetch that fails before any status is shown as an error, not "Starting"', async () => {
    getJob.mockImplementationOnce(async () => {
      throw new ApiError('No such job', 404);
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(ImportJobStatus, { jobId: JOB, intervalMs: 20 })
      )
    );
    await waitFor(() =>
      expect(view.getByTestId('import-job-status').dataset.status).toBe('error')
    );
    expect(view.getByTestId('import-job-status').textContent).toContain('No such job');
    expect(view.getByTestId('import-job-status').textContent).not.toContain('Starting');
  });

  test('describes each stage with a progress value that only rises', () => {
    const base = { id: JOB, modelId: 'm', versionId: 'v', attempt: 1, maxAttempts: 3 } as const;
    const q = describeImportJob({ ...base, status: 'QUEUED' });
    const r = describeImportJob({ ...base, status: 'RUNNING' });
    const i = describeImportJob({ ...base, status: 'RUNNING', ingestedAt: 'now' });
    const d = describeImportJob({ ...base, status: 'DONE' });
    expect(q.percent).toBeLessThan(r.percent);
    expect(r.percent).toBeLessThan(i.percent);
    expect(i.percent).toBeLessThan(d.percent);
    expect(describeImportJob({ ...base, status: 'FAILED' }).label).toContain('failed');
  });
});
