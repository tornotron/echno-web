/**
 * The "marked by" line is shown only when somebody else recorded the punch, and
 * says who, when and from where (echno-backend#839, ClickUp 86d45jzpa).
 */
import { describe, expect, test } from 'bun:test';
import type {
  Attendance,
  ClockEvent,
} from '@tornotron/echno-core/attendance/types';
import {
  describeMarkedBy,
  describeMarkedFrom,
  isMarkedByAnotherPerson,
  markedByLabel,
  supervisorMarkedEvents,
} from './marked-by';

const punch = (over: Partial<ClockEvent>): ClockEvent =>
  ({
    id: 1,
    timestamp: new Date(2026, 8, 20, 9, 2),
    ...over,
  }) as unknown as ClockEvent;

const day = (over: Partial<Attendance>): Attendance =>
  ({ id: 41, employeeId: 4, ...over }) as unknown as Attendance;

const bySupervisor = punch({
  recordedById: 31,
  recordedByName: 'Anand Rajashekar',
  recordedByLatitude: 13.082_75,
  recordedByLongitude: 80.270_75,
  recordedByDistanceMeters: 23.5,
  recordedAt: new Date(2026, 8, 20, 9, 5),
});

describe('isMarkedByAnotherPerson', () => {
  test('a self-marked punch is not', () => {
    expect(isMarkedByAnotherPerson(punch({ recordedById: 4 }), 4)).toBe(false);
  });

  test('a punch with no recorder is not, since nobody is named', () => {
    expect(isMarkedByAnotherPerson(punch({}), 4)).toBe(false);
    expect(isMarkedByAnotherPerson(undefined, 4)).toBe(false);
  });

  test('a punch another employee recorded is', () => {
    expect(isMarkedByAnotherPerson(bySupervisor, 4)).toBe(true);
  });
});

describe('markedByLabel', () => {
  test('is absent when the employee marked every punch', () => {
    expect(
      markedByLabel(day({ morningClockIn: punch({ recordedById: 4 }) }))
    ).toBeUndefined();
  });

  test('names the supervisor and the time the entry was written', () => {
    // 09:05 is recordedAt, not the 09:02 the punch is recorded as.
    expect(markedByLabel(day({ morningClockIn: bySupervisor }))).toBe(
      'Marked by Anand Rajashekar at 09:05'
    );
  });

  test('falls back to the punch time on a row written before recordedAt existed', () => {
    const older = punch({
      recordedById: 31,
      recordedByName: 'Anand Rajashekar',
    });
    expect(describeMarkedBy(older)).toBe('Marked by Anand Rajashekar at 09:02');
  });

  test('reads a later punch when the clock-in was self-marked', () => {
    const attendance = day({
      morningClockIn: punch({ recordedById: 4 }),
      eveningClockOut: bySupervisor,
    });
    expect(supervisorMarkedEvents(attendance)).toHaveLength(1);
    expect(markedByLabel(attendance)).toContain('Anand Rajashekar');
  });
});

describe('describeMarkedFrom', () => {
  test('is absent on a self-marked punch', () => {
    expect(describeMarkedFrom(punch({ recordedById: 4 }))).toBeUndefined();
  });

  test('gives the position and the measured distance', () => {
    expect(describeMarkedFrom(bySupervisor)).toBe(
      '13.08275°N, 80.27075°E, 24 m from site'
    );
  });

  test('gives the position alone when the fence could not be measured', () => {
    expect(
      describeMarkedFrom({
        ...bySupervisor,
        recordedByDistanceMeters: undefined,
      })
    ).toBe('13.08275°N, 80.27075°E');
  });
});
