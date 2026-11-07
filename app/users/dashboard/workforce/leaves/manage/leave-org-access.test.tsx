/**
 * The organization-wide leave views are `system-admin` or `hr-admin` on the
 * backend. Anyone else used to open an empty calendar, or fire a request that
 * could only be refused, and HR admins were kept from what they may read.
 */
import { afterAll, afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import * as realLeaveServices from '@tornotron/echno-core/leave/services';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import * as realLeaveHooks from '@tornotron/echno-core/leave/hooks';
import * as realUserHooks from '@tornotron/echno-core/user/hooks';
import * as realNavigation from 'next/navigation';
import * as useCanModule from '@/hooks/use-can';
import * as useLeaveRoleModule from '@/hooks/leave/use-leave-role';
import { can } from '@/nav/access/evaluate';
import type { AccessConfig } from '@/nav/access/roles';

let orgRoles: OrgRole[] = [];
const orgCalendarIds: number[] = [];
const deptCalendarIds: number[] = [];
const empty = { data: [], isLoading: false };

mock.module('next/navigation', () => ({
  ...realNavigation,
  useRouter: () => ({ push: () => {}, replace: () => {} }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/users/dashboard/workforce/leaves/manage',
}));
mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useCurrentUserEmployee: () => ({
    data: { id: 1, organizationId: 7 },
    isLoading: false,
  }),
  useEmployeeRoles: () => ({
    orgRoles,
    isLoading: false,
    error: null,
    employee: { id: 1 },
  }),
}));
// Module mocks outlive this file, and other suites need these two as they were.
const savedUseCan = { ...useCanModule };
const savedUseLeaveRole = { ...useLeaveRoleModule };
const savedLeaveServices = { ...realLeaveServices };
const savedModules = {
  'next/navigation': { ...realNavigation },
  '@tornotron/echno-core/employee/hooks': { ...realEmployeeHooks },
  '@tornotron/echno-core/leave/hooks': { ...realLeaveHooks },
  '@tornotron/echno-core/user/hooks': { ...realUserHooks },
};
afterAll(() => {
  for (const [name, saved] of Object.entries(savedModules)) {
    mock.module(name, () => saved);
  }
  mock.module('@tornotron/echno-core/leave/services', () => savedLeaveServices);
  mock.module('@/hooks/use-can', () => savedUseCan);
  mock.module('@/hooks/leave/use-leave-role', () => savedUseLeaveRole);
});

mock.module('@/hooks/use-can', () => ({
  useCan: (config: AccessConfig) => ({
    allowed: can(config, orgRoles),
    isLoading: false,
  }),
}));
mock.module('@/hooks/leave/use-leave-role', () => ({
  useLeaveRole: () => ({ canApprove: false, isLoading: false }),
}));
// Declared here, not spied on the real service: other suites replace that
// module, and a spy on whatever they left behind fails depending on file order.
const getOrganizationRequests = mock(async (): Promise<unknown[]> => []);
mock.module('@tornotron/echno-core/leave/services', () => ({
  ...realLeaveServices,
  leaveService: { getOrganizationRequests },
}));
mock.module('@tornotron/echno-core/user/hooks', () => ({
  ...realUserHooks,
  useUser: () => ({ data: { defaultOrganizationId: 7 } }),
}));
mock.module('@tornotron/echno-core/leave/hooks', () => ({
  ...realLeaveHooks,
  useOrganizationCalendar: (organizationId: number) => {
    orgCalendarIds.push(organizationId);
    return empty;
  },
  useDepartmentCalendar: (organizationId: number) => {
    deptCalendarIds.push(organizationId);
    return empty;
  },
  useTeamCalendar: () => empty,
  useAllLeavePolicies: () => empty,
  useEmployeeRequests: () => empty,
  usePendingApprovalsCount: () => ({ data: 0 }),
}));
mock.module('@/features/leave/components/leave-policies-manager', () => ({
  LeavePoliciesManager: () => <p>policies manager</p>,
}));
mock.module('@/features/leave/components/leave-requests-tabs', () => ({
  MyRequestsTab: () => null,
  ApprovalsTab: () => null,
  AllRequestsTab: () => null,
}));

const VIEW_TABS = new Set(['Month', 'Week', 'Day']);

/** The calendar's own Month, Week and Day switch is not the point here. */
function scopeTabs(tabs: HTMLElement[]) {
  return tabs.filter((tab) => !VIEW_TABS.has(tab.textContent ?? ''));
}

const { default: CalendarPage } = await import('./calendar/page');
const { default: PoliciesPage } = await import('./policies/page');
const { default: RequestsPage } = await import('./requests/page');

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => {
  cleanup();
  orgRoles = [];
  getOrganizationRequests.mockClear();
  orgCalendarIds.length = 0;
  deptCalendarIds.length = 0;
});

describe('leave calendar', () => {
  test('a project manager gets My Team alone and no refused request', () => {
    orgRoles = [OrgRole.PROJECT_MANAGER];
    const { getAllByRole, queryByText } = render(<CalendarPage />, { wrapper });
    const tabs = scopeTabs(getAllByRole('tab'));
    expect(tabs.map((tab) => tab.textContent)).toEqual(['My Team']);
    expect(tabs[0]!.dataset.state).toBe('active');
    expect(queryByText('Organisation')).toBeNull();
    expect(orgCalendarIds.every((id) => id === 0)).toBe(true);
    expect(deptCalendarIds.every((id) => id === 0)).toBe(true);
  });

  test('an HR admin gets all three tabs, on Organization, with the real org', () => {
    orgRoles = [OrgRole.HR_ADMIN];
    const { getAllByRole } = render(<CalendarPage />, { wrapper });
    const tabs = scopeTabs(getAllByRole('tab'));
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Organization',
      'My Team',
      'By Department',
    ]);
    expect(tabs[0]!.dataset.state).toBe('active');
    expect(orgCalendarIds).toContain(7);
  });
});

describe('leave policies', () => {
  test('an HR admin reaches the manager', () => {
    orgRoles = [OrgRole.HR_ADMIN];
    const { getByText } = render(<PoliciesPage />, { wrapper });
    expect(getByText('policies manager')).toBeInTheDocument();
  });

  test('a director is told no, as the API would', () => {
    orgRoles = [OrgRole.DIRECTOR];
    const { getByText, queryByText } = render(<PoliciesPage />, { wrapper });
    expect(getByText('Access Denied')).toBeInTheDocument();
    expect(queryByText('policies manager')).toBeNull();
  });
});

describe('leave requests', () => {
  test('nobody outside the gate calls the organization endpoint', async () => {
    orgRoles = [OrgRole.PROJECT_MANAGER];
    const { queryByText } = render(<RequestsPage />, { wrapper });
    expect(queryByText('All Requests')).toBeNull();
    expect(getOrganizationRequests).not.toHaveBeenCalled();
  });

  test('an HR admin gets All Requests and the organization figures', async () => {
    orgRoles = [OrgRole.HR_ADMIN];
    const { getByText } = render(<RequestsPage />, { wrapper });
    expect(getByText('All Requests')).toBeInTheDocument();
    await waitFor(() => expect(getOrganizationRequests).toHaveBeenCalled());
  });
});
