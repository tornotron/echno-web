import { describe, expect, test } from 'bun:test';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import { miscMetadata } from './misc.meta';
import { BILLING_ACCESS } from '../access/roles';
import { canAccess } from '../access/evaluate';

/**
 * Pins the billing gate (echno-web #456): the backend serves billing to
 * `system-admin` only, so the nav entry must carry that org-role gate and a
 * director (admin tier) or plain member must not be offered the link.
 */
describe('settings-billing access', () => {
  test('carries BILLING_ACCESS, which names system-admin exactly', () => {
    expect(miscMetadata['settings-billing'].access).toBe(BILLING_ACCESS);
    expect(miscMetadata['settings-billing'].hideWhenLocked).toBe(true);
    expect(BILLING_ACCESS.allowOrgRoles).toEqual([OrgRole.SYSTEM_ADMIN]);
    expect(BILLING_ACCESS.allowRoles).toBeUndefined();
  });

  test('a system admin passes; a director, a member and an unknown reader do not', () => {
    const base = { isAuthenticated: true } as const;
    expect(canAccess(BILLING_ACCESS, { ...base, role: 'admin', orgRoles: [OrgRole.SYSTEM_ADMIN] })).toBe(true);
    expect(canAccess(BILLING_ACCESS, { ...base, role: 'admin', orgRoles: [OrgRole.DIRECTOR] })).toBe(false);
    expect(canAccess(BILLING_ACCESS, { ...base, role: 'employee', orgRoles: [OrgRole.SITE_ENGINEER] })).toBe(false);
    expect(canAccess(BILLING_ACCESS, { ...base, role: 'admin' })).toBe(false);
  });
});
