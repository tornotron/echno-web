/**
 * What counts as an away-from-site punch, and how the queue says so in a row.
 *
 * The subtlety worth a test is which field decides. `isWithinGeofence` is set
 * on every punch, including ones nobody was asked to explain, so reading the
 * verdict pulls in punches that are not the thing being approved. The reason is
 * only ever recorded when the employee was asked for one, which is exactly the
 * set an approver is deciding.
 */
import { describe, expect, test } from 'bun:test';
import type {
  Attendance,
  ClockEvent,
} from '@tornotron/echno-core/attendance/types';
import {
  geofenceExceptionEvents,
  geofenceExceptionReason,
} from './geofence-exceptions';

function punch(overrides: Partial<ClockEvent>): ClockEvent {
  return {
    id: 1,
    eventType: 'morning_clock_in',
    isWithinGeofence: true,
    ...overrides,
  } as unknown as ClockEvent;
}

function day(overrides: Partial<Attendance>): Attendance {
  return {
    id: 7,
    employeeId: 12,
    employeeName: 'Priya Nair',
    projectName: 'Riverside Tower',
    approvalStatus: 'pending',
    requiresGeofenceApproval: true,
    ...overrides,
  } as unknown as Attendance;
}

describe('which punches are the ones being approved', () => {
  test('a punch is picked up by its stored reason', () => {
    const record = day({
      morningClockIn: punch({
        id: 1,
        isWithinGeofence: false,
        geofenceExceptionReason: 'Material pickup at the depot',
      }),
    });

    expect(geofenceExceptionEvents(record).map((e) => e.id)).toEqual([1]);
  });

  test('a punch outside the fence with no reason is not one of them', () => {
    // A supervisor marking a team member from the office lands outside the
    // fence and is never asked to explain it. Reading isWithinGeofence would
    // put it in front of an approver as something to decide.
    const record = day({
      morningClockIn: punch({ id: 1, isWithinGeofence: false }),
      eveningClockOut: punch({
        id: 2,
        eventType: 'evening_clock_out',
        isWithinGeofence: false,
        geofenceExceptionReason: 'Client walkthrough',
      }),
    });

    expect(geofenceExceptionEvents(record).map((e) => e.id)).toEqual([2]);
  });

  test('the punches come back in the order of the working day', () => {
    const record = day({
      eveningClockOut: punch({
        id: 4,
        eventType: 'evening_clock_out',
        geofenceExceptionReason: 'Returned from the depot',
      }),
      morningClockIn: punch({
        id: 1,
        geofenceExceptionReason: 'Material pickup at the depot',
      }),
    });

    expect(geofenceExceptionEvents(record).map((e) => e.id)).toEqual([1, 4]);
  });
});

describe('the one line a queue row shows', () => {
  test('joins two different reasons rather than taking the first', () => {
    const record = day({
      morningClockIn: punch({
        id: 1,
        geofenceExceptionReason: 'Material pickup at the depot',
      }),
      eveningClockOut: punch({
        id: 4,
        eventType: 'evening_clock_out',
        geofenceExceptionReason: 'Client walkthrough',
      }),
    });

    expect(geofenceExceptionReason(record)).toBe(
      'Material pickup at the depot · Client walkthrough'
    );
  });

  test('one reason given twice reads as one trip, not two', () => {
    // A clock-in and a clock-out on the same errand carry the same wording.
    // Printing it twice makes a single trip look like a pattern.
    const record = day({
      morningClockIn: punch({
        id: 1,
        geofenceExceptionReason: 'Site visit at Anna Nagar',
      }),
      eveningClockOut: punch({
        id: 4,
        eventType: 'evening_clock_out',
        geofenceExceptionReason: 'Site visit at Anna Nagar',
      }),
    });

    expect(geofenceExceptionReason(record)).toBe('Site visit at Anna Nagar');
  });

  test('a day with nothing explained has no line, not an empty one', () => {
    // The row falls back to "No reason recorded" on undefined. An empty string
    // would render as a blank cell that reads as a loading state.
    expect(geofenceExceptionReason(day({}))).toBeUndefined();
  });
});
