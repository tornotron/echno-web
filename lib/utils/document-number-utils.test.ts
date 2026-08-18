import { describe, expect, test } from 'bun:test';
import {
  generateIndentNumber,
  generatePoNumber,
  generateTransferNumber,
  generateGrnNumber,
} from './document-number-utils';

// The generators key the sequence to the CURRENT year (both in the emitted number
// and when scanning existing ones), so fixtures use the same year the code sees.
const year = new Date().getFullYear();

describe('generatePoNumber', () => {
  test('starts at 000001 when there are no existing numbers', () => {
    expect(generatePoNumber([])).toBe(`PO-${year}-000001`);
  });

  test('returns one past the highest existing sequence', () => {
    expect(generatePoNumber([`PO-${year}-000005`, `PO-${year}-000003`])).toBe(`PO-${year}-000006`);
  });

  test('ignores other prefixes and other years', () => {
    expect(
      generatePoNumber([`IND-${year}-000009`, `PO-${year - 1}-000009`, 'garbage']),
    ).toBe(`PO-${year}-000001`);
  });

  test('keeps six-digit zero padding and does not truncate longer sequences', () => {
    expect(generatePoNumber([`PO-${year}-000001`])).toBe(`PO-${year}-000002`);
    expect(generatePoNumber([`PO-${year}-999999`])).toBe(`PO-${year}-1000000`);
  });
});

describe('prefix per document type', () => {
  test('each generator uses its own prefix', () => {
    expect(generateIndentNumber([])).toBe(`IND-${year}-000001`);
    expect(generateTransferNumber([])).toBe(`TRF-${year}-000001`);
    expect(generateGrnNumber([])).toBe(`GRN-${year}-000001`);
  });
});
