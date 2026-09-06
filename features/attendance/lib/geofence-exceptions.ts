/**
 * The punches on an attendance day that were taken away from the site.
 *
 * Lifted out of `attendance-geofence-exception-card.tsx` so the approval queue
 * can say why a row is waiting without the reader opening the record. An
 * approver offered Approve and Reject on a bare date is being asked to agree to
 * something the screen has not told them, and a queue repeats that at every
 * row rather than once.
 */

import type {
  Attendance,
  ClockEvent,
} from '@tornotron/echno-core/attendance/types';

/**
 * The punches the employee marked from outside the site boundary, in order.
 *
 * A punch qualifies on its stored reason rather than on the verdict alone.
 * Only a self-marked punch outside the fence is asked for one, so the reason is
 * what says "this is the thing being approved", where `isWithinGeofence` being
 * false would also catch a punch nobody was asked to explain: a supervisor
 * marking a team member from the office, for one.
 *
 * @param attendance - The day to read.
 * @returns The clock events carrying a geofence exception reason.
 */
export function geofenceExceptionEvents(attendance: Attendance): ClockEvent[] {
  return [
    attendance.morningClockIn,
    attendance.lunchBreakStart,
    attendance.lunchBreakEnd,
    attendance.eveningClockOut,
  ].filter((event): event is ClockEvent => !!event?.geofenceExceptionReason);
}

/**
 * What the employee said about being away from site, as one line.
 *
 * A day can carry more than one explained punch, so the reasons are joined
 * rather than the first one being taken as the answer. Repeated wording is
 * collapsed: a clock-in and a clock-out both reading "site visit at Anna Nagar"
 * is one reason given twice, and printing it twice reads as two separate trips.
 *
 * @param attendance - The day to read.
 * @returns The joined reasons, or undefined when the day carries none.
 */
export function geofenceExceptionReason(
  attendance: Attendance
): string | undefined {
  const reasons = [
    ...new Set(
      geofenceExceptionEvents(attendance).map(
        (event) => event.geofenceExceptionReason as string
      )
    ),
  ];

  return reasons.length > 0 ? reasons.join(' · ') : undefined;
}
