/**
 * Pure helpers behind the "Mark for Team" screen.
 *
 * The screen lets a supervisor clock a whole project team in and out from one
 * table. Everything here is deliberately free of React so the state machine and
 * the result reporting can be tested directly.
 */

import type {
  Attendance,
  AttendanceProfile,
} from '@tornotron/echno-core/attendance/types';

/**
 * Where a team member sits in the day's clock sequence.
 *
 * `notMarked` has no attendance row (or a row with no morning clock-in),
 * `clockedIn` has a clock-in but no clock-out, `clockedOut` has both, and
 * `onLeave` is covered by an approved leave request for the day.
 */
export type TeamMemberState =
  | 'notMarked'
  | 'clockedIn'
  | 'clockedOut'
  | 'onLeave';

/** The attendance fields the state machine actually reads. */
export type TeamAttendanceRecord = Pick<
  Attendance,
  'status' | 'morningClockIn' | 'eveningClockOut' | 'leaveId'
>;

/**
 * Derives a member's state for the selected day from their attendance record.
 *
 * Leave wins over the clock events: a day covered by approved leave is not a
 * day anyone should be marking attendance for, whatever stray events it holds.
 *
 * @param record - The member's attendance row for the day, if one exists.
 * @returns The member's {@link TeamMemberState}.
 */
export function resolveTeamMemberState(
  record?: TeamAttendanceRecord
): TeamMemberState {
  if (!record) return 'notMarked';
  if (record.status === 'leave' || record.leaveId !== undefined) {
    return 'onLeave';
  }
  if (record.eveningClockOut) return 'clockedOut';
  if (record.morningClockIn) return 'clockedIn';
  return 'notMarked';
}

/** Human-readable label for a member state, matching the status column. */
export function teamMemberStateLabel(state: TeamMemberState): string {
  switch (state) {
    case 'clockedOut': {
      return 'Clocked Out';
    }
    case 'clockedIn': {
      return 'Clocked In';
    }
    case 'onLeave': {
      return 'On Leave';
    }
    default: {
      return 'Not Marked';
    }
  }
}

/**
 * Whether a member can be ticked at all.
 *
 * A completed day and a leave day are both terminal, so their rows are read
 * only. Everything else can still take one of the two actions.
 */
export function isSelectableState(state: TeamMemberState): boolean {
  return state === 'notMarked' || state === 'clockedIn';
}

/** Whether a clock-in can still be recorded for this state. */
export function canClockIn(state: TeamMemberState): boolean {
  return state === 'notMarked';
}

/** Whether a clock-out can be recorded for this state. */
export function canClockOut(state: TeamMemberState): boolean {
  return state === 'clockedIn';
}

/**
 * Drops selections that are no longer valid.
 *
 * The table re-renders after every mutation, so a member ticked while they were
 * `notMarked` may be `clockedIn` by the time the next action runs. Rather than
 * silently sending a doomed request, the selection is narrowed to whoever is
 * still eligible.
 *
 * @param selected - Currently ticked employee ids.
 * @param stateOf - Resolves the current state for an employee id.
 * @returns The subset of `selected` that is still selectable.
 */
export function pruneSelection(
  selected: Iterable<number>,
  stateOf: (employeeId: number) => TeamMemberState
): number[] {
  return [...selected].filter((id) => isSelectableState(stateOf(id)));
}

/**
 * Explains why the bulk screen cannot satisfy the project's capture rules.
 *
 * The backend rejects a check-in when the effective attendance settings demand
 * a selfie or GPS coordinates. The team screen is operated from a desk on
 * behalf of other people, so it can supply neither. Detecting that up front
 * turns a run of silent 400s into one actionable sentence.
 *
 * @param settings - Effective attendance settings for the project, falling back
 *   to the organisation defaults.
 * @returns A message naming the blocking requirements, or `null` when bulk
 *   marking is permitted.
 */
export function describeCaptureBlock(
  settings?: Pick<
    AttendanceProfile,
    'photoRequiredOnCheckIn' | 'geolocationRequired'
  >
): string | null {
  if (!settings) return null;
  const blockers: string[] = [];
  if (settings.photoRequiredOnCheckIn) blockers.push('a check-in photo');
  if (settings.geolocationRequired) blockers.push('GPS coordinates');
  if (blockers.length === 0) return null;
  return `This project requires ${blockers.join(' and ')} on every attendance event, which cannot be captured when marking on behalf of the team. Turn the requirement off in Attendance Settings for this project, or have the employees clock in themselves.`;
}

/** One member's outcome from a bulk clock action. */
export interface BulkAttempt {
  /** Employee the attempt was made for. */
  employeeId: number;
  /** Display name used in the result message. */
  name: string;
  /** Whether the request succeeded. */
  ok: boolean;
  /** Failure reason, when `ok` is false. */
  reason?: string;
}

/** A bulk action's outcome, ready to be turned into a toast. */
export interface BulkOutcome {
  /** `success` when every attempt worked, `partial` when some did, else `error`. */
  level: 'success' | 'partial' | 'error';
  /** Headline for the toast. */
  title: string;
  /** Supporting detail naming the failures, when there are any. */
  description?: string;
}

/**
 * Turns the per-member attempts into the message the operator sees.
 *
 * The previous behaviour reported a success toast unconditionally, so a run in
 * which every request 400'd still read "Clock-in marked for 0 employee(s)".
 * Here a zero-success run is an error and a mixed run names the members that
 * failed alongside the backend's reason.
 *
 * @param action - Wording for the action, e.g. `'Clock-in'`.
 * @param attempts - One entry per member the action was attempted for.
 * @returns The toast level, title and description.
 */
function plural(count: number): string {
  return count === 1 ? 'employee' : 'employees';
}

export function summarizeBulkOutcome(
  action: string,
  attempts: readonly BulkAttempt[]
): BulkOutcome {
  const succeeded = attempts.filter((a) => a.ok);
  const failed = attempts.filter((a) => !a.ok);

  if (failed.length === 0) {
    return {
      level: 'success',
      title: `${action} marked for ${succeeded.length} ${plural(succeeded.length)}`,
    };
  }

  const reasons = failed
    .map((a) => `${a.name}: ${a.reason ?? 'request failed'}`)
    .join('; ');

  if (succeeded.length === 0) {
    return {
      level: 'error',
      title: `${action} failed for all ${failed.length} selected ${plural(failed.length)}`,
      description: reasons,
    };
  }

  return {
    level: 'partial',
    title: `${action} marked for ${succeeded.length} of ${attempts.length} ${plural(attempts.length)}`,
    description: `Failed for ${failed.length}: ${reasons}`,
  };
}

/**
 * Builds the timestamp sent for a clock event.
 *
 * The operator picks a wall-clock time against the selected calendar date, so
 * the two are combined in the browser's own zone. Constructing the `Date` from
 * parts avoids the string-parsing differences between engines.
 *
 * @param date - Calendar day in `YYYY-MM-DD`.
 * @param time - Wall-clock time in `HH:mm`.
 * @returns The combined local `Date`, or `null` when either part is malformed.
 */
export function buildEventTimestamp(date: string, time: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const [, year, month, day] = dateMatch;
  const [, hours, minutes] = timeMatch;
  const built = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    0,
    0
  );
  return Number.isNaN(built.getTime()) ? null : built;
}
