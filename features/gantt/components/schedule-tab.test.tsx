/**
 * Opening the Schedule tab of a project with tasks used to fail with "Too many
 * re-renders": the chart derived a new groups array on every render and reset
 * its state whenever the array changed identity, which re-rendered it again.
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import type { Project } from '@tornotron/echno-core/project/types';
import { TaskStatus, type Task } from '@tornotron/echno-core/task/types';
import { ScheduleTab } from './schedule-tab';

function task(id: number, overrides: Partial<Task> = {}): Task {
  return {
    id,
    projectId: 1,
    title: `Task ${id}`,
    status: TaskStatus.upcoming,
    progress: 0,
    startDate: new Date('2026-03-01T00:00:00Z'),
    endDate: new Date('2026-03-10T00:00:00Z'),
    ...overrides,
  } as Task;
}

function project(tasks: Task[]): Project {
  return { id: 1, name: 'Project', tasks } as unknown as Project;
}

afterEach(cleanup);

describe('ScheduleTab', () => {
  test('renders a project whose tasks have dates', () => {
    const { getAllByText } = render(
      <ScheduleTab project={project([task(1), task(2)])} />
    );
    expect(getAllByText('Task 1').length).toBeGreaterThan(0);
  });

  test('survives its parent rendering again with the same tasks', () => {
    const same = project([task(1), task(2)]);
    const { rerender, getAllByText } = render(<ScheduleTab project={same} />);
    rerender(<ScheduleTab project={same} />);
    expect(getAllByText('Task 1').length).toBeGreaterThan(0);
  });

  test('renders a project whose tasks have no dates', () => {
    const { getByText } = render(
      <ScheduleTab
        project={project([
          task(1, { startDate: undefined, endDate: undefined }),
        ])}
      />
    );
    expect(getByText('Project Schedule')).toBeInTheDocument();
  });
});
