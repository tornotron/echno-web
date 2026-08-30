import { describe, expect, it } from 'bun:test';
import { formatDayCount, formatDays } from './leave-days';

describe('formatDayCount', () => {
  it('drops the recurring tail a monthly accrual leaves behind', () => {
    // Eight months of a 91-day annual quota, the figure that reached the
    // My Leaves screen as 60.666666666666664.
    expect(formatDayCount(60.666_666_666_666_664)).toBe('60.67');
  });

  it('drops the tail on the summed balance too', () => {
    expect(formatDayCount(90.666_666_666_666_66)).toBe('90.67');
  });

  it('leaves a whole number whole', () => {
    expect(formatDayCount(8)).toBe('8');
    expect(formatDayCount(12)).toBe('12');
    expect(formatDayCount(0)).toBe('0');
  });

  it('keeps a half day visible', () => {
    expect(formatDayCount(0.5)).toBe('0.5');
    expect(formatDayCount(10.5)).toBe('10.5');
    expect(formatDayCount(2.5)).toBe('2.5');
  });

  it('treats an absent count as zero', () => {
    expect(formatDayCount(null)).toBe('0');
    expect(formatDayCount(undefined)).toBe('0');
    expect(formatDayCount(Number.NaN)).toBe('0');
  });

  it('shows a negative balance rather than hiding it', () => {
    expect(formatDayCount(-1.5)).toBe('-1.5');
  });
});

describe('formatDays', () => {
  it('uses the singular only for exactly one day', () => {
    expect(formatDays(1)).toBe('1 day');
    expect(formatDays(0.5)).toBe('0.5 days');
    expect(formatDays(2)).toBe('2 days');
    expect(formatDays(0)).toBe('0 days');
  });

  it('carries the rounding through', () => {
    expect(formatDays(60.666_666_666_666_664)).toBe('60.67 days');
  });
});
