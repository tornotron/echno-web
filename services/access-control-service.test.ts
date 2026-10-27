import { beforeEach, describe, expect, test } from 'bun:test';
import { ACCESS_MODULES } from '@/types/access-control';
import {
  accessControlService as svc,
  resetAccessControlStore,
} from './access-control-service';
import { permissionsFromCodes, seedRoles } from './access-control-mock-data';

beforeEach(resetAccessControlStore);

describe('seed data', () => {
  test('every seeded role sets a level on every module', () => {
    for (const r of seedRoles) {
      expect(Object.keys(r.permissions)).toHaveLength(ACCESS_MODULES.length);
    }
  });

  test('a matrix column of the wrong length is refused', () => {
    expect(() => permissionsFromCodes('FFF')).toThrow();
  });
});

describe('roles', () => {
  test('creating a role writes its group memberships onto the groups', async () => {
    const created = await svc.createRole({
      name: '  Planner ',
      description: '',
      permissions: { wbs: ['edit', 'delete'] },
      userIds: [12, 999],
      groupIds: [1, 4],
    });
    expect(created.name).toBe('Planner');
    expect(created.userIds).toEqual([12]);
    // View is added to any other action.
    expect(created.permissions.wbs).toEqual(['view', 'edit', 'delete']);
    const groups = await svc.getGroups();
    expect(
      groups.filter((g) => g.roleIds.includes(created.id)).map((g) => g.id)
    ).toEqual([1, 4]);
  });

  test('names are unique regardless of case', async () => {
    const input = {
      name: 'project manager',
      description: '',
      permissions: {},
      userIds: [],
      groupIds: [],
    };
    await expect(svc.createRole(input)).rejects.toThrow('already exists');
  });

  test('a system role keeps its name and permissions but its users can change', async () => {
    const [admin] = await svc.getRoles();
    const base = { ...admin, groupIds: [] };
    await expect(
      svc.updateRole(admin.id, { ...base, name: 'Root' })
    ).rejects.toThrow();
    await expect(svc.deleteRole(admin.id)).rejects.toThrow();

    const updated = await svc.updateRole(admin.id, {
      ...base,
      permissions: { finance: [] },
      userIds: [2, 3],
    });
    expect(updated.permissions.finance).toEqual([
      'view',
      'create',
      'edit',
      'approve',
      'delete',
    ]);
    expect(updated.userIds).toEqual([2, 3]);
  });

  test('setRolePermission writes one cell, adding view, and refuses a system role', async () => {
    const updated = await svc.setRolePermission(9, 'finance', ['delete']);
    expect(updated.permissions.finance).toEqual(['view', 'delete']);
    const cleared = await svc.setRolePermission(9, 'finance', []);
    expect(cleared.permissions.finance).toBeUndefined();
    await expect(svc.setRolePermission(1, 'finance', [])).rejects.toThrow();
  });

  test('deleting a role drops it from every group', async () => {
    await svc.deleteRole(3);
    const groups = await svc.getGroups();
    expect(groups.some((g) => g.roleIds.includes(3))).toBe(false);
  });
});

describe('users', () => {
  test('updateUserAccess moves the user between roles and groups and drops empty grants', async () => {
    await svc.updateUserAccess(5, {
      roleIds: [5],
      groupIds: [5],
      permissions: { finance: ['create'], wbs: [] },
    });
    const roles = await svc.getRoles();
    expect(roles.filter((r) => r.userIds.includes(5)).map((r) => r.id)).toEqual(
      [5]
    );
    const groups = await svc.getGroups();
    expect(
      groups.filter((g) => g.userIds.includes(5)).map((g) => g.id)
    ).toEqual([5]);
    const users = await svc.getUsers();
    const user = users.find((u) => u.id === 5);
    expect(user?.permissions).toEqual({ finance: ['view', 'create'] });
  });
});
