/**
 * Opening the Schedule tab of a project with tasks used to fail with "Too many
 * re-renders": the chart derived a new groups array on every render and reset
 * its state whenever the array changed identity, which rendered it again. The
 * first render passes because the state starts equal to that array, so the
 * fault only shows from the second render on.
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { TaskStatus, type Task } from '@tornotron/echno-core/task/types';
import { GanttChart } from './gantt-chart';

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

afterEach(cleanup);

describe('GanttChart', () => {
  test('survives rendering again with the same tasks', () => {
    const tasks = [task(1), task(2)];
    const { rerender, getAllByText } = render(<GanttChart tasks={tasks} />);
    rerender(<GanttChart tasks={tasks} />);
    expect(getAllByText('Task 1').length).toBeGreaterThan(0);
  });

  test('survives rendering again when no task has dates', () => {
    const tasks = [task(1, { startDate: undefined, endDate: undefined })];
    const { rerender, getByText } = render(<GanttChart tasks={tasks} />);
    rerender(<GanttChart tasks={tasks} />);
    expect(getByText('0 WBS groups')).toBeInTheDocument();
  });
});
