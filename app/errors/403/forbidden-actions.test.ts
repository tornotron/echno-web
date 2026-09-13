/**
 * The 403 page's upgrade path (#448): only a module denial gets the
 * "Upgrade plan" action, pointing at the billing page with the module's
 * feature key so the plan picker highlights the right plan.
 */
import { describe, expect, test } from 'bun:test';
import { forbiddenActions } from './page';

describe('forbiddenActions', () => {
  test('a module denial offers the upgrade path with the module feature key', () => {
    const actions = forbiddenActions({ reason: 'module', module: 'inspections' });
    expect(actions?.[0].label).toBe('Upgrade plan');
    expect(actions?.[0].href).toBe('/users/dashboard/settings/billing?feature=MODULE_INSPECTIONS#plans');
  });

  test('a module denial without a module id still offers the plan picker', () => {
    expect(forbiddenActions({ reason: 'module' })?.[0].href).toBe('/users/dashboard/settings/billing#plans');
  });

  test('other reasons keep the default actions', () => {
    expect(forbiddenActions({})).toBeUndefined();
    expect(forbiddenActions({ reason: 'role' })).toBeUndefined();
    expect(forbiddenActions({ module: 'inspections' })).toBeUndefined();
  });
});
