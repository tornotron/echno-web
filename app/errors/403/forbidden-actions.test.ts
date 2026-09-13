/**
 * The 403 page's upgrade path (#448, #456): only a module denial gets the
 * "Upgrade plan" action, pointing at the billing page with the module's
 * feature key so the plan picker highlights the right plan, and only for a
 * reader who can act on it. A non-admin is told to ask an administrator.
 */
import { describe, expect, test } from 'bun:test';
import { forbiddenActions, forbiddenAdvice } from './forbidden-actions';

describe('forbiddenActions', () => {
  test('a module denial offers a system admin the upgrade path with the module feature key', () => {
    const actions = forbiddenActions({ reason: 'module', module: 'inspections' }, true);
    expect(actions?.[0].label).toBe('Upgrade plan');
    expect(actions?.[0].href).toBe('/users/dashboard/settings/billing?feature=MODULE_INSPECTIONS#plans');
    expect(forbiddenAdvice({ reason: 'module' }, true)).toContain('upgrade the plan from Billing');
  });

  test('a module denial without a module id still offers the plan picker', () => {
    expect(forbiddenActions({ reason: 'module' }, true)?.[0].href).toBe('/users/dashboard/settings/billing#plans');
  });

  test('a non-admin gets no upgrade link and is told to ask an administrator (#456)', () => {
    const actions = forbiddenActions({ reason: 'module', module: 'inspections' }, false);
    expect(actions?.map((a) => a.label)).toEqual(['Go to Dashboard']);
    expect(actions?.some((a) => a.href.includes('/settings/billing'))).toBe(false);
    expect(forbiddenAdvice({ reason: 'module' }, false)).toContain('Ask your administrator to upgrade');
  });

  test('other reasons keep the default actions whoever is reading', () => {
    for (const canUpgrade of [true, false]) {
      expect(forbiddenActions({}, canUpgrade)).toBeUndefined();
      expect(forbiddenActions({ reason: 'role' }, canUpgrade)).toBeUndefined();
      expect(forbiddenActions({ module: 'inspections' }, canUpgrade)).toBeUndefined();
      expect(forbiddenAdvice({ reason: 'role' }, canUpgrade)).toContain('Contact your system administrator');
    }
  });
});
