import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';

/**
 * A person's name on an NCR detail links to this register filtered to them
 * (web#35). The filter has to reach the list query: `GET /ncrs/web` is paged,
 * so narrowing the fetched rows in the browser would drop every match that fell
 * outside the page while still looking like a complete answer.
 *
 * Four roles reach it now. `siteEngineerId` always could; `raisedById`,
 * `verifiedById` and `closedById` arrived with echno-backend#626 and became
 * reachable from `NcrListParams` in echno-core v3.5.0.
 *
 * These tests pin what the page asks the endpoint for, given the URL, and in
 * particular that **each slug drives its own parameter**. All four take an
 * employee id from the same source, so a slug wired to the wrong parameter
 * would return a plausible list of somebody else's reports rather than failing.
 */

let search = '';
const replaced: string[] = [];

import * as realNavigation from 'next/navigation';

mock.module('next/navigation', () => ({
  ...realNavigation,
  useSearchParams: () => new URLSearchParams(search),
  usePathname: () => '/users/dashboard/inspections/ncr',
  useRouter: () => ({
    replace: (href: string) => {
      replaced.push(href);
    },
  }),
}));

import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useEmployeeLookup: () => ({ data: [{ id: 8, name: 'Ravi Kumar' }] }),
}));

/** Every params object the page handed the list query, newest last. */
const listCalls: Array<Record<string, unknown>> = [];

import * as realInspectionHooks from '@/hooks/inspection';

mock.module('@/hooks/inspection', () => ({
  ...realInspectionHooks,
  useInspections: () => ({ data: [], isLoading: false }),
  useNcrs: (params: Record<string, unknown>) => {
    listCalls.push(params);
    return { data: [], isLoading: false };
  },
}));

// The create dialog and the table pull in the whole NCR write path and the
// employee directory; neither takes part in what is under test here.
mock.module('@/features/inspections/components/create-ncr-dialog', () => ({
  CreateNcrDialog: () => null,
}));

mock.module('@/features/inspections/components/ncr-table', () => ({
  NcrTable: () => null,
}));

const pageModule = await import('./page');
const NcrPage = pageModule.default;

/** Renders the page at `query` and returns the params it asked the list for. */
function paramsFor(query: string): Record<string, unknown> {
  search = query;
  render(createElement(NcrPage));
  return listCalls.at(-1)!;
}

afterEach(() => {
  cleanup();
  listCalls.length = 0;
  replaced.length = 0;
  search = '';
});

// Radix selects go through the DOM shim, which overruns the default budget.
const RENDER_TIMEOUT_MS = 20_000;

describe('the NCR register reads the site-engineer filter from the URL', () => {
  test(
    'a site-engineer link narrows the list query server-side',
    () => {
      const params = paramsFor('employeeId=8&role=site-engineer');

      expect(params.siteEngineerId).toBe(8);
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'no filter in the URL asks for the whole register',
    () => {
      const params = paramsFor('');

      expect(params.siteEngineerId).toBeUndefined();
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'an employee filter meant for another module does not narrow this one',
    () => {
      // `?employeeId=8&role=inspector` belongs to the inspections list. Read
      // here it would silently hide every NCR the person is not the engineer
      // on, which is a different question from the one the link asked.
      const params = paramsFor('employeeId=8&role=inspector');

      expect(params.siteEngineerId).toBeUndefined();
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'a raiser link narrows on raisedById and on nothing else',
    () => {
      const params = paramsFor('employeeId=8&role=raiser');

      expect(params.raisedById).toBe(8);
      expect(params.siteEngineerId).toBeUndefined();
      expect(params.verifiedById).toBeUndefined();
      expect(params.closedById).toBeUndefined();
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'a verifier link narrows on verifiedById and on nothing else',
    () => {
      const params = paramsFor('employeeId=8&role=verifier');

      expect(params.verifiedById).toBe(8);
      expect(params.raisedById).toBeUndefined();
      expect(params.closedById).toBeUndefined();
      expect(params.siteEngineerId).toBeUndefined();
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'a closer link narrows on closedById and on nothing else',
    () => {
      // Verifying and closing are separate steps taken by separate people, so
      // collapsing the two would answer a question nobody asked.
      const params = paramsFor('employeeId=8&role=closer');

      expect(params.closedById).toBe(8);
      expect(params.verifiedById).toBeUndefined();
      expect(params.raisedById).toBeUndefined();
      expect(params.siteEngineerId).toBeUndefined();
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'no filter asks for none of the three',
    () => {
      const params = paramsFor('');

      expect(params.raisedById).toBeUndefined();
      expect(params.verifiedById).toBeUndefined();
      expect(params.closedById).toBeUndefined();
    },
    RENDER_TIMEOUT_MS
  );

  test(
    'the engineer control shows whoever the link named',
    () => {
      search = 'employeeId=8&role=site-engineer';
      const { container } = render(createElement(NcrPage));

      const trigger = container.querySelector('#ncr-filter-engineer');

      expect(trigger?.textContent).toBe('Ravi Kumar');
    },
    RENDER_TIMEOUT_MS
  );
});
