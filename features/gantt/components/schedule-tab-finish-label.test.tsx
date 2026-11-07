/**
 * The tab called the tasks ending last "Critical path". Tasks have no links
 * between them, so no critical path is calculated, and the screen now says what
 * it marks.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import type { Project } from '@tornotron/echno-core/project/types';
import { TaskStatus, type Task } from '@tornotron/echno-core/task/types';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import * as realTaskHooks from '@tornotron/echno-core/task/hooks';

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useEmployeeRoles: () => ({
    orgRoles: [OrgRole.PROJECT_MANAGER],
    isLoading: false,
    error: null,
    employee: undefined,
  }),
}));
mock.module('@tornotron/echno-core/task/hooks', () => ({
  ...realTaskHooks,
  useUpdateTask: () => ({ mutate: () => {}, isPending: false }),
}));

const { ScheduleTab } = await import('./schedule-tab');

function task(id: number, endDate: string): Task {
  return {
    id,
    projectId: 1,
    title: `Task ${id}`,
    status: TaskStatus.upcoming,
    progress: 0,
    startDate: new Date('2026-03-01T00:00:00Z'),
    endDate: new Date(endDate),
  } as Task;
}

function project(tasks: Task[]): Project {
  return { id: 1, name: 'Project', tasks } as unknown as Project;
}

afterEach(cleanup);

describe('Schedule tab finish-date wording', () => {
  test('never claims a critical path', () => {
    const { container } = render(
      <ScheduleTab
        project={project([
          task(1, '2026-03-30T00:00:00Z'),
          task(2, '2026-03-25T00:00:00Z'),
          task(3, '2026-03-05T00:00:00Z'),
        ])}
      />
    );
    expect(container.textContent).not.toMatch(/critical/i);
  });

  test('names what it marks, counting only the tasks ending last', () => {
    const { getByText, getAllByText } = render(
      <ScheduleTab
        project={project([
          task(1, '2026-03-30T00:00:00Z'),
          task(2, '2026-03-05T00:00:00Z'),
        ])}
      />
    );
    expect(getByText(/1 task sets the finish date/)).toBeInTheDocument();
    expect(getByText('Set the Finish Date')).toBeInTheDocument();
    expect(getAllByText('Sets the finish date').length).toBeGreaterThan(0);
  });

  test('uses the plural when several tasks end on the latest date', () => {
    const { getByText } = render(
      <ScheduleTab
        project={project([
          task(1, '2026-03-30T00:00:00Z'),
          task(2, '2026-03-30T00:00:00Z'),
        ])}
      />
    );
    expect(getByText(/2 tasks set the finish date/)).toBeInTheDocument();
  });
});
