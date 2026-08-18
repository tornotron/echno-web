import { describe, expect, test } from 'bun:test';
import { formatDateForBackend, formatDateForInput } from './date-utils';

// These two feed the Java backend (LocalDateTime, no timezone). They use UTC
// getters so a late-evening date does not roll back to the previous day in a
// positive-offset timezone. The assertions below are UTC-based, so they hold
// regardless of the machine's timezone.
describe('formatDateForBackend', () => {
  test('formats a date to midnight-UTC with a fixed time suffix', () => {
    expect(formatDateForBackend(new Date('2026-08-15T09:30:00Z'))).toBe('2026-08-15T00:00:00');
  });

  test('does not roll a late-UTC time back to the previous day', () => {
    // 23:30Z would be the 16th in a +5:30 zone if local getters were used.
    expect(formatDateForBackend(new Date('2026-08-15T23:30:00Z'))).toBe('2026-08-15T00:00:00');
  });

  test('accepts an ISO string', () => {
    expect(formatDateForBackend('2026-01-05T00:00:00Z')).toBe('2026-01-05T00:00:00');
  });

  test('returns an empty string for empty or invalid input', () => {
    expect(formatDateForBackend('')).toBe('');
    expect(formatDateForBackend('not-a-date')).toBe('');
  });
});

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
