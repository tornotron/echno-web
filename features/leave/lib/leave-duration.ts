/**
 * Duration rules for a leave request.
 *
 * The authoritative day count comes from the backend's calculate-days endpoint;
 * nothing here recomputes it. What these helpers own is which duration options
 * a given date range can honestly offer, how the choice reads on screen, and
 * the policy limits the form can check before the request is sent.
 *
 * The option rules mirror `LeaveRequestValidator.calculateTotalDays`:
 *
 *   - one day, either half selected, counts 0.5
 *   - a range counts the days between the dates, minus 0.5 when the first day
 *     is a `SECOND_HALF` and minus another 0.5 when the last day is a
 *     `FIRST_HALF`
 *
 * A `FIRST_HALF` on the first day of a range, or a `SECOND_HALF` on the last,
 * changes nothing server-side. Offering them would let someone pick a value
 * that the total quietly ignores, so those combinations are not offered.
 */

import { HalfDayType } from '@tornotron/echno-core/leave/types';
import type { LeavePolicy } from '@tornotron/echno-core/leave/types';
import { formatDays } from './leave-days';

/** Reader-facing name for a half-day value. */
export function halfDayTypeLabel(type?: HalfDayType | null): string {
  switch (type) {
    case HalfDayType.FIRST_HALF: {
      return 'First Half';
    }
    case HalfDayType.SECOND_HALF: {
      return 'Second Half';
    }
    default: {
      return 'Full Day';
    }
  }
}

/** True when the value takes half a day rather than a whole one. */
export function isHalfDay(type?: HalfDayType | null): boolean {
  return type === HalfDayType.FIRST_HALF || type === HalfDayType.SECOND_HALF;
}

/**
 * The duration options a single-day request can take.
 *
 * Both ends of a one-day request carry the same value, so the choice is a
 * straight three-way between a whole day and either half of it.
 */
export const SINGLE_DAY_OPTIONS: ReadonlyArray<{
  value: HalfDayType;
  label: string;
}> = [
  { value: HalfDayType.FULL_DAY, label: 'Full Day' },
  { value: HalfDayType.FIRST_HALF, label: 'Half Day - First Half' },
  { value: HalfDayType.SECOND_HALF, label: 'Half Day - Second Half' },
];

/** Options for the first day of a multi-day request: leave starts at noon, or does not. */
export const RANGE_START_OPTIONS: ReadonlyArray<{
  value: HalfDayType;
  label: string;
}> = [
  { value: HalfDayType.FULL_DAY, label: 'Full Day' },
  { value: HalfDayType.SECOND_HALF, label: 'Half Day - Second Half' },
];

/** Options for the last day of a multi-day request: leave ends at noon, or does not. */
export const RANGE_END_OPTIONS: ReadonlyArray<{
  value: HalfDayType;
  label: string;
}> = [
  { value: HalfDayType.FULL_DAY, label: 'Full Day' },
  { value: HalfDayType.FIRST_HALF, label: 'Half Day - First Half' },
];

/**
 * The half-day fields of a request.
 *
 * Both ends are optional so a stored `LeaveRequest`, whose fields are `?`, and
 * the apply form's state, which holds `null` for "not chosen", satisfy the same
 * shape without either side converting.
 */
export interface HalfDaySelection {
  startHalfDayType?: HalfDayType | null;
  endHalfDayType?: HalfDayType | null;
}

/** Whether the two dates describe one calendar day. */
export function isSingleDayRange(startDate: string, endDate: string): boolean {
  return Boolean(startDate) && startDate === endDate;
}

/**
 * Corrects a selection that the current dates and policy cannot support.
 *
 * The dates and the leave type both change under the selection: a range can
 * collapse to a single day, and a policy that forbids half-days can be chosen
 * after a half has been picked. Rather than leave a value that the server will
 * reject or silently ignore, the selection is brought back to something the
 * range can express.
 *
 * @param selection - The half-day values currently held by the form.
 * @param startDate - Start of the range, `YYYY-MM-DD`.
 * @param endDate - End of the range, `YYYY-MM-DD`.
 * @param allowHalfDay - Whether the selected leave policy permits half-days.
 * @returns The corrected selection.
 */
export function reconcileHalfDaySelection(
  selection: HalfDaySelection,
  startDate: string,
  endDate: string,
  allowHalfDay: boolean
): Required<HalfDaySelection> {
  if (!allowHalfDay) {
    return { startHalfDayType: null, endHalfDayType: null };
  }

  if (isSingleDayRange(startDate, endDate)) {
    // One day, one value, carried on both ends the way the backend reads it.
    const chosen = selection.startHalfDayType ?? selection.endHalfDayType ?? null;
    return { startHalfDayType: chosen, endHalfDayType: chosen };
  }

  return {
    startHalfDayType:
      selection.startHalfDayType === HalfDayType.SECOND_HALF
        ? HalfDayType.SECOND_HALF
        : null,
    endHalfDayType:
      selection.endHalfDayType === HalfDayType.FIRST_HALF
        ? HalfDayType.FIRST_HALF
        : null,
  };
}

/**
 * Describes the requested period in one line, for display.
 *
 * @param selection - The request's half-day values.
 * @param singleDay - Whether the request covers one calendar day.
 * @returns A phrase such as `Half Day - First Half` or `Full days, ending at midday`.
 */
export function describeDuration(
  selection: HalfDaySelection,
  singleDay: boolean
): string {
  if (singleDay) {
    return isHalfDay(selection.startHalfDayType)
      ? `Half Day - ${halfDayTypeLabel(selection.startHalfDayType)}`
      : 'Full Day';
  }

  const startsMidday = selection.startHalfDayType === HalfDayType.SECOND_HALF;
  const endsMidday = selection.endHalfDayType === HalfDayType.FIRST_HALF;

  if (startsMidday && endsMidday) {
    return 'Full days, starting and ending at midday';
  }
  if (startsMidday) return 'Full days, starting at midday';
  if (endsMidday) return 'Full days, ending at midday';
  return 'Full Day';
}

/**
 * Formats a day count, keeping the half visible.
 *
 * Kept as the name the duration code calls; the rendering itself is shared with
 * the balance figures through {@link formatDays}, so a count reads the same
 * wherever it appears.
 *
 * @param totalDays - The count returned by the backend, e.g. `0.5` or `3`.
 * @returns `0.5 days`, `1 day`, `2.5 days`.
 */
export function formatLeaveDays(totalDays: number): string {
  return formatDays(totalDays);
}

/** The policy fields the duration check reads. */
export type DurationPolicy = Pick<
  LeavePolicy,
  'leaveTypeName' | 'allowHalfDay' | 'minDaysPerRequest' | 'maxDaysPerRequest'
>;

/**
 * Checks a requested duration against the leave policy.
 *
 * The backend enforces all of this and rejects with a 400, which surfaces as a
 * toast after a round trip. Running the same checks in the form turns that into
 * immediate feedback while the dates are still on screen.
 *
 * @param totalDays - The computed duration of the request.
 * @param selection - The request's half-day values.
 * @param policy - The selected leave policy.
 * @returns The reason the request is not permitted, or `null` when it is.
 */
export function checkDurationAgainstPolicy(
  totalDays: number,
  selection: HalfDaySelection,
  policy?: DurationPolicy
): string | null {
  if (!policy || totalDays <= 0) return null;

  const wantsHalfDay =
    isHalfDay(selection.startHalfDayType) || isHalfDay(selection.endHalfDayType);
  if (wantsHalfDay && !policy.allowHalfDay) {
    return `${policy.leaveTypeName} does not allow half-day leave. Choose full days.`;
  }

  if (policy.minDaysPerRequest && totalDays < policy.minDaysPerRequest) {
    return `${policy.leaveTypeName} requires at least ${formatLeaveDays(policy.minDaysPerRequest)} per request.`;
  }

  if (policy.maxDaysPerRequest && totalDays > policy.maxDaysPerRequest) {
    return `${policy.leaveTypeName} allows at most ${formatLeaveDays(policy.maxDaysPerRequest)} per request.`;
  }

  return null;
}
