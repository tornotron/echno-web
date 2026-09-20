/**
 * The page-level gate that mirrors a backend `@PreAuthorize` (echno-backend
 * #853): nothing while the employee record loads, the page for a reader who
 * holds a named org role, and the same "Access Denied" notice the finance
 * pages show for everyone else.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import { PROJECT_WRITE_ACCESS } from '@/nav/access/roles';

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

const { AccessGate } = await import('./access-gate');

function page() {
  return render(
    <AccessGate
      config={PROJECT_WRITE_ACCESS}
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
});
