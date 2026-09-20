import { describe, expect, test } from 'bun:test';
import {
  buildEventTimestamp,
  canClockIn,
  canClockOut,
  describeLocationHold,
  describeSelectionSplit,
  isSelectableState,
  isSupervisorLocationRequired,
  pruneSelection,
  resolveTeamMemberState,
  summarizeBulkOutcome,
  teamMemberStateLabel,
  type TeamAttendanceRecord,
} from './team-marking';

const clockEvent = { id: 1, timestamp: new Date('2026-08-27T09:00:00') };

function record(over: Partial<TeamAttendanceRecord>): TeamAttendanceRecord {
  return { status: 'pendingRegularization', ...over } as TeamAttendanceRecord;
}

describe('resolveTeamMemberState', () => {
  test('no record at all is not marked', () => {
    expect(resolveTeamMemberState()).toBe('notMarked');
  });

  test('a record with no clock events is not marked', () => {
    expect(resolveTeamMemberState(record({}))).toBe('notMarked');
  });

  test('clock-in without clock-out is clocked in', () => {
    expect(
      resolveTeamMemberState(record({ morningClockIn: clockEvent as never }))
    ).toBe('clockedIn');
  });

  test('both events present is clocked out', () => {
    expect(
      resolveTeamMemberState(
        record({
          morningClockIn: clockEvent as never,
          eveningClockOut: clockEvent as never,
        })
      )
    ).toBe('clockedOut');
  });

  test('leave status wins over stray clock events', () => {
    expect(
      resolveTeamMemberState(
        record({ status: 'leave', morningClockIn: clockEvent as never })
      )
    ).toBe('onLeave');
  });

  test('a linked leave id also reads as on leave', () => {
    expect(resolveTeamMemberState(record({ leaveId: 12 }))).toBe('onLeave');
  });
});

describe('selection and transition rules', () => {
  test('only unfinished days are selectable', () => {
    expect(isSelectableState('notMarked')).toBe(true);
    expect(isSelectableState('clockedIn')).toBe(true);
    expect(isSelectableState('clockedOut')).toBe(false);
    expect(isSelectableState('onLeave')).toBe(false);
  });

  test('clock-in is only offered before the first event', () => {
    expect(canClockIn('notMarked')).toBe(true);
    expect(canClockIn('clockedIn')).toBe(false);
    expect(canClockIn('clockedOut')).toBe(false);
    expect(canClockIn('onLeave')).toBe(false);
  });

  test('clock-out requires an open clock-in', () => {
    expect(canClockOut('clockedIn')).toBe(true);
    expect(canClockOut('notMarked')).toBe(false);
    expect(canClockOut('clockedOut')).toBe(false);
    expect(canClockOut('onLeave')).toBe(false);
  });

  test('labels match the status column wording', () => {
    expect(teamMemberStateLabel('notMarked')).toBe('Not Marked');
    expect(teamMemberStateLabel('clockedIn')).toBe('Clocked In');
    expect(teamMemberStateLabel('clockedOut')).toBe('Clocked Out');
    expect(teamMemberStateLabel('onLeave')).toBe('On Leave');
  });
});

describe('pruneSelection', () => {
  test('drops members who became terminal since they were ticked', () => {
    const states: Record<number, ReturnType<typeof resolveTeamMemberState>> = {
      1: 'notMarked',
      2: 'clockedIn',
      3: 'clockedOut',
      4: 'onLeave',
    };
    expect(pruneSelection([1, 2, 3, 4], (id) => states[id])).toEqual([1, 2]);
  });
});

describe('isSupervisorLocationRequired', () => {
  test('no settings yet means nothing is demanded', () => {
    expect(isSupervisorLocationRequired()).toBe(false);
  });

  test('follows the geolocation flag, and only that flag', () => {
    // The selfie flag used to block the whole screen. It no longer applies to
    // an entry recorded for somebody else, so it must not hold anything here.
    expect(isSupervisorLocationRequired({ geolocationRequired: true })).toBe(
      true
    );
    expect(isSupervisorLocationRequired({ geolocationRequired: false })).toBe(
      false
    );
  });
});

describe('describeLocationHold', () => {
  test('nothing holds the buttons when the site does not need a position', () => {
    expect(describeLocationHold(false, 'error')).toBeNull();
    expect(describeLocationHold(false, 'idle')).toBeNull();
  });

  test('a detected position releases the hold', () => {
    expect(describeLocationHold(true, 'detected')).toBeNull();
  });

  test('a missing position is explained while it is read and when it fails', () => {
    expect(describeLocationHold(true, 'detecting')).toContain(
      'Reading your location'
    );
    expect(describeLocationHold(true, 'error')).toContain(
      'Allow location access'
    );
  });
});

describe('describeSelectionSplit', () => {
  test('says nothing with no ticks', () => {
    expect(describeSelectionSplit(0, 0, 0)).toBeNull();
  });

  test('says nothing when every tick counts on clock-in', () => {
    expect(describeSelectionSplit(2, 2, 0)).toBeNull();
  });

  test('explains a tick that only clock-out will count', () => {
    // The ticket's symptom: EMP-0004 ticked, "Mark Clock-In (0 selected)".
    expect(describeSelectionSplit(1, 0, 1)).toBe(
      '1 selected employee is already clocked in, so only Clock-Out applies.'
    );
  });

  test('explains ticks the day has already closed', () => {
    expect(describeSelectionSplit(3, 1, 0)).toBe(
      '2 selected employees have already completed the day and will be skipped.'
    );
  });
});

describe('summarizeBulkOutcome', () => {
  test('an all-clear run reports the real count', () => {
    const outcome = summarizeBulkOutcome('Clock-in', [
      { employeeId: 1, name: 'Nikhil Thomas', ok: true },
      { employeeId: 2, name: 'Scarlett James', ok: true },
    ]);
    expect(outcome.level).toBe('success');
    expect(outcome.title).toBe('Clock-in marked for 2 employees');
    expect(outcome.description).toBeUndefined();
  });

  test('a single success is not pluralised', () => {
    const outcome = summarizeBulkOutcome('Clock-in', [
      { employeeId: 1, name: 'Nikhil Thomas', ok: true },
    ]);
    expect(outcome.title).toBe('Clock-in marked for 1 employee');
  });

  // The reported defect: every request failed, yet the screen showed a green
  // "Clock-in marked for 0 employee(s)".
  test('a run where everything failed is an error, not a success', () => {
    const outcome = summarizeBulkOutcome('Clock-in', [
      {
        employeeId: 1,
        name: 'Nikhil Thomas',
        ok: false,
        reason: 'A photo is required to check in for this project',
      },
      {
        employeeId: 2,
        name: 'Scarlett James',
        ok: false,
        reason: 'A photo is required to check in for this project',
      },
    ]);
    expect(outcome.level).toBe('error');
    expect(outcome.title).toBe('Clock-in failed for all 2 selected employees');
    expect(outcome.description).toContain(
      'Nikhil Thomas: A photo is required to check in for this project'
    );
    expect(outcome.description).toContain('Scarlett James');
  });

  test('a mixed run names the members that failed', () => {
    const outcome = summarizeBulkOutcome('Clock-out', [
      { employeeId: 1, name: 'Nikhil Thomas', ok: true },
      {
        employeeId: 2,
        name: 'Scarlett James',
        ok: false,
        reason: 'Attendance record not found',
      },
    ]);
    expect(outcome.level).toBe('partial');
    expect(outcome.title).toBe('Clock-out marked for 1 of 2 employees');
    expect(outcome.description).toBe(
      'Failed for 1: Scarlett James: Attendance record not found'
    );
  });

  test('a failure with no reason still reads sensibly', () => {
    const outcome = summarizeBulkOutcome('Clock-in', [
      { employeeId: 1, name: 'Nikhil Thomas', ok: false },
    ]);
    expect(outcome.description).toBe('Nikhil Thomas: request failed');
  });
});

describe('buildEventTimestamp', () => {
  test('combines the date and time in the local zone', () => {
    const built = buildEventTimestamp('2026-08-27', '09:00');
    expect(built).not.toBeNull();
    expect(built!.getFullYear()).toBe(2026);
    expect(built!.getMonth()).toBe(7);
    expect(built!.getDate()).toBe(27);
    expect(built!.getHours()).toBe(9);
    expect(built!.getMinutes()).toBe(0);
  });

  test('does not drift the calendar day for an early morning time', () => {
    const built = buildEventTimestamp('2026-08-27', '00:30');
    expect(built!.getDate()).toBe(27);
    expect(built!.getHours()).toBe(0);
  });

  test('rejects malformed input rather than producing an invalid date', () => {
    expect(buildEventTimestamp('', '09:00')).toBeNull();
    expect(buildEventTimestamp('2026-08-27', '')).toBeNull();
    expect(buildEventTimestamp('27/08/2026', '09:00')).toBeNull();
  });
});
