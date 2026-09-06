'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import {
  employeeReferenceLabel,
  userStampLabel,
} from '@/lib/utils/user-reference';

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
  payee: 'Paid to',
  employee: 'Employee',
  manager: 'Reporting to',
  raiser: 'Raised by',
  closer: 'Closed by',
};

/**
 * Reads one role's employee id off a list row. Returning `undefined` or `null`
 * means the row has nobody in that role, so it never matches.
 */
export type EmployeeFilterAccessor<T> = (row: T) => number | null | undefined;

/**
 * How one role slug behaves on one list page. The common case is a bare
 * accessor. The object form covers the two cases an accessor cannot express.
 */
export type EmployeeFilterRole<T> =
  | EmployeeFilterAccessor<T>
  | {
      /**
       * Reads the role's id off a row, as the bare-accessor form does. Leave
       * both this and `matches` out when the page feeds the id to its own query
       * and the server does the narrowing: there is then nothing to test in the
       * browser, and declaring the role here is still what tells the chip the
       * list really was narrowed.
       */
      match?: EmployeeFilterAccessor<T>;
      /**
       * Tests a row directly, for a role held in more than one place on the
       * row (an assignee array, an approval chain) where no single id answers
       * the question. Takes precedence over `match`.
       */
      matches?: (row: T, id: number) => boolean;
      /**
       * Defaults to true. Set false where a control already on the page
       * displays and clears this filter, so a chip would be a second copy of
       * it (the NCR register's Site Engineer dropdown).
       */
      chip?: boolean;
    };

/**
 * Every role slug a list page narrows on, keyed by the slug the URL carries.
 *
 * This map is the single declaration issue #407 exists to create. The chip and
 * the narrowing are both derived from it, so a role the page does not apply
 * cannot produce a chip: `useEmployeeFilterFromParams` returns a null
 * `employeeId`, `role` and `name` for it, and a null `chip`.
 */
export type EmployeeFilterRoles<T> = Record<string, EmployeeFilterRole<T>>;

/** What the page hands to {@link ActiveFilterChip}, or `null` for no chip. */
export interface EmployeeFilterChipProps {
  label: string;
  name: string;
  onDismiss: () => void;
}

export interface EmployeeFilterOptions<T> {
  /**
   * The roles this page narrows on. Required, and required to be complete: a
   * role missing from here is a role the page does not apply, and is treated
   * as an unset filter rather than as a filter that quietly matched nothing.
   */
  roles: EmployeeFilterRoles<T>;
  /**
   * The collection being narrowed. It types the accessors in `roles` and backs
   * {@link EmployeeFilterState.filtered}. Omit on a page that narrows
   * server-side and has no rows to test.
   */
  rows?: readonly T[];
  /**
   * Optional lookup from a `userId` to the name a loaded row carries for it.
   * Only consulted for a `?userId=` filter; an `?employeeId=` filter always
   * goes through the employee lookup.
   */
  resolveUserName?: (userId: number) => string | null | undefined;
}

/** Resolved employee filter read from the current list page's query params. */
export interface EmployeeFilterState<T> {
  /**
   * Id from `?employeeId=` or `?userId=`, or `null` when no filter is set **or
   * when the role in the URL is not one this page narrows on**. Which table it
   * belongs to depends on the param that carried it: the list pages compare it
   * against the same field the link was built from, so the match is
   * like-for-like either way.
   */
  employeeId: number | null;
  /**
   * Role slug from `?role=` (see {@link ROLE_LABELS}), or `null` on the same
   * two conditions as `employeeId`. The two are nulled together, which is what
   * keeps a page's own use of them in step with the chip.
   */
  role: string | null;
  /**
   * Display name for the filter: resolved from the employee lookup for an
   * `employeeId`, or from the stamps the loaded rows carry for a `userId`.
   * `null` whenever `employeeId` is.
   */
  name: string | null;
  /**
   * Row predicate for the active filter. Every row passes when no filter
   * applies, and when the applying role is narrowed server-side.
   */
  matches: (row: T) => boolean;
  /** `rows` narrowed by {@link matches}. Empty when no `rows` were given. */
  filtered: T[];
  /**
   * Props for the active-filter chip, or `null` when there is nothing to
   * announce. Non-null exactly when the filter narrowed the list, because it
   * is derived from the same `roles` map the narrowing is.
   */
  chip: EmployeeFilterChipProps | null;
  /** Clears the filter, keeping any query params it does not own. */
  clear: () => void;
}

/**
 * Reads `employeeId` or `userId` (number) and `role` (string) from the current
 * URL's search params and returns the active filter, a row predicate, a chip
 * and a `clear` action.
 *
 * **The point of the signature.** A list page narrows on a handful of roles and
 * ignores the rest. Sixteen pages used to spell that set out twice, once in the
 * accessors that narrowed and once, more loosely, in the guard that rendered
 * the chip, so `?employeeId=8&role=submitter` on a list that only reads
 * `creator` showed every row under a chip reading "Submitted by Ravi Kumar".
 * The chip is the only thing on screen claiming the list is one person's work,
 * so that stated the opposite of the truth. Declaring the roles once, here,
 * makes the two impossible to tell apart: an undeclared role nulls
 * `employeeId`, `role`, `name` and `chip` together, so it narrows nothing and
 * says nothing.
 *
 * The two id params differ in where the display name comes from. An
 * `employeeId` names a row in the employee table, so it resolves via
 * {@link useEmployeeLookup}. A `userId` is a session-stamped user id (the
 * `submittedBy` / `approvedBy` / `rejectedBy` / `verifiedBy` fields the backend
 * writes with `UserContextService.getCurrentUserId()`), which the employee
 * lookup cannot resolve: the two tables run separate sequences, so the lookup
 * misses for most ids and names a different person whenever the numbers
 * collide.
 *
 * There is no client-side user directory to resolve a `userId` against, but the
 * documents the filter selects now carry the name the backend resolved for that
 * stamp. A list page can therefore hand in `resolveUserName`, reading the name
 * off its own loaded rows, and the chip words itself the way the detail screen
 * does. Without one, or where no loaded row carries the id, the chip falls back
 * to `User #<id>`, which is also what a deleted account resolves to anyway.
 */
export function useEmployeeFilterFromParams<T = never>({
  roles,
  rows,
  resolveUserName,
}: EmployeeFilterOptions<T>): EmployeeFilterState<T> {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: employees = [] } = useEmployeeLookup();

  const rawEmployeeId = searchParams.get('employeeId');
  const rawId = rawEmployeeId ?? searchParams.get('userId');
  const parsedId = rawId == null ? Number.NaN : Number(rawId);
  const urlId = Number.isFinite(parsedId) ? parsedId : null;
  const urlRole = searchParams.get('role');

  /*
    The one decision this hook exists to make, taken once. `Object.hasOwn`
    rather than a truthiness test on the looked-up value: a plain object
    literal inherits `toString`, `constructor` and the rest from
    `Object.prototype`, so `?role=toString` would otherwise read as a declared
    role and be handed a string-returning "accessor".
  */
  const declared =
    urlRole != null && Object.hasOwn(roles, urlRole) ? roles[urlRole] : null;
  const applies = urlId != null && declared != null;

  const employeeId = applies ? urlId : null;
  const role = applies ? urlRole : null;

  const name =
    employeeId == null
      ? null
      : rawEmployeeId == null
        ? userStampLabel(resolveUserName?.(employeeId), employeeId)
        : (employees.find((e) => e.id === employeeId)?.name ??
          employeeReferenceLabel(employeeId));

  const clear = useCallback(() => {
    // Drops the three params this filter owns and keeps the rest. It used to
    // replace with the bare pathname, which was harmless while every list route
    // was a bare path, and stops being harmless on the attendance history:
    // that is one page holding two tabs, so clearing the filter would also drop
    // `?tab=team` and drop the reader onto somebody else's timesheet.
    const next = new URLSearchParams(searchParams);
    next.delete('employeeId');
    next.delete('userId');
    next.delete('role');
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [router, pathname, searchParams]);

  /*
    Deliberately not memoised. Pages write their `roles` map inline, so it is a
    fresh object each render and cannot honestly go in a dependency array; the
    alternatives are a ref written during render, which React now rejects, or a
    suppressed dependency check. What is lost is one client-side `Array.filter`
    per render over a collection each page has already fetched whole, which is
    work these pages redo on every keystroke in their own search box anyway.
  */
  const matches = (row: T): boolean => {
    if (!applies || urlId == null || declared == null) return true;
    if (typeof declared === 'function') return declared(row) === urlId;
    if (declared.matches) return declared.matches(row, urlId);
    // No accessor of either kind: the page narrowed this role server-side, so
    // every row it was handed is already a match.
    if (!declared.match) return true;
    return declared.match(row) === urlId;
  };

  const filtered = rows ? rows.filter((row) => matches(row)) : [];

  const chipEnabled =
    declared != null &&
    (typeof declared === 'function' || declared.chip !== false);

  const chip =
    applies && chipEnabled && role != null && name != null
      ? {
          // `Object.hasOwn` for the same reason as above: a slug that happens
          // to name something on `Object.prototype` would otherwise be labelled
          // with a function, which React refuses to render.
          label: Object.hasOwn(ROLE_LABELS, role)
            ? ROLE_LABELS[role]
            : 'Filtered by',
          name,
          onDismiss: clear,
        }
      : null;

  return { employeeId, role, name, matches, filtered, chip, clear };
}

/**
 * Joins the filter params onto a base href with whichever separator the base
 * needs. Most list routes are a bare path, but the attendance history is one
 * page holding two tabs, so its links already carry a `?tab=` the filter has to
 * sit beside rather than overwrite.
 */
function withFilterParams(baseHref: string, params: string): string {
  return `${baseHref}${baseHref.includes('?') ? '&' : '?'}${params}`;
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
  return withFilterParams(baseHref, `employeeId=${id}&role=${role}`);
}

/**
 * Builds a list-page href that filters to one **user** in one role, for the
 * `*By` fields the backend stamps from the session rather than from an
 * employee picker. The chip then names the user from the stamps its own rows
 * carry, or words the filter as `User #<id>`, instead of resolving the id
 * through the employee lookup, which is keyed by a different table's sequence
 * and would name whichever employee happens to hold the same number.
 */
export function userFilterHref(
  baseHref: string,
  id: number,
  role: string
): string {
  return withFilterParams(baseHref, `userId=${id}&role=${role}`);
}
