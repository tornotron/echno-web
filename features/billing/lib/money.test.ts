/**
 * Money formatting (#459): a missing or non-finite amount renders as an empty
 * string rather than the rupee sign followed by "NaN".
 */
import { describe, expect, test } from 'bun:test';
import { formatPaise, formatRupees } from './money';

describe('formatRupees / formatPaise', () => {
  test('format finite amounts', () => {
    expect(formatRupees(9999)).toContain('9,999');
    expect(formatPaise(999_900)).toContain('9,999');
    expect(formatRupees(0)).toContain('0');
  });

  test('render nothing for undefined, null, NaN and infinities', () => {
    for (const value of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(formatRupees(value)).toBe('');
      expect(formatPaise(value)).toBe('');
    }
  });
});
