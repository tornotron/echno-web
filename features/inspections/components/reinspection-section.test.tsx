import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import * as realInspectionHooks from '@/hooks/inspection';
import {
  DefectSeverity,
  NcrStatus,
  NcrType,
  ReinspectionOutcome,
  type Ncr,
  type Reinspection,
} from '@/types/inspection';

/**
 * The reinspection section on an NCR (#437). What is pinned: the attempts
 * render with their sequence and outcome, "Schedule reinspection" is offered
 * only from corrective-action-complete with no open attempt, and scheduling
 * and recording an outcome go through the core hooks with the NCR's id and
 * the attempt's id respectively.
 */

function mutation() {
  return { mutate: mock((..._args: unknown[]) => {}), isPending: false };
}

const scheduleForNcr = mutation();
const scheduleForDefect = mutation();
const recordOutcome = mutation();

let currentAttempts: Reinspection[] = [];

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useEmployeeLookup: () => ({ data: [{ id: 8, name: 'Ravi Kumar' }] }),
}));

mock.module('@/hooks/inspection', () => ({
  ...realInspectionHooks,
  useReinspectionsByNcr: () => ({ data: currentAttempts, isLoading: false }),
  useScheduleReinspectionForNcr: () => scheduleForNcr,
  useScheduleReinspectionForDefect: () => scheduleForDefect,
  useRecordReinspectionOutcome: () => recordOutcome,
}));

mock.module('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    createElement('a', { href }, children),
}));

const { DefectReinspectionButton, ReinspectionSection } =
  await import('./reinspection-section');

const NCR_ID = '33333333-3333-4333-8333-333333333333';
const INSPECTION_ID = '22222222-2222-4222-8222-222222222222';
const CLONE_1 = '66666666-6666-4666-8666-666666666661';
const CLONE_2 = '66666666-6666-4666-8666-666666666662';
const DEFECT_ID = '77777777-7777-4777-8777-777777777777';

function ncrWith(status: NcrStatus): Ncr {
  return {
    id: NCR_ID,
    ncrNumber: 'NCR-2026-0007',
    type: NcrType.QUALITY,
    inspectionId: INSPECTION_ID,
    title: 'Cover short',
    description: '',
    severity: DefectSeverity.MAJOR,
    status,
  };
}

function attempt(
  overrides: Partial<Reinspection> & { id: string; sequence: number }
): Reinspection {
  return {
    ncrId: NCR_ID,
    originalInspectionId: INSPECTION_ID,
    reinspectionInspectionId: CLONE_1,
    outcome: ReinspectionOutcome.PENDING,
    assignedInspectorId: 8,
    ...overrides,
  };
}

function buttons(container: HTMLElement): string[] {
  return [...container.querySelectorAll('button')].map(
    (button) => button.textContent?.trim() ?? ''
  );
}

beforeEach(() => {
  scheduleForNcr.mutate.mockReset();
  scheduleForDefect.mutate.mockReset();
  recordOutcome.mutate.mockReset();
});

afterEach(() => {
  cleanup();
  currentAttempts = [];
});

const RENDER_TIMEOUT_MS = 20_000;

describe('ReinspectionSection', () => {
  test('renders each attempt with its sequence, outcome and inspection link', () => {
    currentAttempts = [
      attempt({
        id: 'a1',
        sequence: 1,
        outcome: ReinspectionOutcome.FAILED,
        remarks: 'Still short on the east face.',
      }),
      attempt({
        id: 'a2',
        sequence: 2,
        outcome: ReinspectionOutcome.PASSED,
        reinspectionInspectionId: CLONE_2,
      }),
    ];
    const { container } = render(
      createElement(ReinspectionSection, { ncr: ncrWith(NcrStatus.VERIFIED) })
    );
    const text = container.textContent ?? '';
    expect(text).toInclude('Attempt 2');
    expect(text).toInclude('Passed');
    expect(text).toInclude('Attempt 1');
    expect(text).toInclude('Failed');
    expect(text).toInclude('Still short on the east face.');
    expect(text).toInclude('Ravi Kumar');
    // Newest first, and each links to its own re-check inspection.
    expect(text.indexOf('Attempt 2')).toBeLessThan(text.indexOf('Attempt 1'));
    const hrefs = [...container.querySelectorAll('a')].map((a) =>
      a.getAttribute('href')
    );
    expect(hrefs.some((href) => href?.includes(CLONE_2))).toBe(true);
    expect(hrefs.some((href) => href?.includes(CLONE_1))).toBe(true);
    // Nothing is open, so nothing to record.
    expect(buttons(container)).not.toContain('Record outcome');
  });

  test('offers Schedule only from corrective-action-complete with no open attempt', () => {
    const { container: awaiting } = render(
      createElement(ReinspectionSection, {
        ncr: ncrWith(NcrStatus.CORRECTIVE_ACTION_COMPLETE),
      })
    );
    expect(buttons(awaiting)).toContain('Schedule reinspection');
    cleanup();

    const { container: assigned } = render(
      createElement(ReinspectionSection, { ncr: ncrWith(NcrStatus.ASSIGNED) })
    );
    expect(buttons(assigned)).not.toContain('Schedule reinspection');
    cleanup();

    currentAttempts = [attempt({ id: 'a1', sequence: 1 })];
    const { container: open } = render(
      createElement(ReinspectionSection, {
        ncr: ncrWith(NcrStatus.CORRECTIVE_ACTION_COMPLETE),
      })
    );
    expect(buttons(open)).not.toContain('Schedule reinspection');
    expect(buttons(open)).toContain('Record outcome');
  });

  test(
    'scheduling goes through the core hook with the NCR id and the due date',
    () => {
      const { container } = render(
        createElement(ReinspectionSection, {
          ncr: ncrWith(NcrStatus.CORRECTIVE_ACTION_COMPLETE),
        })
      );
      fireEvent.click(
        [...container.querySelectorAll('button')].find(
          (b) => b.textContent?.trim() === 'Schedule reinspection'
        )!
      );
      fireEvent.change(document.querySelector('#reinspection-target')!, {
        target: { value: '2026-09-20' },
      });
      fireEvent.click(
        [...document.querySelectorAll('button')].find(
          (b) => b.textContent?.trim() === 'Schedule'
        )!
      );
      expect(scheduleForNcr.mutate.mock.calls[0][0]).toEqual({
        ncrId: NCR_ID,
        req: { targetDate: '2026-09-20' },
      });
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'recording an outcome sends the attempt id, the outcome and trimmed remarks',
    () => {
      currentAttempts = [attempt({ id: 'a1', sequence: 1 })];
      const { container } = render(
        createElement(ReinspectionSection, {
          ncr: ncrWith(NcrStatus.CORRECTIVE_ACTION_COMPLETE),
        })
      );
      fireEvent.click(
        [...container.querySelectorAll('button')].find(
          (b) => b.textContent?.trim() === 'Record outcome'
        )!
      );
      fireEvent.change(document.querySelector('#reinspection-remarks')!, {
        target: { value: '  Cover re-measured at 42 mm.  ' },
      });
      fireEvent.click(
        [...document.querySelectorAll('button')].find(
          (b) =>
            b.textContent?.trim() === 'Record outcome' &&
            b.closest('[role="dialog"]')
        )!
      );
      expect(recordOutcome.mutate.mock.calls[0][0]).toEqual({
        id: 'a1',
        req: {
          outcome: ReinspectionOutcome.PASSED,
          remarks: 'Cover re-measured at 42 mm.',
        },
      });
    },
    RENDER_TIMEOUT_MS
  );
});

describe('DefectReinspectionButton', () => {
  test(
    'schedules from the defect through the defect hook',
    () => {
      const { container } = render(
        createElement(DefectReinspectionButton, {
          defectId: DEFECT_ID,
          label: 'defect "Cover short"',
        })
      );
      fireEvent.click(container.querySelector('button')!);
      fireEvent.click(
        [...document.querySelectorAll('button')].find(
          (b) => b.textContent?.trim() === 'Schedule'
        )!
      );
      expect(scheduleForDefect.mutate.mock.calls[0][0]).toEqual({
        defectId: DEFECT_ID,
        req: {},
      });
      expect(scheduleForNcr.mutate.mock.calls.length).toBe(0);
    },
    RENDER_TIMEOUT_MS
  );
});
