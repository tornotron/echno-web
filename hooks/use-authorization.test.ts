import { afterEach, describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import * as realAuth from 'next-auth/react';
import * as realHooks from '@tornotron/echno-core/employee/hooks';

// Mutable state the mocked hooks read from, so each test can shape the session
// and employee-role values before rendering.
let sessionStatus: 'authenticated' | 'loading' | 'unauthenticated' =
  'authenticated';
let employeeState: {
  orgRoles: string[];
  isLoading: boolean;
  employee: unknown;
} = { orgRoles: [], isLoading: false, employee: null };

// Spread the real modules so other consumers keep their exports; only the two
// hooks the unit reads are overridden.
mock.module('next-auth/react', () => ({
  ...realAuth,
  useSession: () => ({ status: sessionStatus }),
}));
mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realHooks,
  useEmployeeRoles: () => employeeState,
}));

const { useAuthorization } = await import('./use-authorization');

afterEach(() => {
  sessionStatus = 'authenticated';
  employeeState = { orgRoles: [], isLoading: false, employee: null };
});

describe('useAuthorization — unauthenticated', () => {
  test('all role checks are false', () => {
    sessionStatus = 'unauthenticated';
    employeeState = {
      orgRoles: [OrgRole.SYSTEM_ADMIN],
      isLoading: false,
      employee: null,
    };
    const { result } = renderHook(() => useAuthorization());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.hasRoles('anything')).toBe(false);
    expect(result.current.hasEveryRole(['anything'])).toBe(false);
  });
});

describe('useAuthorization — admin', () => {
  test('an admin passes every role check', () => {
    employeeState = {
      orgRoles: [OrgRole.SYSTEM_ADMIN],
      isLoading: false,
      employee: null,
    };
    const { result } = renderHook(() => useAuthorization());
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isSystemAdmin).toBe(true);
    expect(result.current.hasRoles('SOME_ROLE_THEY_LACK')).toBe(true);
    expect(result.current.hasEveryRole(['A', 'B'])).toBe(true);
  });
});

describe('useAuthorization — non-admin delegates to the role lists', () => {
  test('hasRoles matches present roles and rejects missing ones', () => {
    employeeState = {
      orgRoles: [OrgRole.SITE_ENGINEER],
      isLoading: false,
      employee: null,
    };
    const { result } = renderHook(() => useAuthorization());
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.hasRoles(OrgRole.SITE_ENGINEER)).toBe(true);
    expect(result.current.hasRoles(OrgRole.PROJECT_MANAGER)).toBe(false);
  });

  test('hasEveryRole needs all roles present', () => {
    employeeState = {
      orgRoles: [OrgRole.SITE_ENGINEER, OrgRole.PROJECT_MANAGER],
      isLoading: false,
      employee: null,
    };
    const { result } = renderHook(() => useAuthorization());
    expect(
      result.current.hasEveryRole([
        OrgRole.SITE_ENGINEER,
        OrgRole.PROJECT_MANAGER,
      ])
    ).toBe(true);
    expect(
      result.current.hasEveryRole([OrgRole.SITE_ENGINEER, OrgRole.HR_ADMIN])
    ).toBe(false);
  });
});

describe('useAuthorization — loading', () => {
  test('isLoading is true when the session is loading', () => {
    sessionStatus = 'loading';
    const { result } = renderHook(() => useAuthorization());
    expect(result.current.isLoading).toBe(true);
  });

  test('isLoading is true when employee roles are loading', () => {
    employeeState = { orgRoles: [], isLoading: true, employee: null };
    const { result } = renderHook(() => useAuthorization());
    expect(result.current.isLoading).toBe(true);
  });

  test('isLoading is false once both are settled', () => {
    const { result } = renderHook(() => useAuthorization());
    expect(result.current.isLoading).toBe(false);
  });
});
