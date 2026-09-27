/**
 * echno-web #502: a brand-new organization's Home dashboard showed invented
 * revenue ("₹620K, +5.1% from last month"), populated budget and margin
 * charts, and an expense legend in dollars. Every widget now reads the
 * organization's own records, so with nothing on record each one shows an
 * empty state or a real zero.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realTaskHooks from '@tornotron/echno-core/task/hooks';
import * as realIssueHooks from '@tornotron/echno-core/issue/hooks';
import * as realFinanceHooks from '@tornotron/echno-core/finance/hooks';
import * as realLeaveHooks from '@tornotron/echno-core/leave/hooks';
import * as realMaterialsHooks from '@tornotron/echno-core/materials/hooks';

const ok = <T,>(data: T) => ({
  data,
  isLoading: false,
  isError: false,
  error: null,
});

let orgRoles: string[] = [OrgRole.SYSTEM_ADMIN];
let projectsResult: unknown = ok([]);
const emptyPnl = {
  income: [],
  expense: [],
  totalIncome: 0,
  totalExpense: 0,
  netProfit: 0,
};

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useEmployeeLookup: () => ok([]),
  useEmployeeRoles: () => ({
    orgRoles,
    isLoading: false,
    error: null,
    employee: undefined,
  }),
}));
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => projectsResult,
}));
mock.module('@tornotron/echno-core/task/hooks', () => ({
  ...realTaskHooks,
  useTasks: () => ok([]),
}));
mock.module('@tornotron/echno-core/issue/hooks', () => ({
  ...realIssueHooks,
  useIssues: () => ok([]),
}));
mock.module('@tornotron/echno-core/finance/hooks', () => ({
  ...realFinanceHooks,
  useProfitAndLoss: () => ok(emptyPnl),
}));
mock.module('@tornotron/echno-core/leave/hooks', () => ({
  ...realLeaveHooks,
  useOrganizationRequests: () => ok([]),
}));
mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialsHooks,
  useMaterialStockSummary: () =>
    ok({
      materialCount: 0,
      totalStockValue: 0,
      distinctUnits: 0,
      unvaluedHoldingCount: 0,
    }),
  useLowStockMaterials: () =>
    ok({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 1 }),
}));

const { HomeDashboard } = await import('./home-dashboard');
const { FinanceSection, InventorySection, LeaveSection } =
  await import('./gated-sections');

afterEach(() => {
  cleanup();
  orgRoles = [OrgRole.SYSTEM_ADMIN];
  projectsResult = ok([]);
});

/** Sample figures the old mock-backed dashboard printed. */
const FABRICATED = ['620', '5.1%', '$', '580K', '390K', 'value value'];

function expectNoFabricatedFigures(text: string) {
  for (const figure of FABRICATED) expect(text).not.toContain(figure);
}

describe('Home dashboard for a new organization', () => {
  test('headline counts are zero and income is ₹0', () => {
    const view = render(<HomeDashboard />);
    const text = view.container.textContent ?? '';

    expect(view.getByTestId('income-figure').textContent).toBe('₹0');
    expect(text).toContain('none recorded this month');
    expectNoFabricatedFigures(text);
  });

  test('the project widgets show empty states', () => {
    const view = render(<HomeDashboard />);
    expect(view.getAllByText('No projects yet').length).toBe(2);
    expect(view.getAllByTestId('widget-empty').length).toBeGreaterThan(0);
  });

  test('the finance widgets show empty states in rupees', () => {
    const view = render(<FinanceSection />);
    const text = view.container.textContent ?? '';
    expect(text).toContain('No finance activity yet');
    expect(text).toContain('No expenses yet');
    expect(text).toContain('(₹)');
    expect(text).not.toContain('Department Budget');
    expect(text).not.toContain('Profit Margin Trend');
    expectNoFabricatedFigures(text);
  });

  test('the leave and inventory widgets show empty states', () => {
    const leave = render(<LeaveSection />);
    expect(leave.container.textContent).toContain('No leave requests yet');
    expect(leave.container.textContent).toContain('No approved leave yet');
    cleanup();

    const inventory = render(<InventorySection />);
    expect(inventory.container.textContent).toContain('No materials yet');
  });

  test('a reader outside the finance roles sees no income card', () => {
    orgRoles = [OrgRole.LABORER];
    const view = render(<HomeDashboard />);
    expect(view.queryByTestId('income-figure')).toBeNull();
    expect(view.queryByText('Finance')).toBeNull();
    expect(view.queryByText('Leave')).toBeNull();
    expect(view.queryByText('Inventory')).toBeNull();
  });

  test('a failed request shows an error, never an empty state or a zero', () => {
    projectsResult = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('500'),
    };
    const view = render(<HomeDashboard />);
    const text = view.container.textContent ?? '';
    expect(text).toContain('Could not load projects');
    expect(text).toContain('could not load');
    expect(view.queryByText('No projects yet')).toBeNull();
  });
});
