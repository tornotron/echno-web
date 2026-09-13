import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import type { Attachment } from '@tornotron/echno-core/attachment/types';
import * as realInspectionHooks from '@/hooks/inspection';
import { ApiError } from '@/lib/api/api-client';
import {
  ObservationOutcomeKind,
  ObservationReviewStatus,
  ObservationSource,
} from '@tornotron/echno-core/inspection/types';
import type { Observation } from '@tornotron/echno-core/inspection/types';

/**
 * The observation queue and review drawer (#436). What is pinned: the queue
 * renders the rows the core hook returns, asking it for the project's
 * pending observations; each decision reaches the review mutation with the
 * body the backend expects; a rejection with no note cannot be sent; a 409
 * reads as "already decided"; and the add action posts a HUMAN observation
 * under the inspection it was opened from. Added for #458 and #455: a 409
 * refreshes the cache and hides the form; the page clamps to the last page
 * that exists; a failed evidence upload keeps the files for a retry against
 * the row already created; a 402 offers the plan link.
 */

const reviewCalls: Array<{ id: string; req: Record<string, unknown> }> = [];
let reviewResult: () => Promise<Observation>;
const createCalls: Array<Record<string, unknown>> = [];
const listCalls: Array<Record<string, unknown>> = [];
let rows: Observation[] = [];
let listTotalPages = 1;
let listError: Error | undefined;
let evidence: Attachment[] = [];
const uploadCalls: Array<[string, File[]]> = [];
let uploadResult: () => Promise<{
  attachments: Attachment[];
  errors: { filename: string; message: string }[];
}>;

mock.module('@/hooks/inspection', () => ({
  ...realInspectionHooks,
  useObservations: (params: Record<string, unknown>) => {
    listCalls.push(params);
    if (listError) {
      return {
        data: undefined,
        isLoading: false,
        isError: true,
        error: listError,
      };
    }
    return {
      data: {
        content: rows,
        totalElements: rows.length,
        totalPages: listTotalPages,
        number: params.page ?? 0,
        size: 20,
      },
      isLoading: false,
      isError: false,
      error: null,
    };
  },
  useObservationEvidence: () => ({ data: evidence, isLoading: false }),
  useInspectionById: () => ({ data: undefined }),
  useReviewObservation: () => ({
    isPending: false,
    mutateAsync: (args: { id: string; req: Record<string, unknown> }) => {
      reviewCalls.push(args);
      return reviewResult();
    },
  }),
  useCreateObservation: () => ({
    isPending: false,
    mutateAsync: (req: Record<string, unknown>) => {
      createCalls.push(req);
      return Promise.resolve({
        ...pending,
        id: OBS,
        source: ObservationSource.HUMAN,
      });
    },
  }),
}));

mock.module('@tornotron/echno-core/spatial/hooks', () => ({
  useSpatialTree: () => ({ data: [], isLoading: false }),
}));

mock.module('@tornotron/echno-core/observation/services', () => ({
  observationService: {
    getById: () =>
      Promise.resolve({
        ...pending,
        reviewStatus: ObservationReviewStatus.REJECTED,
        reviewNote: 'Decided by someone else',
      }),
  },
}));

mock.module('../lib/observation-evidence', () => ({
  uploadObservationEvidence: (id: string, files: File[]) => {
    uploadCalls.push([id, files]);
    return uploadResult();
  },
}));

mock.module('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    createElement('a', { href }, children),
}));

const { ObservationQueue } = await import('./observation-queue');
const { ObservationReviewSheet, ALREADY_DECIDED_MESSAGE } =
  await import('./observation-review-sheet');
const { AddObservationDialog } = await import('./add-observation-dialog');

const OBS = '11111111-1111-4111-8111-111111111111';
const INSPECTION_ID = '22222222-2222-4222-8222-222222222222';

const pending: Observation = {
  id: OBS,
  projectId: 7,
  spatialPath: [],
  source: ObservationSource.DRONE,
  sourceDeviceId: 'dji-04',
  confidence: 0.82,
  observedAt: '2026-09-12T10:00:00Z',
  title: 'Crack at column C-14',
  description: 'Hairline, vertical',
  evidenceRefs: [],
  reviewStatus: ObservationReviewStatus.PENDING,
  reviewChanges: [],
  outcomeKind: ObservationOutcomeKind.NONE,
};

/** Renders under a fresh QueryClient and hands it back for cache assertions. */
function renderWithClient(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const utils = render(createElement(QueryClientProvider, { client }, element));
  return { ...utils, client };
}

function button(label: string): HTMLButtonElement {
  const found = [...document.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === label
  );
  if (!found) throw new Error(`no button "${label}"`);
  return found as HTMLButtonElement;
}

beforeEach(() => {
  reviewCalls.length = 0;
  createCalls.length = 0;
  listCalls.length = 0;
  uploadCalls.length = 0;
  rows = [pending];
  listTotalPages = 1;
  listError = undefined;
  evidence = [];
  uploadResult = () => Promise.resolve({ attachments: [], errors: [] });
  reviewResult = () =>
    Promise.resolve({
      ...pending,
      reviewStatus: ObservationReviewStatus.ACCEPTED,
      outcomeKind: ObservationOutcomeKind.NONE,
    });
});

afterEach(() => {
  cleanup();
});

describe('ObservationQueue', () => {
  test('lists the project pending observations through the core hook', () => {
    const { container } = renderWithClient(
      createElement(ObservationQueue, { projectId: 7 })
    );
    expect(listCalls[0]).toMatchObject({
      projectId: 7,
      reviewStatus: 'pending',
    });
    const row = container.querySelector('[data-testid="observation-row"]');
    expect(row).not.toBeNull();
    expect(row!.textContent).toContain('Crack at column C-14');
    expect(row!.textContent).toContain('Drone');
    expect(row!.textContent).toContain('82%');
  });

  test('a page past the end falls back to the last page that exists', async () => {
    listTotalPages = 2;
    const { rerender } = renderWithClient(
      createElement(ObservationQueue, { projectId: 7 })
    );
    fireEvent.click(document.querySelector('[aria-label="Next page"]')!);
    expect(listCalls.at(-1)?.page).toBe(1);
    // The only row on page 2 was decided: the backend now reports one page.
    listTotalPages = 1;
    rows = [];
    await act(async () => {
      rerender(
        createElement(
          QueryClientProvider,
          { client: new QueryClient() },
          createElement(ObservationQueue, { projectId: 7 })
        )
      );
    });
    expect(listCalls.at(-1)?.page).toBe(0);
    expect(document.body.textContent).not.toContain('Page 2 of 1');
  });

  test('a 402 offers the plan link instead of the generic failure', () => {
    listError = new ApiError('Payment Required', 402);
    const { container } = renderWithClient(
      createElement(ObservationQueue, { projectId: 7 })
    );
    const denied = container.querySelector('[data-testid="module-denied"]');
    expect(denied).not.toBeNull();
    expect(denied!.querySelector('a')?.getAttribute('href')).toBe(
      '/errors/403?reason=module&module=inspections'
    );
    expect(container.textContent).not.toContain('could not be loaded');
  });

  test('a click on an evidence thumbnail does not open the review sheet', () => {
    evidence = [
      {
        id: 5,
        file: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
        fileName: 'crack.jpg',
        fileType: 'image',
      } as unknown as Attachment,
    ];
    const { container } = renderWithClient(
      createElement(ObservationQueue, { projectId: 7 })
    );
    const thumb = container.querySelector(
      '[data-testid="observation-row"] a[title="crack.jpg"]'
    );
    expect(thumb).not.toBeNull();
    // Keep happy-dom from following the link; only the bubbling matters here.
    thumb!.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(thumb!);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    fireEvent.click(
      container.querySelector('[data-testid="observation-row"]')!
    );
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

describe('ObservationReviewSheet', () => {
  test('accept sends the decision with a NONE outcome', async () => {
    renderWithClient(
      createElement(ObservationReviewSheet, {
        observation: pending,
        onOpenChange: () => {},
      })
    );
    await act(async () => {
      fireEvent.click(button('Accept'));
    });
    expect(reviewCalls).toEqual([
      { id: OBS, req: { decision: 'accept', outcome: { kind: 'none' } } },
    ]);
  });

  test('reject is blocked without a note, then sends the note', async () => {
    renderWithClient(
      createElement(ObservationReviewSheet, {
        observation: pending,
        onOpenChange: () => {},
      })
    );
    fireEvent.click(document.querySelector('#decision-reject')!);
    expect(button('Reject').disabled).toBe(true);
    expect(reviewCalls).toHaveLength(0);
    fireEvent.change(document.querySelector('#review-note')!, {
      target: { value: 'Shadow, not a crack' },
    });
    expect(button('Reject').disabled).toBe(false);
    await act(async () => {
      fireEvent.click(button('Reject'));
    });
    expect(reviewCalls).toEqual([
      { id: OBS, req: { decision: 'reject', note: 'Shadow, not a crack' } },
    ]);
  });

  test('modify sends only the changed fields and shows the diff', async () => {
    renderWithClient(
      createElement(ObservationReviewSheet, {
        observation: pending,
        onOpenChange: () => {},
      })
    );
    fireEvent.click(document.querySelector('#decision-modify')!);
    expect(button('Accept with changes').disabled).toBe(true);
    fireEvent.change(document.querySelector('#edit-title')!, {
      target: { value: 'Crack at column C-15' },
    });
    fireEvent.change(document.querySelector('#edit-category')!, {
      target: { value: 'Structural' },
    });
    fireEvent.change(document.querySelector('#edit-category')!, {
      target: { value: '' },
    });
    const diff = document.querySelector('[data-testid="review-diff"]');
    expect(diff?.textContent).toContain('Crack at column C-14');
    expect(diff?.textContent).toContain('Crack at column C-15');
    await act(async () => {
      fireEvent.click(button('Accept with changes'));
    });
    expect(reviewCalls).toEqual([
      {
        id: OBS,
        req: {
          decision: 'modify',
          changes: { title: 'Crack at column C-15' },
          outcome: { kind: 'none' },
        },
      },
    ]);
  });

  test('a 409 reads as already decided', async () => {
    reviewResult = () => Promise.reject(new ApiError('Conflict', 409));
    renderWithClient(
      createElement(ObservationReviewSheet, {
        observation: pending,
        onOpenChange: () => {},
      })
    );
    await act(async () => {
      fireEvent.click(button('Accept'));
    });
    expect(document.querySelector('[role="alert"]')?.textContent).toBe(
      ALREADY_DECIDED_MESSAGE
    );
    expect(document.body.textContent).toContain('Decided by someone else');
  });

  test('a 409 refreshes the cache and takes the form away', async () => {
    reviewResult = () => Promise.reject(new ApiError('Conflict', 409));
    const { client } = renderWithClient(
      createElement(ObservationReviewSheet, {
        observation: pending,
        onOpenChange: () => {},
      })
    );
    const invalidated: unknown[] = [];
    const original = client.invalidateQueries.bind(client);
    client.invalidateQueries = ((filters: unknown) => {
      invalidated.push(filters);
      return original(filters as never);
    }) as typeof client.invalidateQueries;
    await act(async () => {
      fireEvent.click(button('Accept'));
    });
    // The list pages are invalidated so the queue stops showing it pending.
    expect(invalidated).toContainEqual({ queryKey: ['observations', 'list'] });
    // The decided row is what a reopened sheet reads first.
    expect(
      client.getQueryData<Observation>(['observations', 'detail', OBS])
        ?.reviewNote
    ).toBe('Decided by someone else');
    // No decision button remains, so the stale form cannot be sent again.
    expect(
      [...document.querySelectorAll('button')].map((b) => b.textContent?.trim())
    ).not.toContain('Accept');
  });

  test('after a decision the outcome link points at the record', async () => {
    reviewResult = () =>
      Promise.resolve({
        ...pending,
        inspectionId: INSPECTION_ID,
        reviewStatus: ObservationReviewStatus.ACCEPTED,
        outcomeKind: ObservationOutcomeKind.DEFECT,
        outcomeRef: '99999999-9999-4999-8999-999999999999',
      });
    renderWithClient(
      createElement(ObservationReviewSheet, {
        observation: pending,
        onOpenChange: () => {},
      })
    );
    await act(async () => {
      fireEvent.click(button('Accept'));
    });
    const link = document.querySelector(
      `a[href*="/inspections/${INSPECTION_ID}"]`
    );
    expect(link).not.toBeNull();
    expect(link!.textContent).toContain('Open');
  });
});

describe('AddObservationDialog', () => {
  test('posts a human observation under the inspection it was opened from', async () => {
    renderWithClient(
      createElement(AddObservationDialog, {
        projectId: 7,
        inspectionId: INSPECTION_ID,
      })
    );
    fireEvent.click(button('Add observation'));
    expect(button('Record observation').disabled).toBe(true);
    fireEvent.change(document.querySelector('#observation-title')!, {
      target: { value: 'Exposed rebar' },
    });
    fireEvent.change(document.querySelector('#observation-location')!, {
      target: { value: 'Block C, level 2' },
    });
    await act(async () => {
      fireEvent.click(button('Record observation'));
    });
    expect(createCalls).toEqual([
      {
        projectId: 7,
        inspectionId: INSPECTION_ID,
        title: 'Exposed rebar',
        locationNote: 'Block C, level 2',
      },
    ]);
  });

  test('cannot open until a project is chosen', () => {
    renderWithClient(
      createElement(AddObservationDialog, { projectId: undefined })
    );
    expect(button('Add observation').disabled).toBe(true);
  });

  test('a failed evidence upload keeps the files and retries against the same row', async () => {
    uploadResult = () => Promise.reject(new Error('storage down'));
    renderWithClient(
      createElement(AddObservationDialog, {
        projectId: 7,
        inspectionId: INSPECTION_ID,
      })
    );
    fireEvent.click(button('Add observation'));
    fireEvent.change(document.querySelector('#observation-title')!, {
      target: { value: 'Exposed rebar' },
    });
    const photo = new File(['x'], 'rebar.jpg', { type: 'image/jpeg' });
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [photo] },
    });
    await act(async () => {
      fireEvent.click(button('Record observation'));
    });
    // The row was created once and the upload failed against it.
    expect(createCalls).toHaveLength(1);
    expect(uploadCalls).toEqual([[OBS, [photo]]]);
    // The dialog is still open with the photo listed and the retry offered.
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.body.textContent).toContain('rebar.jpg');
    const retry = button('Retry evidence upload');
    expect(retry.disabled).toBe(false);
    // The fields are frozen: only the upload is retried.
    expect(
      (
        document.querySelector(
          '[data-testid="observation-fields"]'
        ) as HTMLFieldSetElement
      ).disabled
    ).toBe(true);

    uploadResult = () => Promise.resolve({ attachments: [], errors: [] });
    await act(async () => {
      fireEvent.click(retry);
    });
    // No second observation; the same id got the upload again; then closed.
    expect(createCalls).toHaveLength(1);
    expect(uploadCalls).toEqual([
      [OBS, [photo]],
      [OBS, [photo]],
    ]);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
