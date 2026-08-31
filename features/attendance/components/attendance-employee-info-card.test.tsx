/**
 * The employee named on an attendance record opens that person's attendance,
 * rather than sitting there as text beside a bare id.
 *
 * Two things about the destination are deliberate and neither is obvious from
 * the field name.
 *
 * **It goes to the team history, not to the attendance list.** The list is
 * fetched with `AttendanceListParams`, whose `projectId` and `date` are both
 * required, so it is inherently a one-project one-day view and cannot answer
 * "every day this person worked". The team history fetches by employee over a
 * date range, which is the question the link asks.
 *
 * **The href therefore carries `?tab=team` as well as the filter.** The history
 * is one route holding two tabs, and without the tab the reader lands on their
 * own timesheet, which looks enough like an answer to be believed.
 *
 * `Attendance.employeeId` is an employee id, documented "Employee this record
 * belongs to", so this is `employeeFilterHref` and not `userFilterHref`.
 */
import { describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { render } from '@testing-library/react';
import type { Attendance } from '@tornotron/echno-core/attendance/types';

mock.module('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    createElement('a', { href }, children),
}));

const { AttendanceEmployeeInfoCard } =
  await import('./attendance-employee-info-card');

/**
 * The card reads the employee, the project and the status. The rest of the
 * record is irrelevant here and the cast says so, rather than inventing a shift
 * and a clock-event chain that no assertion would touch.
 */
const attendance = {
  id: 41,
  employeeId: 12,
  employeeName: 'Priya Nair',
  projectId: 3,
  projectName: 'Riverside Tower',
  status: 'present',
  approvalStatus: 'approved',
} as unknown as Attendance;

function hrefs(container: HTMLElement): string[] {
  return [...container.querySelectorAll('a')].map(
    (a) => a.getAttribute('href') ?? ''
  );
}

describe('the employee on an attendance record', () => {
  test('links to that employee on the team history tab', () => {
    const { container } = render(
      createElement(AttendanceEmployeeInfoCard, { attendance })
    );

    expect(hrefs(container)).toContain(
      '/users/dashboard/attendance/history?tab=team&employeeId=12&role=employee'
    );
  });

  test('claims an employee id, never a user id', () => {
    // The two would be indistinguishable on a fresh database, where the user
    // and employee sequences run in lockstep. They stop being so as soon as one
    // side has more rows than the other, and by then nothing fails, it just
    // names the wrong person.
    const { container } = render(
      createElement(AttendanceEmployeeInfoCard, { attendance })
    );

    const filterLinks = hrefs(container).filter((h) => h.includes('role='));
    expect(filterLinks).toHaveLength(1);
    expect(filterLinks[0]).toContain('employeeId=12');
    expect(filterLinks[0]).not.toContain('userId=');
  });

  test('still shows the name it links', () => {
    // Scoped to this render's own container rather than the document, because
    // the suite shares one body across files and an unscoped text query picks
    // up whatever an earlier file left mounted.
    const { container } = render(
      createElement(AttendanceEmployeeInfoCard, { attendance })
    );

    const link = container.querySelector('a[href*="role=employee"]');
    expect(link?.textContent).toBe('Priya Nair');
  });
});
