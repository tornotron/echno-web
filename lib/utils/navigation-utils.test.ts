import { describe, expect, test } from 'bun:test';
import {
  getBreadcrumbLabel,
  isIdSegment,
  isPathActive,
} from './navigation-utils';

describe('isIdSegment', () => {
  test('numeric segments are ids', () => {
    expect(isIdSegment('123')).toBe(true);
    expect(isIdSegment('0')).toBe(true);
  });

  test('UUID segments are ids', () => {
    expect(isIdSegment('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  test('word and mixed segments are not ids', () => {
    expect(isIdSegment('projects')).toBe(false);
    expect(isIdSegment('12ab')).toBe(false);
    expect(isIdSegment('abc-def')).toBe(false);
  });
});

describe('isPathActive', () => {
  test('exact match is active', () => {
    expect(isPathActive('/a', '/a')).toBe(true);
  });

  test('a sub-route is active', () => {
    expect(isPathActive('/a', '/a/b')).toBe(true);
  });

  test('a sibling with a shared prefix is not active', () => {
    expect(isPathActive('/a', '/ab')).toBe(false);
  });

  test('an unrelated path is not active', () => {
    expect(isPathActive('/a', '/b')).toBe(false);
  });
});

describe('getBreadcrumbLabel', () => {
  test('returns the mapped label when the segment is known', () => {
    expect(getBreadcrumbLabel('new')).toBe('New');
    expect(getBreadcrumbLabel('edit')).toBe('Edit');
  });

  test('capitalizes and de-dashes an unknown segment', () => {
    expect(getBreadcrumbLabel('some-thing')).toBe('Some thing');
    expect(getBreadcrumbLabel('foo')).toBe('Foo');
  });
});
