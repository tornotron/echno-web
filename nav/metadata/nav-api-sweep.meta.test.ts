/**
 * Menu items that must follow the backend's gate. These were on the coarse
 * tiers, which are lossy here: HR admins sit in the manager tier and directors
 * in the admin tier, so the tier offered a page the API refuses to one and hid
 * a page it allows from the other.
 */
import { describe, expect, test } from 'bun:test';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import { canAccess } from '../access/evaluate';
import { attendanceMetadata } from './attendance.meta';
import { workforceMetadata } from './workforce.meta';

function ctx(orgRoles: OrgRole[]) {
  return { isAuthenticated: true, orgRoles };
}

const items = {
  'Leave policies': workforceMetadata['workforce-leaves-manage-policies'],
  'Attendance settings': attendanceMetadata['attendance-settings'],
};

describe.each(Object.entries(items))('%s menu item', (_name, item) => {
  test('offered to system and HR admins', () => {
    const config = item.access ?? {};
    expect(canAccess(config, ctx([OrgRole.SYSTEM_ADMIN]))).toBe(true);
    expect(canAccess(config, ctx([OrgRole.HR_ADMIN]))).toBe(true);
  });

  test('locked for the other tier roles the API refuses', () => {
    const config = item.access ?? {};
    expect(canAccess(config, ctx([OrgRole.DIRECTOR]))).toBe(false);
    expect(canAccess(config, ctx([OrgRole.PROJECT_MANAGER]))).toBe(false);
    expect(canAccess(config, ctx([OrgRole.SITE_MANAGER]))).toBe(false);
  });
});

test('the leave calendar stays offered: its My Team tab is open to any member', () => {
  expect(
    workforceMetadata['workforce-leaves-manage-calendar']
  ).not.toHaveProperty('access');
});
