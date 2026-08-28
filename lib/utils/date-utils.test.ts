import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  formatDateForInput,
  toLocalDateInputValue,
  todayForDateInput,
} from './date-utils';

describe('formatDateForInput', () => {
  test('formats to a YYYY-MM-DD value for a date input', () => {
    expect(formatDateForInput(new Date('2026-08-15T09:30:00Z'))).toBe('2026-08-15');
  });

  test('uses the UTC day for a late-UTC time', () => {
    expect(formatDateForInput(new Date('2026-08-15T23:30:00Z'))).toBe('2026-08-15');
  });

  test('returns an empty string for empty or invalid input', () => {
    expect(formatDateForInput('')).toBe('');
    expect(formatDateForInput('not-a-date')).toBe('');
  });
});

// Pinned to a non-UTC zone, and restored afterwards. The runner defaults to UTC,
// where the local and UTC calendar dates are always identical and every assertion
// below would pass against the bug it is written to catch. IST is UTC+05:30 with no
// DST, so a local time at or after 18:30 falls on the next UTC day.
describe('toLocalDateInputValue and todayForDateInput', () => {
  const originalTimeZone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'Asia/Kolkata';
  });

  afterAll(() => {
    process.env.TZ = originalTimeZone;
  });

  test('reads the local calendar date, not the UTC one', () => {
    // 21:00 IST on the 27th is 15:30Z the same day, so both agree here.
    expect(toLocalDateInputValue(new Date(2026, 7, 27, 21, 0, 0))).toBe('2026-08-27');
  });

  test('does not roll to the previous day late in the local evening', () => {
    // 23:30 IST on the 27th is 18:00Z on the 27th... but 00:30 IST on the 28th
    // is 19:00Z on the 27th, which is where toISOString() returns yesterday.
    const justAfterMidnight = new Date(2026, 7, 28, 0, 30, 0);

    expect(justAfterMidnight.toISOString().split('T')[0]).toBe('2026-08-27');
    expect(toLocalDateInputValue(justAfterMidnight)).toBe('2026-08-28');
  });

  test('stays on the local date all evening', () => {
    // Any local time from 18:30 onward is already the next day in UTC.
    for (const hour of [19, 21, 23]) {
      expect(toLocalDateInputValue(new Date(2026, 7, 27, hour, 0, 0))).toBe('2026-08-27');
    }
  });

  test('pads single-digit months and days', () => {
    expect(toLocalDateInputValue(new Date(2026, 0, 5, 12, 0, 0))).toBe('2026-01-05');
  });

  test('todayForDateInput agrees with the local calendar date', () => {
    const now = new Date();
    expect(todayForDateInput()).toBe(toLocalDateInputValue(now));
  });
});
