import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import * as realInspectionHooks from '@/hooks/inspection';
import {
  DefectSeverity,
  NcrStatus,
  NcrType,
  availableNcrActions,
  ncrActionLabels,
  type Ncr,
  type NcrAction,
} from '@/types/inspection';

// ---------------------------------------------------------------------------
// Doubles
//
// The screen is the thing under test, so every hook it reaches through is a
// stub. What matters is which buttons it offers for a given status and which
// mutation each one fires: the reviewer of #316 found the action map offering
// transitions the backend refuses, and that is a screen-level fault.
// ---------------------------------------------------------------------------

function mutation() {
  return { mutate: mock((..._args: unknown[]) => {}), isPending: false };
}

const assign = mutation();
const complete = mutation();
const verify = mutation();
const reject = mutation();
const reopen = mutation();
const close = mutation();

const mutations = { assign, complete, verify, reject, reopen, close };

let currentNcr: Ncr | undefined;

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useEmployeeLookup: () => ({ data: [{ id: 8, name: 'Ravi Kumar' }] }),
}));

mock.module('@/hooks/inspection', () => ({
  ...realInspectionHooks,
  useNcrById: () => ({ data: currentNcr, isLoading: false }),
  useInspectionById: () => ({ data: undefined, isLoading: false }),
  useAssignNcr: () => assign,
  useCompleteCorrectiveAction: () => complete,
  useVerifyNcr: () => verify,
  useRejectNcr: () => reject,
  useReopenNcr: () => reopen,
  useCloseNcr: () => close,
}));

mock.module('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    createElement('a', { href }, children),
}));

const { NcrDetail } = await import('./ncr-detail');

const NCR_ID = '33333333-3333-4333-8333-333333333333';

function ncrWith(status: NcrStatus): Ncr {
  return {
    id: NCR_ID,
    ncrNumber: 'NCR-2026-0007',
    type: NcrType.QUALITY,
    inspectionId: '22222222-2222-4222-8222-222222222222',
    title: 'Cover to reinforcement short of specification',
    description: 'Measured 20mm against a specified 40mm.',
    severity: DefectSeverity.MAJOR,
    status,
    siteEngineerId: 8,
    raisedById: 8,
    targetDate: '2026-09-10',
    createdAt: '2026-08-20T09:00:00Z',
  };
}

const ACTION_LABELS = Object.values(ncrActionLabels);

/** The lifecycle buttons the screen is offering, in the order shown. */
function offeredActions(status: NcrStatus): string[] {
  currentNcr = ncrWith(status);
  const { container } = render(createElement(NcrDetail, { ncrId: NCR_ID }));

  return [...container.querySelectorAll('button')]
    .map((button) => button.textContent?.trim() ?? '')
    .filter((label) => ACTION_LABELS.includes(label));
}

/** Clicks a lifecycle button on a screen showing an NCR in `status`. */
function clickAction(status: NcrStatus, action: NcrAction) {
  currentNcr = ncrWith(status);
  const { container } = render(createElement(NcrDetail, { ncrId: NCR_ID }));

  const button = [...container.querySelectorAll('button')].find(
    (candidate) => candidate.textContent?.trim() === ncrActionLabels[action]
  );
  if (!button)
    throw new Error(`No "${ncrActionLabels[action]}" button on screen`);

  fireEvent.click(button);
}

/** Names of the mutations that were fired, so a wrong endpoint shows up. */
function firedMutations(): string[] {
  return Object.entries(mutations)
    .filter(([, spy]) => spy.mutate.mock.calls.length > 0)
    .map(([name]) => name);
}

beforeEach(() => {
  for (const spy of Object.values(mutations)) spy.mutate.mockReset();
});

afterEach(() => {
  cleanup();
  currentNcr = undefined;
});

// Radix dialogs and selects go through the DOM shim, which is slow enough to
// overrun the default per-test budget.
const RENDER_TIMEOUT_MS = 20_000;

// ---------------------------------------------------------------------------
// What the screen offers
// ---------------------------------------------------------------------------

describe('NcrDetail — the actions offered for each status', () => {
  // Written out rather than derived, so this is an independent statement of
  // the backend's transitions and not a restatement of the map. A rejected or
  // reopened NCR offering "Mark Corrected" is the bug this pins: the endpoint
  // answers 400 from those two states.
  const expected: Array<[NcrStatus, string[]]> = [
    [NcrStatus.OPEN, ['Assign']],
    [NcrStatus.ASSIGNED, ['Mark Corrected', 'Assign']],
    [NcrStatus.REJECTED, ['Assign']],
    [NcrStatus.REOPENED, ['Assign']],
    [NcrStatus.CORRECTIVE_ACTION_COMPLETE, ['Verify', 'Reject']],
    [NcrStatus.VERIFIED, ['Close', 'Reopen']],
    [NcrStatus.CLOSED, ['Reopen']],
  ];

  for (const [status, labels] of expected) {
    test(
      `a ${status} NCR offers ${labels.join(' + ')}`,
      () => {
        expect(offeredActions(status)).toEqual(labels);
      },
      RENDER_TIMEOUT_MS
    );
  }

  test(
    'the screen never offers a transition the lifecycle map refuses',
    () => {
      for (const status of Object.values(NcrStatus)) {
        const shown = offeredActions(status);
        const allowed = availableNcrActions(status).map(
          (action) => ncrActionLabels[action]
        );

        expect(shown).toEqual(allowed);
        cleanup();
      }
    },
    RENDER_TIMEOUT_MS
  );
});

// ---------------------------------------------------------------------------
// What the buttons do
// ---------------------------------------------------------------------------

describe('NcrDetail — each action fires its own endpoint', () => {
  test(
    'Close settles the NCR straight away, with no remarks step',
    () => {
      clickAction(NcrStatus.VERIFIED, 'close');

      expect(firedMutations()).toEqual(['close']);
      expect(close.mutate.mock.calls[0][0]).toBe(NCR_ID);
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'Assign opens the assignment form rather than assigning blind',
    () => {
      clickAction(NcrStatus.OPEN, 'assign');

      // Assignment needs an engineer and a date, so nothing is sent on the click
      // itself.
      expect(firedMutations()).toEqual([]);
      expect(document.querySelectorAll('[role="dialog"]').length).toBe(1);
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'Mark Corrected asks for remarks, then reports the correction',
    () => {
      clickAction(NcrStatus.ASSIGNED, 'corrective-action-complete');
      expect(firedMutations()).toEqual([]);

      const remarks = document.querySelector('#ncr-remarks')!;
      fireEvent.change(remarks, {
        target: { value: '  Cover re-cast to 40mm and re-measured.  ' },
      });
      submitDialog('Mark Corrected');

      expect(firedMutations()).toEqual(['complete']);
      expect(complete.mutate.mock.calls[0][0]).toEqual({
        id: NCR_ID,
        req: { remarks: 'Cover re-cast to 40mm and re-measured.' },
      });
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'remarks left blank are omitted rather than sent as an empty string',
    () => {
      clickAction(NcrStatus.CORRECTIVE_ACTION_COMPLETE, 'verify');
      submitDialog('Verify');

      expect(firedMutations()).toEqual(['verify']);
      expect(verify.mutate.mock.calls[0][0]).toEqual({
        id: NCR_ID,
        req: undefined,
      });
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'Reject sends the rework back and touches nothing else',
    () => {
      clickAction(NcrStatus.CORRECTIVE_ACTION_COMPLETE, 'reject');
      fireEvent.change(document.querySelector('#ncr-remarks')!, {
        target: { value: 'Cover still short on the east face.' },
      });
      submitDialog('Reject');

      expect(firedMutations()).toEqual(['reject']);
      expect(reject.mutate.mock.calls[0][0]).toEqual({
        id: NCR_ID,
        req: { remarks: 'Cover still short on the east face.' },
      });
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'Reopen from closed goes to the reopen endpoint',
    () => {
      clickAction(NcrStatus.CLOSED, 'reopen');
      submitDialog('Reopen');

      expect(firedMutations()).toEqual(['reopen']);
    },
    RENDER_TIMEOUT_MS
  );
});

/** Clicks the confirm button inside the open remarks dialog. */
function submitDialog(label: string) {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) throw new Error('No dialog open');

  const button = [...dialog.querySelectorAll('button')].findLast(
    (candidate) => candidate.textContent?.trim() === label
  );
  if (!button) throw new Error(`No "${label}" button in the dialog`);

  fireEvent.click(button);
}

// ---------------------------------------------------------------------------
// Where a name on the report leads (web#35)
//
// Clicking a person on an NCR asks "what else is sitting with them", so it
// opens the register filtered to that person rather than their staff profile.
// All four now work: the site engineer, which the endpoint has always filtered
// on, plus the raiser, the verifier and the closer, which echno-backend#626
// added and echno-core reaches from v3.5.0.
//
// None of them could be done in the browser first. The register is paged, so
// narrowing the fetched page would hide every match outside it while still
// reading as a complete answer, which is why "Raised by" spent three releases
// as plain text.
//
// Every one is an **employee** id, written from `currentEmployeeId()`, so every
// href says `employeeId=` and none says `userId=`. That is what the assertions
// below are really pinning: on a fresh database the two sequences run in
// lockstep, so a link built off the wrong kind would show the right name here
// and the wrong one later.
// ---------------------------------------------------------------------------

const NCR_REGISTER = '/users/dashboard/inspections/ncr';

/** Renders an assigned NCR, with any field overridden. */
function renderNcr(overrides: Partial<Ncr> = {}) {
  currentNcr = { ...ncrWith(NcrStatus.ASSIGNED), ...overrides };
  return render(createElement(NcrDetail, { ncrId: NCR_ID }));
}

/** Every href on the rendered screen that carries an employee filter. */
function employeeFilterHrefs(container: HTMLElement): string[] {
  return [...container.querySelectorAll('a')]
    .map((anchor) => anchor.getAttribute('href') ?? '')
    .filter((href) => href.includes('employeeId='));
}

describe('NcrDetail — the people on the report', () => {
  test(
    'the site engineer opens the register filtered to their own reports',
    () => {
      // Distinct from the raiser, so the assertion cannot be satisfied by the
      // link belonging to the other field.
      const { container } = renderNcr({ siteEngineerId: 8, raisedById: 14 });

      expect(employeeFilterHrefs(container)).toContain(
        `${NCR_REGISTER}?employeeId=8&role=site-engineer`
      );
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'the raiser opens the register filtered to what they raised',
    () => {
      // Distinct ids on purpose. With one person in both fields a link built off
      // the wrong field would produce exactly the right href.
      const { container } = renderNcr({ siteEngineerId: 8, raisedById: 14 });

      expect(employeeFilterHrefs(container)).toContain(
        `${NCR_REGISTER}?employeeId=14&role=raiser`
      );
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'every people link claims an employee id, never a user id',
    () => {
      const { container } = renderNcr({ siteEngineerId: 8, raisedById: 14 });

      const all = [...container.querySelectorAll('a')].map(
        (anchor) => anchor.getAttribute('href') ?? ''
      );
      expect(
        all.filter((href) => href.includes('role=')).length
      ).toBeGreaterThan(0);
      expect(all.some((href) => href.includes('userId='))).toBe(false);
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'a report with no raiser recorded offers no raiser link',
    () => {
      const { container } = renderNcr({
        siteEngineerId: 8,
        raisedById: undefined,
      });

      expect(
        employeeFilterHrefs(container).some((href) =>
          href.includes('role=raiser')
        )
      ).toBe(false);
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'an engineer the directory does not carry is still shown as assigned',
    () => {
      // The name is unresolvable, the assignment is not. Reading this as
      // "Unassigned" would misstate the record, and would leave the one person
      // accountable for the report unreachable from it.
      const { container } = renderNcr({
        siteEngineerId: 99,
        raisedById: undefined,
      });

      expect(employeeFilterHrefs(container)).toEqual([
        `${NCR_REGISTER}?employeeId=99&role=site-engineer`,
      ]);
      expect(container.textContent?.includes('Unassigned')).toBe(false);
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'an unassigned report offers no engineer link at all',
    () => {
      const { container } = renderNcr({
        siteEngineerId: undefined,
        raisedById: undefined,
      });

      expect(
        employeeFilterHrefs(container).some((href) =>
          href.includes('role=site-engineer')
        )
      ).toBe(false);
      expect(container.textContent?.includes('Unassigned')).toBe(true);
    },
    RENDER_TIMEOUT_MS
  );
});
