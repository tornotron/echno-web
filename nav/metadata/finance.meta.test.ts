import { describe, expect, test } from 'bun:test';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import { financeMetadata } from './finance.meta';

/**
 * Each finance menu item names the roles its list endpoint admits, so a role
 * the backend refuses sees the item locked instead of opening a page that can
 * only fail with a 403.
 */
describe('finance menu items follow their list endpoint gate', () => {
  const pair = [OrgRole.SYSTEM_ADMIN, OrgRole.PROJECT_MANAGER];
  const rows: [keyof typeof financeMetadata, string, string[]][] = [
    ['finance-payments', '/finance/construction-payments/web', pair],
    ['finance-customer-invoices', '/finance/invoices/web', pair],
    ['finance-budgets', '/finance/projects/{id}/cost-control/web', pair],
    ['finance-chart-of-accounts', '/finance/accounts/web', pair],
    ['finance-journal-entries', '/finance/journal-entries/web', pair],
    ['finance-cost-categories', '/finance/cost-categories/web', pair],
    ['finance-settings', '/finance/settings/web', pair],
    ['finance-payables', '/payables/web', [OrgRole.SYSTEM_ADMIN]],
  ];

  for (const [key, endpoint, roles] of rows) {
    test(`${key} matches ${endpoint}`, () => {
      const access = (
        financeMetadata[key] as { access?: { allowOrgRoles?: string[] } }
      ).access;
      expect(access?.allowOrgRoles).toEqual(roles);
    });
  }
});
