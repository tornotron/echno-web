import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { ApiError } from '@tornotron/echno-core';

const post = mock(async (..._args: unknown[]) => ({}) as unknown);
const get = mock(async (..._args: unknown[]) => ({}) as unknown);

mock.module('@tornotron/echno-core', () => ({
  api: { post, get },
  ApiError,
  logger: { warn: () => {}, error: () => {} },
}));

const { complianceJobService } = await import('./compliance-job-service');

const rawJob = (over: Record<string, unknown> = {}) => ({
  id: 'ac9c2f6e-0f9a-4a0e-9c2b-1a1d7e0b4c11',
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
});

beforeEach(() => {
  post.mockReset();
  post.mockImplementation(async () => rawJob());
  get.mockReset();
  get.mockImplementation(async () => rawJob());
});

describe('complianceJobService.start', () => {
  test('posts to the job endpoint with the project as a query parameter', async () => {
    await complianceJobService.start(7);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls.at(-1)?.[0]).toBe('/inspections/web/compliance/jobs');
    expect(post.mock.calls.at(-1)?.[2]).toEqual({ projectId: 7 });
  });

  test('never calls the synchronous endpoint that this replaces', async () => {
    await complianceJobService.start(7);

    for (const call of post.mock.calls) {
      expect(String(call[0])).not.toContain('regenerate');
    }
  });

  test('reads the job back with its status and progress', async () => {
    post.mockImplementation(async () =>
      rawJob({ status: 'running', rulesAssessed: 10, batchesDone: 1 })
    );

    const job = await complianceJobService.start(7);

    expect(job.status).toBe('running');
    expect(job.rulesAssessed).toBe(10);
    expect(job.batchesDone).toBe(1);
  });
});

describe('complianceJobService.getById', () => {
  test('reads one job by its id', async () => {
    await complianceJobService.getById('ac9c2f6e-0f9a-4a0e-9c2b-1a1d7e0b4c11');

    expect(get.mock.calls.at(-1)?.[0]).toBe(
      '/inspections/web/compliance/jobs/ac9c2f6e-0f9a-4a0e-9c2b-1a1d7e0b4c11'
    );
  });
});

describe('complianceJobService.getLatestForProject', () => {
  test('asks for the latest run for one project', async () => {
    await complianceJobService.getLatestForProject(7);

    expect(get.mock.calls.at(-1)?.[0]).toBe('/inspections/web/compliance/jobs');
    expect(get.mock.calls.at(-1)?.[1]).toEqual({ projectId: 7 });
  });

  // A project that has never been generated for is not an error, and a screen
  // that reports one for it is wrong. The backend answers 404 for that case.
  test('a project that has never had a run reads as no job, not as a failure', async () => {
    get.mockImplementation(async () => {
      throw new ApiError('Not found', 404, 'No compliance generation has ever been run.');
    });

    expect(await complianceJobService.getLatestForProject(7)).toBeNull();
  });

  test('any other failure is still a failure', async () => {
    get.mockImplementation(async () => {
      throw new ApiError('Forbidden', 403);
    });

    let raised: unknown = null;
    try {
      await complianceJobService.getLatestForProject(7);
    } catch (error) {
      raised = error;
    }
    expect(raised).toBeInstanceOf(ApiError);
    expect((raised as ApiError).status).toBe(403);
  });
});

describe('reading a job the client does not understand', () => {
  // A sixth status would be a backend change this client has not been taught.
  // Guessing at it is how a broken run comes to look like a clean one, so it is
  // refused instead.
  test('an unrecognised status is refused rather than guessed at', async () => {
    post.mockImplementation(async () => rawJob({ status: 'cancelled' }));

    let raised: unknown = null;
    try {
      await complianceJobService.start(7);
    } catch (error) {
      raised = error;
    }
    expect(raised).toBeInstanceOf(ApiError);
  });

  test('a body that is not a job at all is refused', async () => {
    post.mockImplementation(async () => 'nope');

    let raised: unknown = null;
    try {
      await complianceJobService.start(7);
    } catch (error) {
      raised = error;
    }
    expect(raised).toBeInstanceOf(ApiError);
  });
});
