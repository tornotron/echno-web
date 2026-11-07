import { describe, expect, test } from 'bun:test';
import nextConfig from '../../next.config';
import { routes } from '../index';
import { financeMetadata } from './finance.meta';
import { inspectionsMetadata } from './inspections.meta';

/**
 * Billing moved from Finance to Inspections. It stays hidden for an
 * organization without the Work Progress module, and links to the old paths
 * keep working.
 */
describe('billing lives under Inspections', () => {
  test('the entry is in the Inspections metadata and gone from Finance', () => {
    expect(inspectionsMetadata['inspections-billing'].moduleId).toBe(
      'work-progress'
    );
    expect(Object.keys(financeMetadata).join(',')).not.toContain('billing');
    expect(financeMetadata['finance-payables']).toBeDefined();
  });

  test('routes point at the new paths', () => {
    expect(routes.inspections.billing.href).toBe(
      '/users/dashboard/inspections/billing'
    );
    expect(routes.inspections.billing.bills.detail('b1').href).toBe(
      '/users/dashboard/inspections/billing/bills/b1'
    );
    expect(routes.inspections.billing.contracts.detail(7).href).toBe(
      '/users/dashboard/inspections/billing/contracts/7'
    );
  });

  test('old links redirect permanently, before the legacy prefix rule', async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const index = redirects.findIndex(
      (r) => r.source === '/users/dashboard/finance/billing/:path*'
    );
    expect(index).toBeGreaterThanOrEqual(0);
    expect(redirects[index]).toMatchObject({
      destination: '/users/dashboard/inspections/billing/:path*',
      permanent: true,
    });
    const legacy = redirects.findIndex((r) => r.source === '/dashboard/:path*');
    expect(index).toBeLessThan(legacy);
  });
});
