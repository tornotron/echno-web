/**
 * The upload flow (web #444): presign, PUT to the store, register, queue the
 * import, in that order, with the 1 GB cap checked before the first call.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
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
const registerSource = mock(async (_m: string, v: string) => {
  calls.push(`register:${v}`);
  return { id: v, modelId: MODEL, versionNumber: 2, status: 'UPLOADED', meta: {}, hierarchyProposed: false };
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
  bimService: { ...realBimServices.bimService, presignSource, registerSource, enqueueImport },
}));
mock.module('@tornotron/echno-core/attachment/services', () => ({
  ...realAttachmentServices,
  attachmentService: { ...realAttachmentServices.attachmentService, putToStorage },
}));

const { useBimSourceUpload, checkBimSourceFile } = await import('./use-bim-source-upload');

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

afterEach(() => {
  calls.length = 0;
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
