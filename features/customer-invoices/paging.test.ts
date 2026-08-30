import { describe, expect, test } from 'bun:test';
import { clampPageNo } from './paging';

describe('clampPageNo', () => {
  test('leaves a page that exists alone', () => {
    expect(clampPageNo(1, 3)).toBe(1);
  });

  test('falls back to the last page when the one asked for has gone', () => {
    // Issuing the last draft on page 3 of a listing filtered to drafts leaves
    // two pages. Asking for page 3 again returns nothing under a footer
    // reading "page 3 of 2".
    expect(clampPageNo(2, 2)).toBe(1);
    expect(clampPageNo(9, 2)).toBe(1);
  });

  test('an empty result goes back to the first page', () => {
    expect(clampPageNo(4, 0)).toBe(0);
  });

  test('the first page is already the floor', () => {
    expect(clampPageNo(0, 0)).toBe(0);
    expect(clampPageNo(0, 5)).toBe(0);
  });
});
