/**
 * The regularization calendar: which days invite an action, where each action
 * goes, and what the by-date request carries.
 *
 * The mocked hook modules are spread over their real exports, so a later test
 * file importing another hook from the same module still finds it.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { RegularizationCalendarDay } from '@tornotron/echno-core/attendance/types';

const push = mock((_url: string) => {});
const mutate = mock((_req: unknown, _opts?: unknown) => {});

let calendarDays: RegularizationCalendarDay[] = [];

const actualNavigation = await import('next/navigation');
mock.module('next/navigation', () => ({
  ...actualNavigation,
  useRouter: () => ({ push }),
}));

const actualRegHooks =
  await import('@tornotron/echno-core/attendance-regularization/hooks');
mock.module('@tornotron/echno-core/attendance-regularization/hooks', () => ({
  ...actualRegHooks,
  useRegularizationCalendar: () => ({ data: calendarDays, isLoading: false }),
  useRequestRegularizationByDate: () => ({ mutate, isPending: false }),
}));

const actualProjectHooks = await import('@tornotron/echno-core/project/hooks');
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...actualProjectHooks,
  useProjects: () => ({
    data: [
      { id: 12, projectName: 'Tower B' },
      { id: 14, projectName: 'Riverside' },
    ],
  }),
}));

const { RegularizationCalendar, RegularizeByDateDialog } =
  await import('./regularization-calendar');

// Dialogs render into a portal on document.body, so each test starts clean.
afterEach(() => cleanup());

function day(
  dateKey: string,
  state: RegularizationCalendarDay['state'],
  extra: Partial<RegularizationCalendarDay> = {}
): RegularizationCalendarDay {
  const [y, m, d] = dateKey.split('-').map(Number);
  return {
    date: new Date(y, m - 1, d),
    dateKey,
    state,
    actionable:
      state === 'MISSING' || state === 'INCOMPLETE' || state === 'NON_WORKING',
    ...extra,
  };
}

function cell(container: HTMLElement, dateKey: string) {
  const d = Number(dateKey.slice(-2));
  return [...container.querySelectorAll('button[data-state]')].find(
    (b) => b.textContent?.trim() === String(d)
  ) as HTMLButtonElement | undefined;
}

describe('the calendar grid', () => {
  test('lets the employee pick missing and incomplete days, and nothing complete, pending or on leave', () => {
    calendarDays = [
      day('2026-09-01', 'COMPLETE'),
      day('2026-09-02', 'MISSING'),
      day('2026-09-03', 'INCOMPLETE', { attendanceId: 30, projectId: 12 }),
      day('2026-09-04', 'PENDING'),
      day('2026-09-05', 'LEAVE'),
    ];
    const { container } = render(
      createElement(RegularizationCalendar, { employeeId: 18 })
    );

    expect(cell(container, '2026-09-01')?.disabled).toBe(true);
    expect(cell(container, '2026-09-02')?.disabled).toBe(false);
    expect(cell(container, '2026-09-03')?.disabled).toBe(false);
    expect(cell(container, '2026-09-04')?.disabled).toBe(true);
    expect(cell(container, '2026-09-05')?.disabled).toBe(true);
    expect(container.textContent).toContain('2 days need action');
  });

  test('sends Apply for Leave to the leave form with the day filled in', () => {
    push.mockClear();
    calendarDays = [day('2026-09-02', 'MISSING')];
    const { container, getByText } = render(
      createElement(RegularizationCalendar, { employeeId: 18 })
    );

    fireEvent.click(cell(container, '2026-09-02')!);
    fireEvent.click(getByText('Apply for Leave'));

    expect(push).toHaveBeenCalledWith(
      '/users/dashboard/attendance/my-leaves/apply?date=2026-09-02'
    );
  });
});

describe('the regularization form', () => {
  test('sends the employee, project, date, times and reason', () => {
    mutate.mockClear();
    const target = day('2026-09-03', 'INCOMPLETE', {
      attendanceId: 30,
      projectId: 12,
      projectName: 'Tower B',
    });
    const { getByLabelText, getByText } = render(
      createElement(RegularizeByDateDialog, {
        open: true,
        day: target,
        employeeId: 18,
        onClose: () => {},
      })
    );

    fireEvent.change(getByLabelText('Clock-in'), {
      target: { value: '09:05' },
    });
    fireEvent.change(getByLabelText('Clock-out'), {
      target: { value: '18:10' },
    });
    fireEvent.change(getByLabelText('Reason'), {
      target: { value: 'Phone battery died' },
    });
    fireEvent.click(getByText('Submit request'));

    expect(mutate).toHaveBeenCalledTimes(1);
    const req = mutate.mock.calls[0][0] as Record<string, unknown>;
    expect(req.employeeId).toBe(18);
    expect(req.projectId).toBe(12);
    expect(req.clockInTime).toBe('09:05');
    expect(req.clockOutTime).toBe('18:10');
    expect(req.reason).toBe('Phone battery died');
    expect((req.attendanceDate as Date).getDate()).toBe(3);
  });

  test('does not send a clock-out that is not after the clock-in', () => {
    mutate.mockClear();
    const { getByLabelText, getByText } = render(
      createElement(RegularizeByDateDialog, {
        open: true,
        day: day('2026-09-03', 'INCOMPLETE', { projectId: 12 }),
        employeeId: 18,
        onClose: () => {},
      })
    );

    fireEvent.change(getByLabelText('Clock-in'), {
      target: { value: '18:00' },
    });
    fireEvent.change(getByLabelText('Clock-out'), {
      target: { value: '09:00' },
    });
    fireEvent.change(getByLabelText('Reason'), { target: { value: 'x' } });
    fireEvent.click(getByText('Submit request'));

    expect(mutate).not.toHaveBeenCalled();
  });
});
