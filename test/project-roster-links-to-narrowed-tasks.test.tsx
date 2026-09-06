/**
 * What clicking a name in a project's team roster opens.
 *
 * Every other person's name in the app is a "who did this" stamp on a
 * document, and clicking it opens that module's list filtered to them. A team
 * membership is not an action, so the roster was left as plain text while
 * somebody decided what it should mean. It means their tasks on this project:
 * read on a project page, the question a name raises is what that person is
 * doing here.
 *
 * The destination has to be a list that really is narrowed at both ends, or
 * the link ships the very defect the filter convention exists to avoid. Both
 * ends are checked here. The project half is the route, which fetches through
 * `useTasksByProject`; the assignee half is the filter this adds. Neither is
 * a page of a larger set: `useTasksByProject` returns the project's tasks
 * whole.
 *
 * Assertions stay on strings and counts, never on a rendered node: an
 * assertion that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';

/**
 * Rendering either screen pulls its table and Radix controls in with it, which
 * costs several seconds on the first pass. The default five is not enough.
 */
const RENDER_TIMEOUT_MS = 30_000;

/** Stands in for every callback these mocks are only asked to provide. */
const noop = () => {};

let search = '';

import * as realNavigation from 'next/navigation';

mock.module('next/navigation', () => ({
  ...realNavigation,
  useParams: () => ({ id: '7' }),
  useSearchParams: () => new URLSearchParams(search),
  usePathname: () => '/users/dashboard/projects/all-projects/7/tasks',
  useRouter: () => ({ replace: noop, push: noop, prefetch: noop }),
}));

const RAVI = { id: 8, name: 'Ravi Kumar', designation: 'Site Engineer' };
const PRIYA = { id: 9, name: 'Priya Nair', designation: 'Site Engineer' };

import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useEmployeeLookup: () => ({ data: [RAVI, PRIYA] }),
  useEmployees: () => ({ data: [RAVI, PRIYA], isLoading: false }),
}));

/*
  Two tasks on project 7, one assigned to each person. A result showing both is
  a list nothing narrowed, which is the whole thing being guarded against.
*/
const PROJECT_TASKS = [
  {
    id: 1,
    projectId: 7,
    title: 'Pour the raft slab',
    status: 'ON_GOING',
    progress: 40,
    assignees: [RAVI],
  },
  {
    id: 2,
    projectId: 7,
    title: 'Erect the column shuttering',
    status: 'UPCOMING',
    progress: 0,
    assignees: [PRIYA],
  },
];

import * as realTaskHooks from '@tornotron/echno-core/task/hooks';

mock.module('@tornotron/echno-core/task/hooks', () => ({
  ...realTaskHooks,
  useTasksByProject: () => ({
    data: PROJECT_TASKS,
    isLoading: false,
    isError: false,
  }),
  usePrefetchTask: () => noop,
}));

import * as realProjectHooks from '@tornotron/echno-core/project/hooks';

mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProject: () => ({
    data: { id: 7, projectName: 'Marina Towers' },
    isLoading: false,
    isError: false,
  }),
  useAddEmployeeToProject: () => ({ mutate: noop, isPending: false }),
  useRemoveEmployeeFromProject: () => ({ mutate: noop, isPending: false }),
}));

const tasksPageModule = await import(
  '@/app/users/dashboard/projects/all-projects/[id]/tasks/page'
);
const ProjectTasksPage = tasksPageModule.default;

const rosterModule = await import(
  '@/features/projects/components/team-members-section'
);
const { TeamMembersSection } = rosterModule;

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

afterEach(cleanup);

describe('the roster names a destination, not a profile', () => {
  test("a team member links to this project's tasks, narrowed to them", () => {
    const { container } = render(
      createElement(TeamMembersSection, {
        projectId: 7,
        members: [RAVI, PRIYA],
        isDialogOpen: false,
        onDialogOpenChange: noop,
      }),
      { wrapper: Wrapper }
    );

    const hrefs = [...container.querySelectorAll('a')].map((a) =>
      a.getAttribute('href')
    );

    // The project half is the route; the assignee half is the query.
    expect(hrefs).toContain(
      '/users/dashboard/projects/all-projects/7/tasks?employeeId=8&role=assignee'
    );
    expect(hrefs).toContain(
      '/users/dashboard/projects/all-projects/7/tasks?employeeId=9&role=assignee'
    );

    // Not their profile, and not the cross-project register, which are the two
    // candidates this decided against.
    const stray = hrefs.filter(
      (href) =>
        href?.includes('/workforce/employees') ||
        href?.includes('/projects/all-tasks')
    );
    expect(stray).toEqual([]);
  }, RENDER_TIMEOUT_MS);
});

/** What the project's task list shows for a given URL. */
function showFor(query: string) {
  search = query;
  const { container } = render(createElement(ProjectTasksPage), {
    wrapper: Wrapper,
  });
  const text = container.textContent ?? '';
  return {
    hasChip:
      container.querySelector('button[aria-label="Clear filter"]') != null,
    text,
    rows: PROJECT_TASKS.filter((task) => text.includes(task.title)).length,
  };
}

describe('and the list that link opens really is narrowed', () => {
  test('the assignee filter narrows the project to one person, under a chip', () => {
    const shown = showFor('employeeId=8&role=assignee');

    expect(shown.rows).toBe(1);
    expect(shown.text).toContain('Pour the raft slab');
    expect(shown.hasChip).toBe(true);
    expect(shown.text).toContain('Assigned to:');
    expect(shown.text).toContain('Ravi Kumar');
  }, RENDER_TIMEOUT_MS);

  test('with no filter it is the whole project and no chip', () => {
    const shown = showFor('');

    expect(shown.rows).toBe(2);
    expect(shown.hasChip).toBe(false);
  }, RENDER_TIMEOUT_MS);

  /*
    The same rule the sixteen list pages now follow. This page declares only
    `assignee`, so a link carrying any other module's slug narrows nothing and
    says nothing, rather than naming a person over the whole project.
  */
  test('a role this page does not declare narrows nothing and says nothing', () => {
    const shown = showFor('employeeId=8&role=submitter');

    expect(shown.rows).toBe(2);
    expect(shown.hasChip).toBe(false);
  }, RENDER_TIMEOUT_MS);
});
