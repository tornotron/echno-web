import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import * as realInspectionHooks from '@/hooks/inspection';
import {
  CheckItemStatus,
  InspectionResult,
  InspectionStatus,
  InspectionType,
  type Inspection,
  type InspectionCheckItem,
} from '@/types/inspection';

// ---------------------------------------------------------------------------
// Doubles
// ---------------------------------------------------------------------------

const updateInspection = {
  mutate: mock((..._args: unknown[]) => {}),
  isPending: false,
};

let currentInspection: Inspection | undefined;

mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({ data: [{ id: 3, projectName: 'Anna Nagar Tower' }] }),
}));
mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useEmployeeLookup: () => ({ data: [{ id: 8, name: 'Ravi Kumar' }] }),
}));
mock.module('@/hooks/inspection', () => ({
  ...realInspectionHooks,
  useInspectionById: () => ({ data: currentInspection, isLoading: false }),
  useUpdateInspection: () => updateInspection,
  // A failed check point renders the "raise an NCR" dialog beneath it, which
  // reaches for these two. Stubbed so the run sheet is the only thing here
  // talking to anything.
  useInspections: () => ({ data: [], isLoading: false }),
  useCreateNcr: () => ({
    mutate: mock((..._args: unknown[]) => {}),
    isPending: false,
  }),
}));

const toast = {
  success: mock((..._args: unknown[]) => {}),
  error: mock((..._args: unknown[]) => {}),
  info: mock((..._args: unknown[]) => {}),
  warning: mock((..._args: unknown[]) => {}),
};
mock.module('@/lib/styles/toast-styles', () => ({ toast }));

const { InspectionRuntime } = await import('./inspection-runtime');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INSPECTION_ID = '22222222-2222-4222-8222-222222222222';

function checkItem(
  id: string,
  overrides: Partial<InspectionCheckItem> = {}
): InspectionCheckItem {
  return {
    id,
    category: 'Reinforcement',
    checkPoint: `Check point ${id}`,
    specification: '40mm cover',
    status: CheckItemStatus.PASSED,
    photosRequired: false,
    ...overrides,
  } as InspectionCheckItem;
}

function inspectionWith(
  checkItems: InspectionCheckItem[],
  overrides: Partial<Inspection> = {}
): Inspection {
  return {
    id: INSPECTION_ID,
    inspectionNumber: 'INS-2026-0042',
    title: 'Slab reinforcement inspection',
    type: InspectionType.QUALITY,
    status: InspectionStatus.SCHEDULED,
    result: InspectionResult.PENDING,
    projectId: 3,
    location: 'Block C, Level 4',
    areaInspected: 'Grid C3-C6',
    scheduledDate: '2026-08-25',
    inspectorId: 8,
    checkItems,
    defects: [],
    ...overrides,
  } as unknown as Inspection;
}

function renderRuntime(inspection: Inspection) {
  currentInspection = inspection;
  const view = render(
    createElement(InspectionRuntime, { inspectionId: INSPECTION_ID })
  );

  const buttonNamed = (label: string) =>
    [...view.container.querySelectorAll('button')].find((button) =>
      button.textContent?.trim().startsWith(label)
    );

  return {
    ...view,
    text: () => view.container.textContent ?? '',
    click: (label: string) => {
      const button = buttonNamed(label);
      if (!button) throw new Error(`No "${label}" button on screen`);
      fireEvent.click(button);
    },
    has: (label: string) => Boolean(buttonNamed(label)),
    /** The request body of the most recent save. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    saved: () => (updateInspection.mutate.mock.calls.at(-1)![0] as any).req,
  };
}

beforeEach(() => {
  updateInspection.mutate.mockReset();
  for (const spy of Object.values(toast)) spy.mockReset();
});

afterEach(() => {
  cleanup();
  currentInspection = undefined;
});

// The run sheet renders a toggle group per check point through the DOM shim,
// which is slow enough to overrun the default per-test budget.
const RENDER_TIMEOUT_MS = 20_000;

// ---------------------------------------------------------------------------
// What blocks a save
// ---------------------------------------------------------------------------

describe('InspectionRuntime — completing is gated on a usable record', () => {
  test('an unanswered check point blocks completion', () => {
    const view = renderRuntime(
      inspectionWith([
        checkItem('a'),
        checkItem('b', { status: CheckItemStatus.PENDING }),
      ])
    );

    view.click('Complete inspection');

    expect(updateInspection.mutate).not.toHaveBeenCalled();
    expect(view.text()).toContain('1 check point needs attention');
    expect(view.text()).toContain('Record an outcome for this check point.');
  }, RENDER_TIMEOUT_MS);

  test('a failed check point with no remark blocks completion', () => {
    // A failure with nothing written down leaves whoever picks up the NCR
    // nothing to act on, which is the whole reason the gate exists.
    const view = renderRuntime(
      inspectionWith([checkItem('a', { status: CheckItemStatus.FAILED })])
    );

    view.click('Complete inspection');

    expect(updateInspection.mutate).not.toHaveBeenCalled();
    expect(view.text()).toContain(
      'Say what was wrong before failing this check point.'
    );
  }, RENDER_TIMEOUT_MS);

  test('writing the remark clears the block and the remark reaches the payload', () => {
    const view = renderRuntime(
      inspectionWith([checkItem('a', { status: CheckItemStatus.FAILED })])
    );

    view.click('Complete inspection');
    fireEvent.change(view.container.querySelector('#remarks-a')!, {
      target: { value: 'Cover 20mm against a specified 40mm.' },
    });

    expect(view.text()).not.toContain(
      'Say what was wrong before failing this check point.'
    );

    view.click('Complete inspection');

    expect(updateInspection.mutate).toHaveBeenCalledTimes(1);
    expect(view.saved().checkItems[0].remarks).toBe(
      'Cover 20mm against a specified 40mm.'
    );
  }, RENDER_TIMEOUT_MS);
});

// ---------------------------------------------------------------------------
// What gets sent
// ---------------------------------------------------------------------------

describe('InspectionRuntime — the save payload', () => {
  test('completing sends every check point back, scored, with no view state on it', () => {
    const view = renderRuntime(
      inspectionWith([
        checkItem('a'),
        checkItem('b', {
          status: CheckItemStatus.FAILED,
          remarks: 'Spacing 200mm against a specified 150mm.',
        }),
        checkItem('c', { status: CheckItemStatus.NOT_APPLICABLE }),
      ])
    );

    view.click('Complete inspection');

    const request = view.saved();
    expect(request.status).toBe(InspectionStatus.COMPLETED);
    // One pass and one fail assessed, the N/A ignored: 50%, which is a fail.
    expect(request.result).toBe(InspectionResult.FAILED);
    expect(request.checkItems.length).toBe(3);
    expect(request.checkItems.map((item: { status: string }) => item.status)).toEqual([
      CheckItemStatus.PASSED,
      CheckItemStatus.FAILED,
      CheckItemStatus.NOT_APPLICABLE,
    ]);
    // `key` is the runtime's own React key. The endpoint replaces the whole
    // set, so anything extra on the way out is a field the backend rejects.
    expect(Object.hasOwn(request.checkItems[0], 'key')).toBe(false);
  }, RENDER_TIMEOUT_MS);

  test('an outcome recorded on screen is the one that is saved', () => {
    const view = renderRuntime(
      inspectionWith([checkItem('a', { status: CheckItemStatus.PENDING })])
    );

    const passed = [...view.container.querySelectorAll('button')].find(
      (button) => button.getAttribute('aria-label') === 'Passed'
    );
    if (!passed) throw new Error('No "Passed" outcome on screen');
    fireEvent.click(passed);

    view.click('Complete inspection');

    expect(updateInspection.mutate).toHaveBeenCalledTimes(1);
    expect(view.saved().checkItems[0].status).toBe(CheckItemStatus.PASSED);
  }, RENDER_TIMEOUT_MS);

  test('an all-pass inspection is recorded as passed', () => {
    const view = renderRuntime(
      inspectionWith([checkItem('a'), checkItem('b')])
    );

    view.click('Complete inspection');

    expect(view.saved().result).toBe(InspectionResult.PASSED);
  }, RENDER_TIMEOUT_MS);

  test('a critical defect fails the inspection whatever the score says', () => {
    const view = renderRuntime(
      inspectionWith([checkItem('a')], {
        // Severity is free text on the backend, so the match is case-blind.
        defects: [
          {
            id: 'd1',
            category: 'Structural',
            description: 'Honeycombing at the column head',
            severity: 'Critical',
            status: 'open',
          },
        ],
      } as unknown as Partial<Inspection>)
    );

    view.click('Complete inspection');

    expect(view.saved().result).toBe(InspectionResult.FAILED);
    // PUT replaces the whole inspection, so a defect recorded elsewhere has to
    // be threaded back or it is deleted by this save.
    expect(view.saved().defects.length).toBe(1);
    expect(view.saved().defects[0].description).toBe(
      'Honeycombing at the column head'
    );
  }, RENDER_TIMEOUT_MS);

  test('saving progress moves a scheduled inspection into progress and concludes nothing', () => {
    const view = renderRuntime(
      inspectionWith([
        checkItem('a'),
        checkItem('b', { status: CheckItemStatus.PENDING }),
      ])
    );

    view.click('Save progress');

    const request = view.saved();
    expect(request.status).toBe(InspectionStatus.IN_PROGRESS);
    // A part-way save is not a verdict, so the stored result is carried over.
    expect(request.result).toBe(InspectionResult.PENDING);
  }, RENDER_TIMEOUT_MS);

  test('saving progress again does not drag an in-progress inspection backwards', () => {
    const view = renderRuntime(
      inspectionWith([checkItem('a')], {
        status: InspectionStatus.IN_PROGRESS,
      })
    );

    view.click('Save progress');

    expect(view.saved().status).toBe(InspectionStatus.IN_PROGRESS);
  }, RENDER_TIMEOUT_MS);
});

// ---------------------------------------------------------------------------
// Closed inspections
// ---------------------------------------------------------------------------

describe('InspectionRuntime — a concluded inspection is a record, not a form', () => {
  test('a completed inspection offers no way to write to it', () => {
    const view = renderRuntime(
      inspectionWith([checkItem('a')], {
        status: InspectionStatus.COMPLETED,
      })
    );

    expect(view.has('Complete inspection')).toBe(false);
    expect(view.has('Save progress')).toBe(false);
    expect(view.text()).toContain('This inspection is closed');
    expect(
      view.container.querySelector<HTMLTextAreaElement>('#remarks-a')!.disabled
    ).toBe(true);
  }, RENDER_TIMEOUT_MS);

  test('an inspection with no scheduled date cannot be saved at all', () => {
    const view = renderRuntime(
      inspectionWith([checkItem('a')], { scheduledDate: undefined })
    );

    view.click('Complete inspection');

    expect(updateInspection.mutate).not.toHaveBeenCalled();
    expect(view.text()).toContain('This inspection has no scheduled date');
  }, RENDER_TIMEOUT_MS);
});
