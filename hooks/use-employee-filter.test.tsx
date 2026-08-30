import { describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';

/**
 * The chip on a filtered list names whoever the filter points at. A link built
 * from an employee id resolves the name through the employee lookup; a link
 * built from a session-stamped user id must not, because the lookup is keyed by
 * a different table's sequence: it misses for most ids, and where the numbers
 * collide it names an employee who never touched the document. The detail
 * screens already stopped resolving these fields through the lookup; the links
 * they wrap those labels in have to stop too, or the wrong name survives one
 * click away.
 */
let search = '';

import * as realNavigation from 'next/navigation';

mock.module('next/navigation', () => ({
  ...realNavigation,
  useSearchParams: () => new URLSearchParams(search),
  usePathname: () => '/users/dashboard/resources/stock-adjustments',
  useRouter: () => ({ replace: () => {} }),
}));

import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  // Employee 12 exists and is not the person user 12 is. Resolving user 12
  // through this lookup is exactly the collision the label fix removed.
  useEmployeeLookup: () => ({ data: [{ id: 12, name: 'Priya Nair' }] }),
}));

const { useEmployeeFilterFromParams, employeeFilterHref, userFilterHref } =
  await import('./use-employee-filter');

describe('useEmployeeFilterFromParams', () => {
  test('an employee link resolves the name through the lookup', () => {
    search = 'employeeId=12&role=issuer';
    const { result } = renderHook(() => useEmployeeFilterFromParams());
    expect(result.current.employeeId).toBe(12);
    expect(result.current.name).toBe('Priya Nair');
  });

  test('a user link does not, even when an employee holds the same number', () => {
    search = 'userId=12&role=submitter';
    const { result } = renderHook(() => useEmployeeFilterFromParams());
    expect(result.current.employeeId).toBe(12);
    expect(result.current.name).toBe('User #12');
    expect(result.current.role).toBe('submitter');
  });

  test('an employee the lookup does not carry falls back to the same wording', () => {
    search = 'employeeId=99&role=issuer';
    const { result } = renderHook(() => useEmployeeFilterFromParams());
    expect(result.current.name).toBe('User #99');
  });

  test('no filter params means no filter', () => {
    search = '';
    const { result } = renderHook(() => useEmployeeFilterFromParams());
    expect(result.current.employeeId).toBe(null);
    expect(result.current.name).toBe(null);
  });
});

describe('filter hrefs', () => {
  test('the two builders differ only in which id kind the URL claims', () => {
    expect(employeeFilterHref('/base', 12, 'issuer')).toBe(
      '/base?employeeId=12&role=issuer'
    );
    expect(userFilterHref('/base', 12, 'submitter')).toBe(
      '/base?userId=12&role=submitter'
    );
  });
});
