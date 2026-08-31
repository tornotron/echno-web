'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { userReferenceLabel } from '@/lib/utils/user-reference';

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
  'site-engineer': 'Site engineer',
  assignee: 'Assigned to',
  reporter: 'Reported by',
  requester: 'Requested by',
  handover: 'Handover to',
};

/** Resolved employee filter read from the current list page's query params. */
export interface EmployeeFilterState {
  /**
   * Id from `?employeeId=` or `?userId=`, or `null` when unset. Which table it
   * belongs to depends on the param that carried it: the list pages compare it
   * against the same field the link was built from, so the match is
   * like-for-like either way.
   */
  employeeId: number | null;
  /** Role slug from `?role=` (see {@link ROLE_LABELS}), or `null` when unset. */
  role: string | null;
  /** Display name resolved from the employee lookup, or `null` when unset. */
  name: string | null;
  /** Clears the filter by replacing the URL with the bare pathname. */
  clear: () => void;
}

/**
 * Reads `employeeId` or `userId` (number) and `role` (string) from the current
 * URL's search params and returns the active filter plus a `clear` action.
 *
 * The two params differ only in how the chip is worded. An `employeeId` names a
 * row in the employee table, so the display name is resolved via
 * {@link useEmployeeLookup}. A `userId` is a session-stamped user id (the
 * `submittedBy` / `approvedBy` / `rejectedBy` fields the backend writes with
 * `UserContextService.getCurrentUserId()`), which the employee lookup cannot
 * resolve: the two tables run separate sequences, so the lookup misses for most
 * ids and names a different person whenever the numbers collide. It is worded
 * as `User #<id>`, the same label the detail screens use for these fields.
 */
export function useEmployeeFilterFromParams(): EmployeeFilterState {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: employees = [] } = useEmployeeLookup();

  const rawEmployeeId = searchParams.get('employeeId');
  const rawId = rawEmployeeId ?? searchParams.get('userId');
  const parsedId = rawId == null ? Number.NaN : Number(rawId);
  const employeeId = Number.isFinite(parsedId) ? parsedId : null;
  const role = searchParams.get('role');

  const name =
    employeeId == null
      ? null
      : rawEmployeeId == null
        ? userReferenceLabel(employeeId)
        : (employees.find((e) => e.id === employeeId)?.name ??
          userReferenceLabel(employeeId));

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
 * Builds a list-page href that filters to one **user** in one role, for the
 * `*By` fields the backend stamps from the session rather than from an
 * employee picker. The chip then words the filter as `User #<id>` instead of
 * resolving the id through the employee lookup, which is keyed by a different
 * table's sequence and would name whichever employee happens to hold the same
 * number.
 */
export function userFilterHref(
  baseHref: string,
  id: number,
  role: string
): string {
  return `${baseHref}?userId=${id}&role=${role}`;
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
