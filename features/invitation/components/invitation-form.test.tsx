/**
 * The invitation form. Pinned: a role with an old counterpart offers no
 * project and says why, while one without offers a project picker; what the
 * form sends; the email and reporting-manager rules; and the note when the
 * role list does not answer. Every module replaced here is put back when the
 * file ends, because `mock.module` is process-wide.
 *
 * Assertions are on strings, counts and booleans, never on a rendered node: an
 * assertion that fails while printing a Radix node hangs the reporter.
 */
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from 'bun:test';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import * as realNavigation from 'next/navigation';
import * as realAccessHooks from '@tornotron/echno-core/access/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import * as realShiftHooks from '@tornotron/echno-core/shift-timing/hooks';
import * as realInvitationHooks from '@tornotron/echno-core/member-invitations/hooks';
import * as realToastStyles from '@/lib/styles/toast-styles';
import type { AccessRole } from '@tornotron/echno-core/access/types';
import type {
  CreateMemberInvitationRequest,
  MemberInvitation,
} from '@tornotron/echno-core/member-invitations/types';

// Copied now: a namespace object is live, so a mocked module reads as the mock.
const originals = {
  navigation: { ...realNavigation },
  access: { ...realAccessHooks },
  project: { ...realProjectHooks },
  employee: { ...realEmployeeHooks },
  shift: { ...realShiftHooks },
  invitation: { ...realInvitationHooks },
  toast: { ...realToastStyles },
};

const role = (
  slug: string,
  name: string,
  extra: Partial<AccessRole> = {}
): AccessRole => ({
  id: `id-${slug}`,
  slug,
  name,
  system: false,
  baseline: false,
  grants: [],
  memberIds: [],
  grantableRoleIds: [],
  ...extra,
});

const ROLES = [
  role('employee', 'Employee', { baseline: true, system: true }),
  role('site-engineer', 'Site Engineer'),
  role('management-director', 'Management Director'),
];

let rolesResult: { data?: AccessRole[]; isLoading: boolean; isError: boolean };
let activeEmployees: Array<{ id: number; status: string }>;
const sent: CreateMemberInvitationRequest[] = [];
const pushed: string[] = [];

mock.module('next/navigation', () => ({
  ...originals.navigation,
  useRouter: () => ({
    push: (href: string) => pushed.push(href),
    replace: () => {},
  }),
}));
mock.module('@tornotron/echno-core/access/hooks', () => ({
  ...originals.access,
  useAccessRoles: () => rolesResult,
}));
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...originals.project,
  useProjects: () => ({
    data: [{ id: 7, projectName: 'Tower A' }],
    isLoading: false,
  }),
}));
mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...originals.employee,
  useManagers: () => ({ data: [], isLoading: false }),
  useEmployeeLookup: () => ({ data: activeEmployees }),
}));
mock.module('@tornotron/echno-core/shift-timing/hooks', () => ({
  ...originals.shift,
  useShifts: () => ({ data: [] }),
}));
mock.module('@tornotron/echno-core/member-invitations/hooks', () => ({
  ...originals.invitation,
  useCreateMemberInvitation: () => ({
    isPending: false,
    mutate: (
      request: CreateMemberInvitationRequest,
      options?: { onSuccess?: (i: MemberInvitation) => unknown }
    ) => {
      sent.push(request);
      options?.onSuccess?.({
        id: 'inv-1',
        email: request.email,
        status: 'PENDING',
        roles: request.roles,
        employee: { status: 'active' },
      });
    },
  }),
}));
mock.module('@/lib/styles/toast-styles', () => ({
  toast: { success: () => {}, error: () => {} },
}));

const { InvitationForm, ROLES_UNAVAILABLE_NOTE } =
  await import('./invitation-form');
const { ORGANIZATION_WIDE_NOTE } = await import('../lib/role-project-rule');
const { routes } = await import('@/nav');

afterAll(() => {
  mock.module('next/navigation', () => originals.navigation);
  mock.module('@tornotron/echno-core/access/hooks', () => originals.access);
  mock.module('@tornotron/echno-core/project/hooks', () => originals.project);
  mock.module('@tornotron/echno-core/employee/hooks', () => originals.employee);
  mock.module(
    '@tornotron/echno-core/shift-timing/hooks',
    () => originals.shift
  );
  mock.module(
    '@tornotron/echno-core/member-invitations/hooks',
    () => originals.invitation
  );
  mock.module('@/lib/styles/toast-styles', () => originals.toast);
});

function renderForm() {
  const client = new QueryClient();
  render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(InvitationForm)
    )
  );
}

const q = (selector: string) => document.querySelector(selector);
const tick = (slug: string) =>
  act(async () => {
    fireEvent.click(q(`#role-id-${slug}`) as HTMLElement);
  });
const typeEmail = (value: string) =>
  fireEvent.change(q('#email') as HTMLInputElement, { target: { value } });
const submit = () =>
  act(async () => {
    fireEvent.click(q('button[type="submit"]') as HTMLButtonElement);
  });

beforeEach(() => {
  rolesResult = { data: ROLES, isLoading: false, isError: false };
  // No active employee: the first-employee exemption, so no manager is needed.
  activeEmployees = [];
  sent.length = 0;
  pushed.length = 0;
});

afterEach(() => cleanup());

describe('InvitationForm roles', () => {
  test("offers the organization's roles, without the baseline one", () => {
    renderForm();
    expect(q('[data-testid="role-site-engineer"]') !== null).toBe(true);
    expect(q('[data-testid="role-management-director"]') !== null).toBe(true);
    expect(q('[data-testid="role-employee"]') === null).toBe(true);
  });

  test('a role with an old counterpart offers no project and says why', async () => {
    renderForm();
    await tick('site-engineer');
    expect(q('[data-testid="role-project-site-engineer"]') === null).toBe(true);
    expect(q('[data-testid="role-org-wide-site-engineer"]')?.textContent).toBe(
      ORGANIZATION_WIDE_NOTE
    );
  });

  test('a role without one offers a project, across the organization by default', async () => {
    renderForm();
    await tick('management-director');
    const picker = q('[data-testid="role-project-management-director"]');
    expect(picker !== null).toBe(true);
    expect(picker?.textContent).toContain('Across the organization');
    expect(
      q('[data-testid="role-org-wide-management-director"]') === null
    ).toBe(true);
  });

  test('an unticked role shows neither', () => {
    renderForm();
    expect(q('[data-testid="role-project-management-director"]') === null).toBe(
      true
    );
    expect(q('[data-testid="role-org-wide-site-engineer"]') === null).toBe(
      true
    );
  });

  test('when the role list does not answer, says what an invitation then gives', () => {
    rolesResult = { data: undefined, isLoading: false, isError: true };
    renderForm();
    expect(q('[data-testid="roles-unavailable"]')?.textContent).toBe(
      ROLES_UNAVAILABLE_NOTE
    );
  });
});

describe('InvitationForm submit', () => {
  test('sends the address and the ticked roles, then opens the invitation', async () => {
    renderForm();
    typeEmail('  new.person@company.test ');
    await tick('site-engineer');
    await tick('management-director');
    await submit();

    expect(sent.length).toBe(1);
    expect(sent[0].email).toBe('new.person@company.test');
    expect(sent[0].roles).toEqual([
      { roleId: 'id-site-engineer' },
      { roleId: 'id-management-director' },
    ]);
    expect(sent[0].employee.managerId).toBeUndefined();
    expect(pushed).toEqual([
      routes.workforce.employees.invitations.detail('inv-1').href,
    ]);
  });

  test('a role ticked and then unticked is not sent', async () => {
    renderForm();
    typeEmail('new.person@company.test');
    await tick('site-engineer');
    await tick('site-engineer');
    await submit();
    expect(sent[0].roles).toEqual([]);
  });

  test('refuses to send without an email address', async () => {
    renderForm();
    await submit();
    expect(sent.length).toBe(0);
    expect(q('#email-error')?.textContent).toBe(
      'Enter the email address the invitation goes to'
    );
  });

  test('asks for a reporting manager once the organization has an active employee', async () => {
    activeEmployees = [{ id: 1, status: 'active' }];
    renderForm();
    typeEmail('new.person@company.test');
    await submit();
    expect(sent.length).toBe(0);
    expect(q('#managerId-error')?.textContent).toBe(
      'Choose a reporting manager'
    );
    expect(q('[data-testid="first-employee-note"]') === null).toBe(true);
  });

  test("the organization's first employee needs no manager", () => {
    renderForm();
    expect(q('[data-testid="first-employee-note"]') !== null).toBe(true);
  });
});
