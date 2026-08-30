/**
 * Rendering for leave-day counts.
 *
 * A day count arrives from the backend rounded to two decimal places, but it is
 * still a JavaScript number: printing it straight puts `60.67` on screen as
 * `60.67` and a whole `8` as `8`, while any figure that has not been through the
 * backend's rounding can still arrive with a long tail. Everything that shows a
 * day count goes through here, so the same value reads the same way on the
 * balance card, the dashboard totals and the apply form.
 */

/** Decimal places a day count is shown to, matching the backend's rounding. */
const DAY_SCALE = 2;

/**
 * Renders a day count as a bare number.
 *
 * Rounds to two decimal places and drops trailing zeros, so a whole number of
 * days reads as a whole number and a half day keeps its half.
 *
 * @param days - The count, e.g. `8`, `10.5`, `60.666666666666664`.
 * @returns `8`, `10.5`, `60.67`.
 */
export function formatDayCount(days: number | null | undefined): string {
  if (days === null || days === undefined || Number.isNaN(days)) return '0';
  // Number() drops the trailing zeros toFixed leaves behind: 8.00 -> 8, 10.50 -> 10.5.
  return String(Number(days.toFixed(DAY_SCALE)));
}

/**
 * Renders a day count with its unit.
 *
 * @param days - The count.
 * @returns `0.5 days`, `1 day`, `60.67 days`.
 */
export function formatDays(days: number | null | undefined): string {
  const rendered = formatDayCount(days);
  return `${rendered} ${rendered === '1' ? 'day' : 'days'}`;
}
