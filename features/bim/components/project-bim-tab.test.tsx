/**
 * The BIM tab's list states (web #455): a failed model list is an error, kept
 * apart from the "No BIM model yet" empty state, and a 402 (the module is not
 * in the org's plan) links to the module-denied page rather than a retry.
 *
 * `bimService.listModels` is stubbed so the real `useBimModels` query runs
 * and settles into its error state through TanStack, the way it would in the
 * app. Assertions are on text and data attributes, never on a Radix node.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, waitFor } from '@testing-library/react';
import { ApiError } from '@tornotron/echno-core';
import * as realBimServices from '@tornotron/echno-core/bim/services';

const PROJECT = 7;

const MODEL = '11111111-1111-1111-1111-111111111111';
const VERSION = '22222222-2222-2222-2222-222222222222';
const JOB = '44444444-4444-4444-4444-444444444444';

let listResult: () => Promise<unknown[]> = async () => [];
const listModels = mock(() => listResult());
const listJobs = mock(async () => [
  { id: JOB, modelId: MODEL, versionId: VERSION, status: 'QUEUED', attempt: 0, maxAttempts: 3 },
]);
const getJob = mock(async () => ({
  id: JOB,
  modelId: MODEL,
  versionId: VERSION,
  status: 'DONE',
  attempt: 1,
  maxAttempts: 3,
  elementCount: 20,
  storeyCount: 2,
}));

mock.module('@tornotron/echno-core/bim/services', () => ({
  ...realBimServices,
  bimService: { ...realBimServices.bimService, listModels, listJobs, getJob },
}));

function modelWith(status: string, extra: Record<string, unknown> = {}) {
  return {
    id: MODEL,
    projectId: PROJECT,
    name: 'Two storey fixture',
    currentVersionId: VERSION,
    versions: [{ id: VERSION, modelId: MODEL, versionNumber: 1, status, meta: {}, hierarchyProposed: false, ...extra }],
  };
}
mock.module('@/hooks/use-authorization', () => ({
  useAuthorization: () => ({ isManagerOrAbove: true, isLoading: false }),
}));
mock.module('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement('a', { href }, children),
}));

const { ProjectBimTab } = await import('./project-bim-tab');

function renderTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(ProjectBimTab, { projectId: PROJECT })
    )
  );
}

afterEach(() => {
  cleanup();
  listResult = async () => [];
  listModels.mockClear();
});

describe('ProjectBimTab', () => {
  // web #463 item 4: the card of a version still importing watches its job
  // and refetches the list when the job is DONE, so the version line
  // (status, schema, counts) appears without a reload.
  test('a QUEUED version watches its job and the list refetches once the job is DONE', async () => {
    let reads = 0;
    listResult = async () => {
      reads += 1;
      return reads === 1
        ? [modelWith('QUEUED')]
        : [modelWith('READY', { ifcSchema: 'IFC4', elementCount: 20, storeyCount: 2 })];
    };
    const view = renderTab();
    const row = await view.findByTestId('bim-version-row');
    expect(row.textContent).toContain('QUEUED');
    await waitFor(() => expect(view.getByTestId('import-job-status').dataset.status).toBe('DONE'));
    await waitFor(() => expect(listModels.mock.calls.length).toBeGreaterThanOrEqual(2));
    await waitFor(() => expect(view.getByTestId('bim-version-row').textContent).toContain('READY'));
    expect(view.getByTestId('bim-version-row').textContent).toContain('IFC4');
    expect(view.getByTestId('bim-version-row').textContent).toContain('20 elements');
  });

  test('an empty list is the empty state', async () => {
    const view = renderTab();
    await waitFor(() => expect(view.getByTestId('project-bim-tab')).toBeTruthy());
    expect(view.getByTestId('project-bim-tab').textContent).toContain('No BIM model yet');
  });

  test('a failed list renders the error with a retry, not "No BIM model yet"', async () => {
    // A 4xx: the core query's own retry policy would hold a 5xx back for
    // several seconds of backoff before it settled.
    listResult = async () => {
      throw new ApiError('Project 7 is archived.', 409);
    };
    const view = renderTab();
    const card = await view.findByTestId('project-bim-tab-error');
    expect(card.textContent).toContain('The BIM models could not be loaded.');
    expect(card.textContent).toContain('Project 7 is archived.');
    expect(card.textContent).toContain('Retry');
    expect(view.queryByText(/No BIM model yet/)).toBeNull();
  });

  test('a 402 links to the module-denied page instead of offering a retry', async () => {
    listResult = async () => {
      throw new ApiError("This feature is not included in your organization's plan.", 402);
    };
    const view = renderTab();
    const card = await view.findByTestId('project-bim-tab-error');
    expect(card.dataset.status).toBe('402');
    const link = card.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/errors/403?reason=module&module=bim');
    expect(card.textContent).not.toContain('Retry');
    expect(view.queryByText(/No BIM model yet/)).toBeNull();
  });
});
