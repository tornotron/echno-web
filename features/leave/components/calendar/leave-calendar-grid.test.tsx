/**
 * The calendar payload has no status, because entries exist only for approved
 * leave. Its day views still drew a status badge from the missing field, and
 * the badge read "undefined".
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import {
  HalfDayType,
  type LeaveCalendarEntry,
} from '@tornotron/echno-core/leave/types';
import { LeaveCalendarGrid } from './leave-calendar-grid';

const day = new Date(2026, 2, 12);
const entry: LeaveCalendarEntry = {
  id: 1,
  leaveRequestId: 1,
  employeeId: 1,
  employeeName: 'Asha Menon',
  leaveDate: day,
  halfDayType: HalfDayType.FULL_DAY,
  leaveTypeName: 'Casual Leave',
};

afterEach(cleanup);

describe('LeaveCalendarGrid', () => {
  test('the day view shows no status text', () => {
    const { getByText, container } = render(
      <LeaveCalendarGrid
        entries={[entry]}
        currentDate={day}
        onDateChange={() => {}}
        view="day"
      />
    );
    expect(getByText('Asha Menon')).toBeInTheDocument();
    expect(container.textContent).not.toContain('undefined');
  });

  test('the dialog for a clicked date shows no status text', () => {
    const { getByText } = render(
      <LeaveCalendarGrid
        entries={[entry]}
        currentDate={day}
        onDateChange={() => {}}
        view="month"
      />
    );
    fireEvent.click(getByText('Asha'));
    const dialog = within(document.body).getByRole('dialog');
    expect(within(dialog).getByText('Casual Leave')).toBeInTheDocument();
    expect(dialog.textContent).not.toContain('undefined');
  });
});
