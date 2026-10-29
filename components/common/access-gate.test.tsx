/**
 * The page-level gate that mirrors a backend `@PreAuthorize` (echno-backend
 * #853): nothing while the employee record loads, the page for a reader who
 * holds a named org role (or, for a gate on the access matrix, the named
 * permission), and the same "Access Denied" notice the finance pages show
 * for everyone else.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import type { CurrentUserAccess } from '@tornotron/echno-core/access/types';
import { PROJECT_WRITE_ACCESS, type AccessConfig } from '@/nav/access/roles';

/** A gate on the access matrix, as the backend's @access.can('assets', 'create'). */
const CREATE_ASSETS: AccessConfig = { matrixPermission: 'assets:create' };

let employeeState: {
  orgRoles: string[];
  isLoading: boolean;
  error: unknown;
  employee: unknown;
} = { orgRoles: [], isLoading: false, error: null, employee: undefined };

import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useEmployeeRoles: () => employeeState,
}));

let accessState: {
  access: CurrentUserAccess | undefined;
  isLoading: boolean;
} = { access: undefined, isLoading: false };

import * as realAccessHooks from '@tornotron/echno-core/access/hooks';

mock.module('@tornotron/echno-core/access/hooks', () => ({
  ...realAccessHooks,
  useCurrentUserAccess: () => ({
    ...accessState,
    can: () => false,
    error: null,
  }),
}));

const { AccessGate } = await import('./access-gate');

function page(config: AccessConfig = PROJECT_WRITE_ACCESS) {
  return render(
    <AccessGate
      config={config}
      subject="raise issues"
      allowed="system administrators and project managers"
      backHref="/users/dashboard/projects"
      backLabel="Back to Projects"
    >
      <p>the page</p>
    </AccessGate>
  );
}

afterEach(() => {
  cleanup();
  employeeState = {
    orgRoles: [],
    isLoading: false,
    error: null,
    employee: undefined,
  };
  accessState = { access: undefined, isLoading: false };
});

describe('AccessGate', () => {
  test('renders the page for a holder of a named role', () => {
    employeeState = { ...employeeState, orgRoles: [OrgRole.PROJECT_MANAGER] };
    const view = page();
    expect(view.container.textContent).toBe('the page');
  });

  test('refuses a plain member with the notice and a way back', () => {
    employeeState = { ...employeeState, orgRoles: [OrgRole.LABORER] };
    const view = page();
    const text = view.container.textContent ?? '';
    expect(text).toContain('Access Denied');
    expect(text).toContain('raise issues');
    expect(text).toContain('system administrators and project managers');
    expect(text).not.toContain('the page');
    const back = view.getByText('Back to Projects').closest('a');
    expect(back?.getAttribute('href')).toBe('/users/dashboard/projects');
  });

  test('refuses a role the coarse tier would have admitted', () => {
    employeeState = { ...employeeState, orgRoles: [OrgRole.DIRECTOR] };
    expect(page().container.textContent).toContain('Access Denied');
  });

  test('renders nothing while the roles are loading', () => {
    employeeState = { ...employeeState, isLoading: true };
    expect(page().container.textContent).toBe('');
  });

  test('renders the page for a holder of the matrix permission, whatever their roles', () => {
    accessState = {
      access: {
        organizationId: 5,
        employeeId: 42,
        grants: { 'assets:create': ['ALL'] },
      },
      isLoading: false,
    };
    expect(page(CREATE_ASSETS).container.textContent).toBe('the page');
  });

  test('refuses the old role holder a matrix gate when they lack the permission', () => {
    employeeState = { ...employeeState, orgRoles: [OrgRole.PROJECT_MANAGER] };
    accessState = {
      access: {
        organizationId: 5,
        employeeId: 42,
        grants: { 'assets:view': ['ALL'] },
      },
      isLoading: false,
    };
    expect(page(CREATE_ASSETS).container.textContent).toContain(
      'Access Denied'
    );
  });

  test('renders nothing while the access is loading for a matrix gate', () => {
    accessState = { access: undefined, isLoading: true };
    expect(page(CREATE_ASSETS).container.textContent).toBe('');
  });

  test('a role gate does not wait for the access matrix', () => {
    employeeState = { ...employeeState, orgRoles: [OrgRole.PROJECT_MANAGER] };
    accessState = { access: undefined, isLoading: true };
    expect(page().container.textContent).toBe('the page');
  });
});
