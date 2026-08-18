import { describe, expect, test } from 'bun:test';
import { hasAllRoles, hasRole } from './permissions';

describe('hasRole (OR logic)', () => {
  test('matches a single required role', () => {
    expect(hasRole(['a', 'b'], 'a')).toBe(true);
    expect(hasRole(['a', 'b'], 'c')).toBe(false);
  });

  test('matches when any of an array of required roles is present', () => {
    expect(hasRole(['a', 'b'], ['c', 'b'])).toBe(true);
    expect(hasRole(['a', 'b'], ['c', 'd'])).toBe(false);
  });

  test('an empty required array matches nothing (some over empty)', () => {
    expect(hasRole(['a'], [])).toBe(false);
  });

  test('empty user roles never match', () => {
    expect(hasRole([], 'a')).toBe(false);
    expect(hasRole([], ['a', 'b'])).toBe(false);
  });
});

describe('hasAllRoles (AND logic)', () => {
  test('true only when every required role is present', () => {
    expect(hasAllRoles(['a', 'b', 'c'], ['a', 'b'])).toBe(true);
    expect(hasAllRoles(['a', 'b'], ['a', 'c'])).toBe(false);
  });

  test('an empty required array is vacuously true (every over empty)', () => {
    expect(hasAllRoles([], [])).toBe(true);
    expect(hasAllRoles(['a'], [])).toBe(true);
  });

  test('empty user roles fail any non-empty requirement', () => {
    expect(hasAllRoles([], ['a'])).toBe(false);
  });
});
