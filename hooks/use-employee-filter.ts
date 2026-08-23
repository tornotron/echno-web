'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';

/**
 * Maps the `role` query param carried by an employee-filter link to the human
 * label shown on the active-filter chip. Each key is the role slug used in the
 * URL; the value is the past-tense action label (e.g. `submitter` →
 * "Submitted by").
 */
export const ROLE_LABELS: Record<string, string> = {
  submitter: 'Submitted by',
  approver: 'Approved by',
  rejecter: 'Rejected by',
  preparer: 'Prepared by',
  'payment-recorder': 'Payment recorded by',
  verifier: 'Verified by',
  issuer: 'Issued by',
  creator: 'Created by',
  receiver: 'Received by',
  sender: 'Sent by',
  inspector: 'Inspector',
  assignee: 'Assigned to',
  reporter: 'Reported by',
};

/** Resolved employee filter read from the current list page's query params. */
export interface EmployeeFilterState {
  /** Employee surrogate id from `?employeeId=`, or `null` when unset. */
  employeeId: number | null;
  /** Role slug from `?role=` (see {@link ROLE_LABELS}), or `null` when unset. */
  role: string | null;
  /** Display name resolved from the employee lookup, or `null` when unset. */
  name: string | null;
  /** Clears the filter by replacing the URL with the bare pathname. */
  clear: () => void;
}

/**
 * Reads `employeeId` (number) and `role` (string) from the current URL's search
 * params, resolves the employee display name via {@link useEmployeeLookup}, and
 * returns the active filter plus a `clear` action.
 */
export function useEmployeeFilterFromParams(): EmployeeFilterState {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: employees = [] } = useEmployeeLookup();

  const rawId = searchParams.get('employeeId');
  const parsedId = rawId != null ? Number(rawId) : NaN;
  const employeeId = Number.isFinite(parsedId) ? parsedId : null;
  const role = searchParams.get('role');

  const name =
    employeeId != null
      ? (employees.find((e) => e.id === employeeId)?.name ??
        `User #${employeeId}`)
      : null;

  const clear = useCallback(() => {
    router.replace(pathname);
  }, [router, pathname]);

  return { employeeId, role, name, clear };
}

/**
 * Builds a list-page href that filters to one employee in one role, e.g.
 * `employeeFilterHref(routes.finance.invoices.href, 12, 'submitter')` →
 * `/users/dashboard/finance/invoices?employeeId=12&role=submitter`.
 */
export function employeeFilterHref(
  baseHref: string,
  id: number,
  role: string
): string {
  return `${baseHref}?employeeId=${id}&role=${role}`;
}

/**
 * Tests whether a list row matches the active employee filter. `accessors` maps
 * each role slug to a function extracting that role's employee id from the row;
 * the accessor for the active `role` decides the match. An unknown role matches
 * everything (fail-open — the chip still shows the requested employee).
 */
export function rowMatchesEmployeeFilter<T>(
  row: T,
  id: number,
  role: string,
  accessors: Record<string, (row: T) => number | null | undefined>
): boolean {
  const accessor = accessors[role];
  if (!accessor) return true;
  return accessor(row) === id;
}
