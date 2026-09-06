/**
 * The away-from-site queue, and the two ways it could quietly lie.
 *
 * **The figure beside the title is the server's count, not the page length.**
 * The listing is capped, so once the backlog passes the cap its length stops
 * being the answer and a derived figure sticks at the cap while the real
 * number grows. Every count fixture here therefore differs from the number of
 * rows rendered, so no assertion can pass without the count actually being
 * read.
 *
 * **The per-row gate still runs.** The endpoint has already excluded rows this
 * viewer may not decide, so the gate should never refuse one; it is what keeps
 * the buttons and the server's answer under a single rule rather than two that
 * happen to agree today.
 */
import { describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import type {
  Attendance,
  ClockEvent,
} from '@tornotron/echno-core/attendance/types';

mock.module('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    createElement('a', { href }, children),
}));

const { AttendanceApprovalQueue } = await import('./attendance-approval-queue');

function heldDay(overrides: Partial<Attendance> = {}): Attendance {
  return {
    id: 41,
    employeeId: 12,
    employeeName: 'Priya Nair',
    projectId: 3,
    projectName: 'Riverside Tower',
    date: new Date('2026-08-14T00:00:00Z'),
    approvalStatus: 'pending',
    requiresGeofenceApproval: true,
    geofenceApproverId: 55,
    morningClockIn: {
      id: 1,
      eventType: 'morning_clock_in',
      isWithinGeofence: false,
      geofenceExceptionReason: 'Material pickup at the depot',
    } as unknown as ClockEvent,
    ...overrides,
  } as unknown as Attendance;
}

/** The named approver: no management role, decides by being on the record. */
const namedApprover = { employeeId: 55, managesRecords: false };

function renderQueue(
  props: Partial<Parameters<typeof AttendanceApprovalQueue>[0]> = {}
) {
  const onDecide = mock(() => {});
  const { container } = render(
    createElement(AttendanceApprovalQueue, {
      records: [heldDay()],
      waitingCount: 1,
      viewer: namedApprover,
      onDecide,
      ...props,
    })
  );
  return { container, onDecide };
}

function buttonLabelled(container: HTMLElement, label: string) {
  return [...container.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(label)
  );
}

describe('the figure the approver reads off the screen', () => {
  test('is the server count, over a page that holds fewer rows', () => {
    // Two rows, a backlog of 137. A figure taken from the page would read 2.
    const { container } = renderQueue({
      records: [heldDay(), heldDay({ id: 42, employeeName: 'Ravi Kumar' })],
      waitingCount: 137,
    });

    expect(container.textContent).toContain('137 waiting');
    expect(container.textContent).not.toContain('2 waiting');
  });

  test('a page shorter than the backlog says it is showing part of it', () => {
    // Without this the approver clears what they can see and believes the
    // queue is empty, because the table's own footer counts the page.
    const { container } = renderQueue({
      records: [heldDay(), heldDay({ id: 42, employeeName: 'Ravi Kumar' })],
      waitingCount: 137,
    });

    expect(container.textContent).toContain('Showing the 2 most recent');
  });

  test('a page holding the whole backlog says nothing about a cap', () => {
    const { container } = renderQueue({
      records: [heldDay(), heldDay({ id: 42, employeeName: 'Ravi Kumar' })],
      waitingCount: 2,
    });

    expect(container.textContent).toContain('2 waiting');
    expect(container.textContent).not.toContain('most recent');
  });

  test('an unfinished load is not reported as a capped page', () => {
    // isLoading with no rows and a cached count of 137 would otherwise print
    // "Showing the 0 most recent", which is a claim about a page that has not
    // arrived.
    const { container } = renderQueue({
      records: [],
      waitingCount: 137,
      isLoading: true,
    });

    expect(container.textContent).not.toContain('most recent');
  });
});

describe('what a row tells the approver before they decide', () => {
  test('carries the reason the employee gave', () => {
    // An Approve button beside a bare date asks somebody to vouch for
    // something the screen has not told them.
    const { container } = renderQueue();

    expect(container.textContent).toContain('Material pickup at the depot');
  });

  test('links the day to its own record', () => {
    const { container } = renderQueue();

    const hrefs = [...container.querySelectorAll('a')].map((a) =>
      a.getAttribute('href')
    );
    expect(hrefs).toContain('/users/dashboard/attendance/41');
  });
});

describe('the per-row gate', () => {
  test('offers the controls to the approver the record names', () => {
    const { container } = renderQueue();

    expect(buttonLabelled(container, 'Approve')).toBeDefined();
    expect(buttonLabelled(container, 'Reject')).toBeDefined();
  });

  test('withholds them on the viewer’s own held day', () => {
    // The endpoint never returns this row, so it is the gate alone that is
    // under test. A record manager is refused their own away-from-site day
    // whatever roles they hold, and the server answers such a call with a 403.
    const { container } = renderQueue({
      records: [heldDay({ employeeId: 55 })],
      viewer: { employeeId: 55, managesRecords: true },
    });

    expect(buttonLabelled(container, 'Approve')).toBeUndefined();
    expect(container.textContent).toContain('Not yours to decide');
  });

  test('withholds them while the viewer is still unknown', () => {
    const { container } = renderQueue({
      viewer: { employeeId: undefined, managesRecords: true },
    });

    expect(buttonLabelled(container, 'Approve')).toBeUndefined();
  });
});

describe('the decision that leaves', () => {
  test('Approve sends that row and APPROVED', () => {
    const { container, onDecide } = renderQueue({
      records: [heldDay({ id: 88 })],
    });

    fireEvent.click(buttonLabelled(container, 'Approve')!);

    expect(onDecide).toHaveBeenCalledTimes(1);
    const [record, decision] = onDecide.mock.calls[0] as unknown as [
      Attendance,
      string,
    ];
    expect(record.id).toBe(88);
    expect(decision).toBe('APPROVED');
  });

  test('Reject sends REJECTED', () => {
    const { container, onDecide } = renderQueue({
      records: [heldDay({ id: 88 })],
    });

    fireEvent.click(buttonLabelled(container, 'Reject')!);

    const [, decision] = onDecide.mock.calls[0] as unknown as [
      Attendance,
      string,
    ];
    expect(decision).toBe('REJECTED');
  });

  test('the controls go quiet while a decision is in flight', () => {
    const { container } = renderQueue({ isDeciding: true });

    expect(buttonLabelled(container, 'Approve')?.disabled).toBe(true);
    expect(buttonLabelled(container, 'Reject')?.disabled).toBe(true);
  });
});

describe('an empty queue', () => {
  test('says nothing is waiting, and says whose days are missing from it', () => {
    // The queue never contains the viewer's own held day. Left unsaid, a
    // supervisor who marked away from site reads an empty queue as their own
    // record having been decided.
    const { container } = renderQueue({ records: [], waitingCount: 0 });

    expect(container.textContent).toContain('Nothing waiting on you');
    expect(container.textContent).toContain('Your own days are not listed');
  });
});
