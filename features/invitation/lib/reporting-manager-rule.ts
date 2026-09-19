/**
 * The reporting-manager rule of the New Employee (invitation) form.
 *
 * A newly created employee must have a reporting manager (ClickUp 14zdkkvrf25,
 * backend #823). The form demands one before it submits, so the administrator
 * is told at the field rather than by a failed request. The backend exempts
 * exactly one case, the first employee of an organization that has no active
 * employee yet; the form mirrors that by hiding the field with a note when the
 * organization's active employee count is zero. Editing an existing employee
 * keeps the manager optional and is not touched by this rule.
 */

import { ApiError } from '@tornotron/echno-core';
import type { EmployeeLookup } from '@tornotron/echno-core/employee/types';

export type ManagerRequirement =
  /** The organization has active employees: a manager must be chosen. */
  | 'required'
  /** No active employee yet: this is the first employee, nobody to report to. */
  | 'exempt'
  /** The employee list has not loaded; treat as required so nothing slips through. */
  | 'unknown';

/** What the backend says when a create arrives without a manager. */
const MANAGER_REQUIRED_MARKER = 'managerId is required';

export const MANAGER_REQUIRED_MESSAGE = 'Choose a reporting manager';

export const FIRST_EMPLOYEE_NOTE =
  'This organization has no active employee yet, so this will be its first employee and has nobody to report to. A reporting manager can be assigned later from the Employees page.';

/**
 * Decides whether the manager field is required from the organization's
 * employee list. Only active employees count, which is the same test the
 * backend applies.
 */
export function managerRequirement(
  employees: EmployeeLookup[] | undefined
): ManagerRequirement {
  if (employees === undefined) return 'unknown';
  return employees.some((e) => e.status === 'active') ? 'required' : 'exempt';
}

/**
 * Resolves the form's manager selection into the request value.
 *
 * Returns the chosen id, `null` when the organization is exempt (the request
 * type spells the first-employee case as an explicit `null`), or an error
 * message when a manager is required and none was chosen.
 */
export function resolveManagerId(
  selected: string,
  requirement: ManagerRequirement
): { managerId: number | null } | { error: string } {
  if (selected) {
    const id = Number.parseInt(selected, 10);
    if (Number.isInteger(id) && id > 0) return { managerId: id };
  }
  if (requirement === 'exempt') return { managerId: null };
  return { error: MANAGER_REQUIRED_MESSAGE };
}

/**
 * Reads the backend's refusal of a missing manager out of a failed request so
 * it can be shown on the field rather than as a generic toast. Any other error
 * returns `null` and keeps its usual handling.
 */
export function managerFieldErrorFrom(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.status !== 400) return null;
  const text = `${error.message ?? ''} ${error.details ?? ''}`;
  return text.includes(MANAGER_REQUIRED_MARKER) ? MANAGER_REQUIRED_MESSAGE : null;
}
