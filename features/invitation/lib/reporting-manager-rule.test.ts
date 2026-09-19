/**
 * A newly created employee must have a reporting manager (ClickUp 14zdkkvrf25,
 * web #469). These pin the form's side of the rule: when the field is required,
 * when the first-employee exemption applies, and how the backend's refusal is
 * turned into a field error. Each of the "required" cases fails on the previous
 * form, which sent `undefined` and let the request go.
 */
import { describe, expect, test } from 'bun:test';
import { ApiError } from '@tornotron/echno-core';
import type { EmployeeLookup } from '@tornotron/echno-core/employee/types';
import {
  MANAGER_REQUIRED_MESSAGE,
  managerFieldErrorFrom,
  managerRequirement,
  resolveManagerId,
} from './reporting-manager-rule';

const lookup = (id: number, status: string): EmployeeLookup =>
  ({ id, employeeId: `E${id}`, name: `Person ${id}`, designation: 'Engineer', status, organizationId: 1 }) as unknown as EmployeeLookup;

describe('managerRequirement', () => {
  test('is required once the organization has an active employee', () => {
    expect(managerRequirement([lookup(1, 'active')])).toBe('required');
  });

  test('is exempt for the first employee of an organization', () => {
    expect(managerRequirement([])).toBe('exempt');
  });

  test('only active employees count, as on the backend', () => {
    expect(managerRequirement([lookup(1, 'terminated'), lookup(2, 'resigned')])).toBe('exempt');
  });

  test('is required while the list is still unknown, so nothing slips through', () => {
    expect(managerRequirement(undefined)).toBe('unknown');
    expect(resolveManagerId('', 'unknown')).toEqual({ error: MANAGER_REQUIRED_MESSAGE });
  });
});

describe('resolveManagerId', () => {
  test('refuses an empty selection when a manager is required', () => {
    expect(resolveManagerId('', 'required')).toEqual({ error: MANAGER_REQUIRED_MESSAGE });
  });

  test('passes the chosen manager through', () => {
    expect(resolveManagerId('5', 'required')).toEqual({ managerId: 5 });
  });

  test('spells the first-employee case as an explicit null', () => {
    expect(resolveManagerId('', 'exempt')).toEqual({ managerId: null });
  });

  test('ignores a stale selection once the organization is exempt', () => {
    expect(resolveManagerId('5', 'exempt')).toEqual({ managerId: null });
  });
});

describe('managerFieldErrorFrom', () => {
  test('turns the backend refusal into the field error', () => {
    const error = new ApiError(
      'managerId is required: a new employee must have a reporting manager',
      400
    );
    expect(managerFieldErrorFrom(error)).toBe(MANAGER_REQUIRED_MESSAGE);
  });

  test('leaves any other error to the usual handling', () => {
    expect(managerFieldErrorFrom(new ApiError('Organization not found', 404))).toBeNull();
    expect(managerFieldErrorFrom(new Error('network'))).toBeNull();
  });
});
