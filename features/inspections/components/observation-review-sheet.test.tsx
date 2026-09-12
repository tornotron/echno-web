import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
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
 * under the inspection it was opened from.
 */

const reviewCalls: Array<{ id: string; req: Record<string, unknown> }> = [];
let reviewResult: () => Promise<Observation>;
const createCalls: Array<Record<string, unknown>> = [];
const listCalls: Array<Record<string, unknown>> = [];
let rows: Observation[] = [];

mock.module('@/hooks/inspection', () => ({
  ...realInspectionHooks,
  useObservations: (params: Record<string, unknown>) => {
    listCalls.push(params);
    return {
      data: {
        content: rows,
        totalElements: rows.length,
        totalPages: 1,
        number: 0,
        size: 20,
      },
      isLoading: false,
      isError: false,
    };
  },
  useObservationEvidence: () => ({ data: [], isLoading: false }),
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
  rows = [pending];
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
    const { container } = render(
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
});

describe('ObservationReviewSheet', () => {
  test('accept sends the decision with a NONE outcome', async () => {
    render(
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
    render(
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
    const { container } = render(
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
    expect(container).toBeDefined();
  });

  test('a 409 reads as already decided', async () => {
    reviewResult = () => Promise.reject(new ApiError('Conflict', 409));
    render(
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

  test('after a decision the outcome link points at the record', async () => {
    reviewResult = () =>
      Promise.resolve({
        ...pending,
        inspectionId: INSPECTION_ID,
        reviewStatus: ObservationReviewStatus.ACCEPTED,
        outcomeKind: ObservationOutcomeKind.DEFECT,
        outcomeRef: '99999999-9999-4999-8999-999999999999',
      });
    render(
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
    render(
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
});
