/**
 * Who marked a day's punches, when the answer is not the employee.
 *
 * A supervisor can record attendance for their team, and the server stamps
 * such a punch with the recorder's name, position, measured distance from the
 * site and the time the entry was written (echno-backend#839). These helpers
 * pull that out of an attendance record so the list, the detail and the clock
 * event timeline all say the same thing about the same punch.
 */
import type {
  Attendance,
  ClockEvent,
} from '@tornotron/echno-core/attendance/types';
import { format } from 'date-fns';
import { formatCoord } from './device-location';

/** The fields a "marked by" line reads. */
export type MarkedByFields = Pick<
  ClockEvent,
  | 'recordedById'
  | 'recordedByName'
  | 'recordedByLatitude'
  | 'recordedByLongitude'
  | 'recordedByDistanceMeters'
  | 'recordedAt'
  | 'timestamp'
>;

/**
 * Whether somebody other than the employee recorded this punch.
 *
 * A punch with no recorder at all is not treated as supervisor-marked: the
 * recorder is null when the caller resolved to no employee, and on every
 * punch written before the column existed.
 */
export function isMarkedByAnotherPerson(
  event: MarkedByFields | undefined,
  employeeId: number
): event is MarkedByFields {
  return event?.recordedById !== undefined && event.recordedById !== employeeId;
}

/** The day's punches somebody else recorded, in clock order. */
export function supervisorMarkedEvents(attendance: Attendance): ClockEvent[] {
  return [
    attendance.morningClockIn,
    attendance.lunchBreakStart,
    attendance.lunchBreakEnd,
    attendance.eveningClockOut,
  ].filter((event): event is ClockEvent =>
    isMarkedByAnotherPerson(event, attendance.employeeId)
  );
}

/**
 * The line a list shows under a day: "Marked by Anand Rajashekar at 09:05".
 *
 * Reads the first supervisor-marked punch. The time is when the supervisor
 * created the entry, falling back to the punch time for a row written before
 * `recordedAt` was stamped.
 *
 * @returns The label, or `undefined` when the employee marked every punch.
 */
export function markedByLabel(attendance: Attendance): string | undefined {
  const [first] = supervisorMarkedEvents(attendance);
  if (!first) return undefined;
  return describeMarkedBy(first);
}

/** "Marked by <name> at <time>" for one punch. */
export function describeMarkedBy(event: MarkedByFields): string {
  const who = event.recordedByName ?? `employee #${event.recordedById}`;
  const when = event.recordedAt ?? event.timestamp;
  return `Marked by ${who} at ${format(when, 'HH:mm')}`;
}

/**
 * Where the supervisor stood, as "13.08275°N, 80.27075°E, 24 m from site".
 *
 * @returns The description, or `undefined` when the punch carries no recorder
 *   position, which is every self-marked punch.
 */
export function describeMarkedFrom(event: MarkedByFields): string | undefined {
  if (
    event.recordedByLatitude === undefined ||
    event.recordedByLongitude === undefined
  ) {
    return undefined;
  }
  const where = formatCoord(
    event.recordedByLatitude,
    event.recordedByLongitude
  );
  return event.recordedByDistanceMeters === undefined
    ? where
    : `${where}, ${Math.round(event.recordedByDistanceMeters)} m from site`;
}
