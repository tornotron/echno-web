import { describe, expect, test } from 'bun:test';
import {
  formatInr,
  formatPercent,
  formatQty,
  parseAmountInput,
} from './format';

describe('billing number formats', () => {
  test('rupees use Indian digit grouping and two places', () => {
    expect(formatInr(4_250_000)).toBe('₹42,50,000.00');
    expect(formatInr(2_199_933.74)).toBe('₹21,99,933.74');
    expect(formatInr(0)).toBe('₹0.00');
    expect(formatInr(undefined)).toBe('-');
    expect(formatInr(Number.NaN)).toBe('-');
  });

  test('quantities keep up to three places and percents up to two', () => {
    expect(formatQty(120.255)).toBe('120.255');
    expect(formatQty(5000)).toBe('5,000');
    expect(formatPercent(78.4)).toBe('78.4%');
    expect(formatPercent(undefined)).toBe('-');
  });

  test('typed amounts: blank is null, junk and negatives are invalid, commas are fine', () => {
    expect(parseAmountInput('  ')).toBeNull();
    expect(parseAmountInput('1,20,000.5')).toBe(120_000.5);
    expect(parseAmountInput('-3')).toBeUndefined();
    expect(parseAmountInput('abc')).toBeUndefined();
    expect(parseAmountInput('0')).toBe(0);
  });
});
