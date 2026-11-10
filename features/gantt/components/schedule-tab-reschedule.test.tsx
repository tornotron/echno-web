/**
 * The Schedule tab offered "drag to reschedule" to everyone and saved nothing.
 * A drop now saves the dates for the roles the backend admits, and a refused
 * change puts the bar back.
 */
import { afterAll, afterEach, describe, expect, mock, test } from 'bun:test';
import * as realAccessHooks from '@tornotron/echno-core/access/hooks';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import type { Project } from '@tornotron/echno-core/project/types';
import { TaskStatus, type Task } from '@tornotron/echno-core/task/types';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import * as realTaskHooks from '@tornotron/echno-core/task/hooks';

let orgRoles: string[] = [];
type MutateOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};
const mutateCalls: { variables: unknown; options: MutateOptions }[] = [];
const toasts: { kind: string; title: string; description?: string }[] = [];

const realAccess = { ...realAccessHooks };

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useEmployeeRoles: () => ({
    orgRoles,
    isLoading: false,
    error: null,
    employee: undefined,
  }),
}));
mock.module('@tornotron/echno-core/task/hooks', () => ({
  ...realTaskHooks,
  useUpdateTask: () => ({
    mutate: (variables: unknown, options: MutateOptions) =>
      mutateCalls.push({ variables, options }),
    isPending: false,
  }),
}));
mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    success: (title: string, options?: { description?: string }) =>
      toasts.push({ kind: 'success', title, ...options }),
    error: (title: string, options?: { description?: string }) =>
      toasts.push({ kind: 'error', title, ...options }),
  },
}));

// useCan asks the access matrix too; these gates are on org roles, so a
// caller with no matrix grants is enough, and no QueryClient is needed.
mock.module('@tornotron/echno-core/access/hooks', () => ({
  ...realAccess,
  useCurrentUserAccess: () => ({
    access: undefined,
    can: () => false,
    isLoading: false,
    error: null,
  }),
}));

const { ScheduleTab } = await import('./schedule-tab');
const { useRescheduleTask } = await import('../hooks/use-reschedule-task');

const start = new Date('2026-03-01T00:00:00Z');
const end = new Date('2026-03-10T00:00:00Z');
const task = {
  id: 7,
  projectId: 1,
  title: 'Pour slab',
  status: TaskStatus.upcoming,
  progress: 0,
  startDate: start,
  endDate: end,
} as Task;
const project = { id: 1, name: 'Project', tasks: [task] } as unknown as Project;

afterEach(() => {
  cleanup();
  mutateCalls.length = 0;
  toasts.length = 0;
  orgRoles = [];
});

function barDisabled(container: HTMLElement) {
  return container
    .querySelector('[aria-roledescription="draggable"]')
    ?.getAttribute('aria-disabled');
}

describe('who can drag a bar', () => {
  test('a project manager can, and is told so', () => {
    orgRoles = [OrgRole.PROJECT_MANAGER];
    const { container, getByText } = render(<ScheduleTab project={project} />);
    expect(barDisabled(container)).toBe('false');
    expect(getByText(/drag to reschedule/)).toBeInTheDocument();
  });

  test('someone who may not edit tasks cannot, and is not told to', () => {
    orgRoles = [OrgRole.LABORER];
    const { container, queryByText } = render(
      <ScheduleTab project={project} />
    );
    expect(barDisabled(container)).toBe('true');
    expect(queryByText(/drag to reschedule/)).toBeNull();
  });
});

describe('dropping a bar', () => {
  const movedStart = new Date('2026-03-05T00:00:00Z');
  const movedEnd = new Date('2026-03-14T00:00:00Z');

  test('saves the new dates and confirms', () => {
    const { result } = renderHook(() => useRescheduleTask());
    result.current.rescheduleTask(task, movedStart, movedEnd);

    expect(mutateCalls).toHaveLength(1);
    expect(mutateCalls[0]!.variables).toEqual({
      id: 7,
      data: { startDate: movedStart, endDate: movedEnd },
    });

    act(() => mutateCalls[0]!.options.onSuccess?.());
    expect(toasts[0]?.kind).toBe('success');
    expect(toasts[0]?.description).toContain('Pour slab');
    expect(result.current.barResetKey).toBe(0);
  });

  test('puts the bar back when the change is refused', () => {
    const { result } = renderHook(() => useRescheduleTask());
    result.current.rescheduleTask(task, movedStart, movedEnd);

    act(() => mutateCalls[0]!.options.onError?.(new Error('refused')));
    expect(toasts[0]?.kind).toBe('error');
    expect(result.current.barResetKey).toBe(1);
  });

  test('does not save a drop that leaves the dates as they were', () => {
    const { result } = renderHook(() => useRescheduleTask());
    result.current.rescheduleTask(task, new Date(start), new Date(end));
    expect(mutateCalls).toHaveLength(0);
  });

  test('refuses an end date before the start date without calling the API', () => {
    const { result } = renderHook(() => useRescheduleTask());
    act(() => result.current.rescheduleTask(task, movedEnd, movedStart));
    expect(mutateCalls).toHaveLength(0);
    expect(toasts[0]?.kind).toBe('error');
    expect(result.current.barResetKey).toBe(1);
  });
});

afterAll(() => {
  mock.module('@tornotron/echno-core/access/hooks', () => realAccess);
});
