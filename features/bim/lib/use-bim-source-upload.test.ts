/**
 * The upload flow (web #444): presign, PUT to the store, register, queue the
 * import, in that order, with the 1 GB cap checked before the first call.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ApiError } from '@tornotron/echno-core';
import * as realBimServices from '@tornotron/echno-core/bim/services';
import * as realAttachmentServices from '@tornotron/echno-core/attachment/services';

const MODEL = '11111111-1111-1111-1111-111111111111';
const VERSION = '22222222-2222-2222-2222-222222222222';
const JOB = '44444444-4444-4444-4444-444444444444';

const calls: string[] = [];
const presignSource = mock(async (_m: string, req: { filename: string; fileSize: number }) => {
  calls.push(`presign:${req.filename}:${req.fileSize}`);
  return {
    versionId: VERSION,
    versionNumber: 2,
    upload: { key: 'k', url: 'https://store/put?sig', contentType: 'application/x-step', expiresInSeconds: 900 },
  };
});
let registeredStatus = 'UPLOADED';
const registerSource = mock(async (_m: string, v: string) => {
  calls.push(`register:${v}`);
  return { id: v, modelId: MODEL, versionNumber: 2, status: registeredStatus, meta: {}, hierarchyProposed: false };
});
let queuedJobs: unknown[] = [];
const listJobs = mock(async (_m: string, v: string) => {
  calls.push(`jobs:${v}`);
  return queuedJobs;
});
const enqueueImport = mock(async (_m: string, v: string) => {
  calls.push(`enqueue:${v}`);
  return { id: JOB, modelId: MODEL, versionId: v, status: 'QUEUED', attempt: 0, maxAttempts: 3 };
});
const putToStorage = mock(async (url: string, _f: unknown, ct: string, onProgress?: (p: { percent?: number }) => void) => {
  calls.push(`put:${url}:${ct}`);
  onProgress?.({ percent: 50 });
});

mock.module('@tornotron/echno-core/bim/services', () => ({
  ...realBimServices,
  bimService: { ...realBimServices.bimService, presignSource, registerSource, enqueueImport, listJobs },
}));
mock.module('@tornotron/echno-core/attachment/services', () => ({
  ...realAttachmentServices,
  attachmentService: { ...realAttachmentServices.attachmentService, putToStorage },
}));

const { useBimSourceUpload, checkBimSourceFile, isAlreadyQueued, pickVersionJob } = await import(
  './use-bim-source-upload'
);

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

afterEach(() => {
  calls.length = 0;
  registeredStatus = 'UPLOADED';
  queuedJobs = [];
});

describe('useBimSourceUpload', () => {
  test('runs presign, PUT, register, enqueue in order and ends with the job id', async () => {
    const { result } = renderHook(() => useBimSourceUpload(MODEL), { wrapper });
    const file = new File([new Uint8Array(1024)], 'tower.ifc', { type: '' });
    await act(async () => {
      await result.current.upload(file);
    });
    await waitFor(() => expect(result.current.state.stage).toBe('done'));
    expect(calls).toEqual([
      'presign:tower.ifc:1024',
      'put:https://store/put?sig:application/x-step',
      `register:${VERSION}`,
      `enqueue:${VERSION}`,
    ]);
    expect(result.current.state.jobId).toBe(JOB);
    expect(result.current.state.versionId).toBe(VERSION);
  });

  // web #462: register already queues the import on the current backend, so
  // the version comes back QUEUED and the job is read from the version's list
  // instead of being queued a second time.
  test('a register that already queued the import is not followed by an enqueue', async () => {
    registeredStatus = 'QUEUED';
    queuedJobs = [{ id: JOB, modelId: MODEL, versionId: VERSION, status: 'QUEUED', attempt: 0, maxAttempts: 3, queuedAt: '2026-09-14T10:00:00' }];
    const { result } = renderHook(() => useBimSourceUpload(MODEL), { wrapper });
    await act(async () => {
      await result.current.upload(new File(['x'], 'a.ifc'));
    });
    await waitFor(() => expect(result.current.state.stage).toBe('done'));
    expect(calls.filter((c) => c.startsWith('enqueue'))).toHaveLength(0);
    expect(calls).toContain(`jobs:${VERSION}`);
    expect(result.current.state.jobId).toBe(JOB);
  });

  test('a 409 already-queued after a fresh register resolves as success with that job', async () => {
    enqueueImport.mockImplementationOnce(async (_m: string, v: string) => {
      calls.push(`enqueue:${v}`);
      throw new ApiError(`An import job is already QUEUED for version ${v}`, 409);
    });
    queuedJobs = [
      { id: 'old', modelId: MODEL, versionId: VERSION, status: 'FAILED', attempt: 3, maxAttempts: 3, queuedAt: '2026-09-13T10:00:00' },
      { id: JOB, modelId: MODEL, versionId: VERSION, status: 'DONE', attempt: 1, maxAttempts: 3, queuedAt: '2026-09-14T10:00:00' },
    ];
    const { result } = renderHook(() => useBimSourceUpload(MODEL), { wrapper });
    await act(async () => {
      await result.current.upload(new File(['x'], 'a.ifc'));
    });
    await waitFor(() => expect(result.current.state.stage).toBe('done'));
    expect(calls.filter((c) => c.startsWith('enqueue'))).toHaveLength(1);
    expect(result.current.state.jobId).toBe(JOB);
    expect(result.current.state.error).toBeUndefined();
  });

  test('an enqueue refused for another reason still fails the upload', async () => {
    enqueueImport.mockImplementationOnce(async () => {
      throw new ApiError('Version 2 is not in a state that can be queued', 400);
    });
    const { result } = renderHook(() => useBimSourceUpload(MODEL), { wrapper });
    await act(async () => {
      await result.current.upload(new File(['x'], 'a.ifc'));
    });
    expect(result.current.state.stage).toBe('error');
    expect(calls.some((c) => c.startsWith('jobs'))).toBe(false);
  });

  test('isAlreadyQueued reads the backend wording and the 409 status', () => {
    expect(isAlreadyQueued(new ApiError('An import job is already RUNNING for version v', 400))).toBe(true);
    expect(isAlreadyQueued(new ApiError('Conflict', 409))).toBe(true);
    expect(isAlreadyQueued(new ApiError('Version 2 is already READY', 400))).toBe(false);
    expect(isAlreadyQueued(new Error('network'))).toBe(false);
  });

  test('pickVersionJob prefers the open job, else the most recently queued', () => {
    const done = { id: 'd', status: 'DONE', queuedAt: '2026-09-14T10:00:00' };
    const failed = { id: 'f', status: 'FAILED', queuedAt: '2026-09-14T09:00:00' };
    const running = { id: 'r', status: 'RUNNING', queuedAt: '2026-09-14T08:00:00' };
    expect(pickVersionJob([failed, done, running] as never)?.id).toBe('r');
    expect(pickVersionJob([failed, done] as never)?.id).toBe('d');
    expect(pickVersionJob([])).toBeUndefined();
  });

  test('refuses a file over 1 GB before any call is made', async () => {
    const big = { size: 1024 * 1024 * 1024 + 1, name: 'huge.ifc' } as File;
    expect(checkBimSourceFile(big)).toContain('1 GB');
    const { result } = renderHook(() => useBimSourceUpload(MODEL), { wrapper });
    await act(async () => {
      await result.current.upload(big);
    });
    expect(result.current.state.stage).toBe('error');
    expect(calls).toEqual([]);
  });

  test('a failed PUT stops before register and reports the error', async () => {
    putToStorage.mockImplementationOnce(async () => {
      throw new Error('storage said no');
    });
    const { result } = renderHook(() => useBimSourceUpload(MODEL), { wrapper });
    await act(async () => {
      await result.current.upload(new File(['x'], 'a.ifc'));
    });
    expect(result.current.state.stage).toBe('error');
    expect(result.current.state.error).toBe('storage said no');
    expect(calls.some((c) => c.startsWith('register'))).toBe(false);
  });
});
