import { describe, expect, test } from 'bun:test';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import { hasAnyRole, isSystemAdmin } from './role-utils';

describe('isSystemAdmin', () => {
  test('true only when SYSTEM_ADMIN is present', () => {
    expect(isSystemAdmin([OrgRole.SYSTEM_ADMIN])).toBe(true);
    expect(isSystemAdmin(['other', OrgRole.SYSTEM_ADMIN])).toBe(true);
  });

  test('false for other roles', () => {
    expect(isSystemAdmin([OrgRole.PROJECT_MANAGER])).toBe(false);
    expect(isSystemAdmin(['SOMETHING_ELSE'])).toBe(false);
  });

  test('false for undefined or empty', () => {
    // Absent roles, obtained without a bare `undefined` literal.
    const absent = ({} as { roles?: string[] }).roles;
    expect(isSystemAdmin(absent)).toBe(false);
    expect(isSystemAdmin([])).toBe(false);
  });
});

describe('hasAnyRole', () => {
  test('true when any required role is present', () => {
    expect(hasAnyRole(['a', 'b'], ['b', 'c'])).toBe(true);
  });

  test('false when none match', () => {
    expect(hasAnyRole(['a', 'b'], ['c', 'd'])).toBe(false);
  });

  test('false for undefined or empty user roles', () => {
    expect(hasAnyRole(undefined, ['a'])).toBe(false);
    expect(hasAnyRole([], ['a'])).toBe(false);
  });

  test('an empty required array matches nothing', () => {
    expect(hasAnyRole(['a'], [])).toBe(false);
  });
});
