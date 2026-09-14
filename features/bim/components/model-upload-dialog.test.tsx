/**
 * The "New model" path of the upload dialog (web #454): creating the model
 * and uploading into it happen in one click, so the upload must run against
 * the id the create returned, not the id the hook was bound to when the
 * click started (which was none).
 *
 * The dialog is rendered with no existing models, so "New model" is the
 * default choice and the Radix select never has to be driven. Assertions are
 * on the recorded service calls, never on a rendered Radix node.
 *
 * Also pins who sees the dialog at all (web #456): the backend accepts the
 * upload from managers and above, so nobody else is offered the button.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import * as realBimServices from '@tornotron/echno-core/bim/services';
import * as realAttachmentServices from '@tornotron/echno-core/attachment/services';

const PROJECT = 7;
const CREATED = '33333333-3333-3333-3333-333333333333';
const VERSION = '22222222-2222-2222-2222-222222222222';
const JOB = '44444444-4444-4444-4444-444444444444';

const created: { projectId: number; name: string }[] = [];
const presigned: string[] = [];

const createModel = mock(async (projectId: number, req: { name: string }) => {
  created.push({ projectId, name: req.name });
  return {
    id: CREATED,
    projectId,
    name: req.name,
    versions: [],
    createdAt: 'now',
    updatedAt: 'now',
  };
});
const presignSource = mock(async (modelId: string) => {
  presigned.push(modelId);
  return {
    versionId: VERSION,
    versionNumber: 1,
    upload: { key: 'k', url: 'https://store/put?sig', contentType: 'application/x-step', expiresInSeconds: 900 },
  };
});
const registerSource = mock(async (modelId: string, v: string) => ({
  id: v,
  modelId,
  versionNumber: 1,
  status: 'UPLOADED',
  meta: {},
  hierarchyProposed: false,
}));
const enqueueImport = mock(async (modelId: string, v: string) => ({
  id: JOB,
  modelId,
  versionId: v,
  status: 'QUEUED',
  attempt: 0,
  maxAttempts: 3,
}));
const getJob = mock(async () => ({
  id: JOB,
  modelId: CREATED,
  versionId: VERSION,
  status: 'DONE',
  attempt: 1,
  maxAttempts: 3,
  elementCount: 1,
  storeyCount: 1,
}));
const putToStorage = mock(async () => {});

mock.module('@tornotron/echno-core/bim/services', () => ({
  ...realBimServices,
  bimService: {
    ...realBimServices.bimService,
    createModel,
    presignSource,
    registerSource,
    enqueueImport,
    getJob,
  },
}));
const toasts: string[] = [];
mock.module('sonner', () => ({
  toast: {
    success: (m: string) => toasts.push(`success:${m}`),
    error: (m: string) => toasts.push(`error:${m}`),
  },
}));
mock.module('@tornotron/echno-core/attachment/services', () => ({
  ...realAttachmentServices,
  attachmentService: { ...realAttachmentServices.attachmentService, putToStorage },
}));
let isManagerOrAbove = true;
mock.module('@/hooks/use-authorization', () => ({
  useAuthorization: () => ({ isManagerOrAbove, isLoading: false }),
}));

const { ModelUploadDialog } = await import('./model-upload-dialog');

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(ModelUploadDialog, { projectId: PROJECT, models: [] })
    )
  );
}

function openDialog(view: ReturnType<typeof render>) {
  fireEvent.click(view.getByRole('button', { name: /upload ifc/i }));
}

function chooseFile(name = 'tower.ifc') {
  const input = document.body.querySelector('#bim-file') as HTMLInputElement;
  const file = new File([new Uint8Array(64)], name, { type: '' });
  fireEvent.change(input, { target: { files: [file] } });
}

function uploadButton(): HTMLButtonElement | undefined {
  return [...document.body.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Upload and import')
  ) as HTMLButtonElement | undefined;
}

afterEach(() => {
  cleanup();
  toasts.length = 0;
  created.length = 0;
  presigned.length = 0;
  isManagerOrAbove = true;
});

describe('ModelUploadDialog, who sees it', () => {
  test('a member below manager gets no upload button (the backend would 403 the upload)', () => {
    isManagerOrAbove = false;
    const view = renderDialog();
    expect(view.queryByRole('button', { name: /upload ifc/i })).toBeNull();
  });
});

describe('ModelUploadDialog, "New model" path', () => {
  test('creates the model, then presigns against the created id', async () => {
    const view = renderDialog();
    openDialog(view);
    chooseFile();
    fireEvent.click(uploadButton() as HTMLButtonElement);

    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toEqual({ projectId: PROJECT, name: 'tower.ifc' });
    // The presign is the first call bound to a model id; without the override
    // the upload hook returned early with no id and this list stayed empty.
    await waitFor(() => expect(presigned).toEqual([CREATED]));
    // web #462: once the job is queued the dialog closes and hands the
    // progress to the model card; it no longer narrates the job itself.
    await waitFor(() => expect(document.body.querySelector('#bim-file')).toBeNull());
    expect(toasts.some((t) => t.startsWith('success:IFC uploaded'))).toBe(true);
    expect(document.body.querySelector('[data-testid="import-job-status"]')).toBeNull();
  });

  test('a second upload after a failed first one reuses the created model', async () => {
    putToStorage.mockImplementationOnce(async () => {
      throw new Error('storage said no');
    });
    const view = renderDialog();
    openDialog(view);
    chooseFile();
    fireEvent.click(uploadButton() as HTMLButtonElement);

    await waitFor(() => expect(presigned).toEqual([CREATED]));
    await waitFor(() =>
      expect(
        (document.body.querySelector('[data-testid="upload-stage"]') as HTMLElement | null)
          ?.dataset.stage
      ).toBe('error')
    );

    fireEvent.click(uploadButton() as HTMLButtonElement);
    await waitFor(() => expect(presigned).toEqual([CREATED, CREATED]));
    // One model was created for the two attempts.
    expect(created).toHaveLength(1);
  });
});
