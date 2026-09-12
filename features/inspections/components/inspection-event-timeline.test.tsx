import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import * as realInspectionHooks from '@/hooks/inspection';
import type { InspectionEvent } from '@/types/inspection';

/**
 * The History tab (#437). Pinned: each event shows who, when, what and the
 * before-to-after of each changed field; the source decides which core hook
 * is enabled; and the page controls move through the server's pages.
 */

type Page = {
  content: InspectionEvent[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

let inspectionPage: Page | undefined;
let ncrPage: Page | undefined;
const inspectionCalls: Array<[string | undefined, { page?: number }]> = [];
const ncrCalls: Array<[string | undefined, { page?: number }]> = [];

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useEmployeeLookup: () => ({ data: [{ id: 7, name: 'Anita Rao' }] }),
}));

mock.module('@/hooks/inspection', () => ({
  ...realInspectionHooks,
  useInspectionEvents: (id?: string, params: { page?: number } = {}) => {
    inspectionCalls.push([id, params]);
    return {
      data: id ? inspectionPage : undefined,
      isLoading: false,
      isFetching: false,
    };
  },
  useNcrEvents: (id?: string, params: { page?: number } = {}) => {
    ncrCalls.push([id, params]);
    return {
      data: id ? ncrPage : undefined,
      isLoading: false,
      isFetching: false,
    };
  },
}));

const { InspectionEventTimeline } = await import('./inspection-event-timeline');

const NCR_ID = '33333333-3333-4333-8333-333333333333';
const INSPECTION_ID = '22222222-2222-4222-8222-222222222222';

function event(
  overrides: Partial<InspectionEvent> & { id: string }
): InspectionEvent {
  return {
    subjectType: 'NCR',
    subjectId: NCR_ID,
    inspectionId: INSPECTION_ID,
    eventType: 'ncr.status.changed',
    actorType: 'USER',
    actorId: '7',
    occurredAt: '2026-09-12T09:30:00',
    ...overrides,
  };
}

function page(content: InspectionEvent[], extra: Partial<Page> = {}): Page {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 25,
    ...extra,
  };
}

afterEach(() => {
  cleanup();
  inspectionPage = undefined;
  ncrPage = undefined;
  inspectionCalls.length = 0;
  ncrCalls.length = 0;
});

describe('InspectionEventTimeline', () => {
  test('renders actor, time, event and before-to-after for an NCR source', () => {
    ncrPage = page([
      event({
        id: 'e1',
        before: { status: 'assigned' },
        after: { status: 'corrective-action-complete' },
        note: 'Section re-poured.',
      }),
      event({
        id: 'e2',
        eventType: 'ncr.verified',
        actorType: 'AI',
        actorId: 'compliance-generator',
        after: { verifiedById: 7 },
      }),
    ]);
    const { container } = render(
      createElement(InspectionEventTimeline, {
        source: { kind: 'ncr', id: NCR_ID },
      })
    );
    const text = container.textContent ?? '';
    expect(container.querySelectorAll('[data-testid="event-row"]').length).toBe(
      2
    );
    expect(text).toInclude('Ncr status changed');
    expect(text).toInclude('Anita Rao');
    expect(text).toInclude('12 Sep 2026, 09:30');
    expect(text).toInclude('assigned');
    expect(text).toInclude('corrective-action-complete');
    expect(text).toInclude('Section re-poured.');
    expect(text).toInclude('Ncr verified');
    expect(text).toInclude('compliance-generator (ai)');
    expect(text).toInclude('2 events');

    // Only the NCR hook was enabled; the inspection one was called with no id.
    expect(ncrCalls.every(([id]) => id === NCR_ID)).toBe(true);
    expect(inspectionCalls.every(([id]) => id === undefined)).toBe(true);
  });

  test('reads an inspection source through the inspection hook', () => {
    inspectionPage = page([event({ id: 'e1', subjectType: 'CHECK_ITEM' })]);
    const { container } = render(
      createElement(InspectionEventTimeline, {
        source: { kind: 'inspection', id: INSPECTION_ID },
      })
    );
    expect(container.textContent).toInclude('Check item');
    expect(inspectionCalls.every(([id]) => id === INSPECTION_ID)).toBe(true);
    expect(ncrCalls.every(([id]) => id === undefined)).toBe(true);
  });

  test('says so when nothing has been recorded', () => {
    ncrPage = page([]);
    const { container } = render(
      createElement(InspectionEventTimeline, {
        source: { kind: 'ncr', id: NCR_ID },
      })
    );
    expect(container.textContent).toInclude('No history recorded yet');
  });

  test('Next asks the hook for the following page', () => {
    ncrPage = page([event({ id: 'e1' })], {
      totalElements: 60,
      totalPages: 3,
      number: 0,
    });
    const { container } = render(
      createElement(InspectionEventTimeline, {
        source: { kind: 'ncr', id: NCR_ID },
      })
    );
    expect(container.textContent).toInclude('page 1 of 3');
    const next = [...container.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Next'
    )!;
    const previous = [...container.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Previous'
    )!;
    expect(previous.hasAttribute('disabled')).toBe(true);
    fireEvent.click(next);
    expect(ncrCalls.at(-1)?.[1].page).toBe(1);
  });
});
