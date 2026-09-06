/**
 * The active-filter chip is the only thing on a list page claiming the rows in
 * front of the reader are one person's work. It has to be true.
 *
 * Sixteen list pages used to render it on `employeeId != null && name`, a
 * looser condition than the one that narrowed, so a link carrying a role the
 * page does not apply showed every row under a chip naming a person. The
 * narrowing ignored the role and the chip did not, which turns a harmless
 * no-op into a wrong answer.
 *
 * This renders one real page end to end rather than exercising the hook,
 * because the defect lived in the gap between the two conditions and only a
 * page holds both. The tasks page is the one picked: it narrows in the
 * browser, it named its roles inline, and its old predicate ended in
 * `return true`, so an unapplied role fell through to the whole list.
 *
 * Assertions stay on strings and booleans, never on a rendered node: an
 * assertion that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';

/**
 * Rendering the whole page pulls the tasks table, its Radix controls and the
 * stats card in with it, which costs several seconds on the first pass. The
 * default five is not enough for that.
 */
const RENDER_TIMEOUT_MS = 30_000;

let search = '';

/** Stands in for every callback these mocks are only asked to provide. */
const noop = () => {};

import * as realNavigation from 'next/navigation';

mock.module('next/navigation', () => ({
  ...realNavigation,
  useSearchParams: () => new URLSearchParams(search),
  usePathname: () => '/users/dashboard/projects/all-tasks',
  useRouter: () => ({ replace: noop, push: noop, prefetch: noop }),
}));

import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useEmployeeLookup: () => ({
    data: [
      { id: 8, name: 'Ravi Kumar' },
      { id: 9, name: 'Priya Nair' },
    ],
  }),
}));

/*
  Two tasks by two different people. Employee 8 created one of them, so a
  `creator` filter on 8 is a filter that genuinely narrows, and a result
  showing both rows is a list nothing narrowed.
*/
const TASKS = [
  {
    id: 1,
    title: 'Pour the raft slab',
    status: 'ON_GOING',
    projectId: 1,
    assignees: [{ id: 9, name: 'Priya Nair' }],
    creator: { id: 8, name: 'Ravi Kumar' },
  },
  {
    id: 2,
    title: 'Erect the column shuttering',
    status: 'UPCOMING',
    projectId: 1,
    assignees: [{ id: 8, name: 'Ravi Kumar' }],
    creator: { id: 9, name: 'Priya Nair' },
  },
];

import * as realTaskHooks from '@tornotron/echno-core/task/hooks';

mock.module('@tornotron/echno-core/task/hooks', () => ({
  ...realTaskHooks,
  useTasks: () => ({ data: TASKS, isLoading: false }),
  usePrefetchTask: () => noop,
}));

import * as realProjectHooks from '@tornotron/echno-core/project/hooks';

mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({
    data: [{ id: 1, projectName: 'Marina Towers' }],
    isLoading: false,
  }),
}));

const allTasksModule = await import(
  '@/app/users/dashboard/projects/all-tasks/page'
);
const AllTasksPage = allTasksModule.default;

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

/** What the page shows for a given URL, reduced to the two facts that matter. */
function showFor(query: string) {
  search = query;
  const { container } = render(createElement(AllTasksPage), {
    wrapper: Wrapper,
  });
  const text = container.textContent ?? '';
  return {
    // The dismiss button belongs to the chip and to nothing else on the page.
    hasChip: container.querySelector('button[aria-label="Clear filter"]') != null,
    text,
    rows: TASKS.filter((task) => text.includes(task.title)).length,
  };
}

afterEach(cleanup);

describe('a role the list applies', () => {
  test('narrows the list, and the chip says whose work it is', () => {
    const shown = showFor('employeeId=8&role=creator');

    expect(shown.hasChip).toBe(true);
    expect(shown.text).toContain('Created by:');
    expect(shown.text).toContain('Ravi Kumar');
    expect(shown.rows).toBe(1);
    expect(shown.text).toContain('Pour the raft slab');
  }, RENDER_TIMEOUT_MS);
});

describe('a role the list does not apply', () => {
  /*
    `submitter` belongs to expenses, invoices and stock adjustments. The tasks
    list has never read it, so it narrows nothing here. That much was always
    true and is fine on its own: a link carrying another module's slug is a
    no-op. The chip is what used to turn it into a claim.
  */
  test('shows no chip, because the list in front of the reader is everyone', () => {
    const shown = showFor('employeeId=8&role=submitter');

    expect(shown.hasChip).toBe(false);
    expect(shown.text).not.toContain('Submitted by');
  }, RENDER_TIMEOUT_MS);

  test('and leaves the list unnarrowed, which is what made the chip a lie', () => {
    const shown = showFor('employeeId=8&role=submitter');

    expect(shown.rows).toBe(2);
  }, RENDER_TIMEOUT_MS);

  /*
    Not a hypothetical slug but an inherited one. A plain object literal carries
    `toString`, `constructor` and the rest from `Object.prototype`, so a roles
    map read through a bare index signature answers for keys nobody wrote.
    Reaching one of those hands the filter a string-returning "accessor", which
    matches no row: an empty list under a chip naming a person, the same defect
    at its worst.
  */
  test('including a slug inherited from Object.prototype', () => {
    const shown = showFor('employeeId=8&role=toString');

    expect(shown.hasChip).toBe(false);
    expect(shown.rows).toBe(2);
  }, RENDER_TIMEOUT_MS);
});

describe('no filter at all', () => {
  test('is the whole list and no chip', () => {
    const shown = showFor('');

    expect(shown.hasChip).toBe(false);
    expect(shown.rows).toBe(2);
  }, RENDER_TIMEOUT_MS);
});
