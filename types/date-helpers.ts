/**
 * types/date-helpers.ts
 *
 * Lightweight UTC date parser for use inside type-layer parsers.
 *
 * Many backend APIs return ISO-like timestamps without a timezone suffix
 * (e.g. "2026-02-25T10:30:00"). JavaScript's `new Date()` interprets these
 * as **local time**, which causes incorrect relative-time displays when
 * the client timezone differs from the server (UTC).
 *
 * This helper appends a 'Z' when no timezone indicator is present so the
 * timestamp is correctly treated as UTC.
 */

export function parseUTCDate(
  value: string | Date | number | null | undefined
): Date | null {
  if (value == null) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // If the string looks like an ISO timestamp without timezone info, append 'Z'
  let str = value.trim();
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) &&
    !/[Zz]$/.test(str) &&
    !/[+-]\d{2}:\d{2}$/.test(str)
  ) {
    str += 'Z';
  }

  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}
