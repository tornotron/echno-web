/**
 * The Roles & Permissions tab on the access endpoints: a table per tier,
 * with the editor in a drawer. Pins a cell saving the role's whole grant
 * list, the scope applying to the whole cell, locked grants and roles the
 * caller may not change staying read-only, the discard guard, and a
 * person's access from their groups.
 */
import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { accessService } from '@tornotron/echno-core/access/services';
import type {
  AccessGrantRequest,
  AccessRole,
} from '@tornotron/echno-core/access/types';
import { AccessControlView } from './access-control-view';

const STANDARD = ['view', 'create', 'edit', 'approve', 'delete'];
const catalog = {
  sections: ['Stores', 'Money', 'People'],
  scopes: ['ALL', 'ASSIGNED_PROJECTS', 'RELATED', 'OWN'],
  areas: [
    { id: 'assets', label: 'Assets', section: 'Stores', actions: STANDARD },
    { id: 'finance', label: 'Finance', section: 'Money', actions: STANDARD },
    { id: 'leave', label: 'Leave', section: 'People', actions: STANDARD },
  ],
};

const grant = (permission: string, scope = 'ALL', locked = false) => ({
  permission,
  scope,
  locked,
});
const all = (area: string, scope = 'ALL') =>
  STANDARD.map((a) => grant(`${area}:${a}`, scope));

const role = (over: Partial<AccessRole> & { id: string; name: string }) => ({
  slug: over.id,
  system: false,
  baseline: false,
  grants: [],
  memberIds: [],
  grantableRoleIds: [],
  ...over,
});

const roles = [
  role({
    id: 'member',
    name: 'Member',
    system: true,
    baseline: true,
    grants: [
      grant('assets:view'),
      grant('leave:view', 'OWN', true),
      grant('leave:create', 'OWN', true),
    ],
  }),
  role({
    id: 'admin',
    name: 'Admin',
    system: true,
    grants: [...all('assets'), ...all('finance')],
    memberIds: [1],
    grantableRoleIds: ['admin', 'pm', 'clerk'],
  }),
  role({
    id: 'pm',
    name: 'Project Manager',
    system: true,
    grants: all('assets'),
    memberIds: [2],
  }),
  role({
    id: 'clerk',
    name: 'Asset Clerk',
    grants: [grant('assets:view'), grant('assets:create')],
  }),
  role({ id: 'owner', name: 'Owner', grants: all('finance') }),
];

const groups = [
  {
    id: 'stores',
    name: 'Stores',
    kind: 'DEPARTMENT',
    grants: [grant('finance:view')],
    memberIds: [3],
    roleIds: ['clerk'],
  },
];

const users = [
  {
    employeeId: 1,
    name: 'Abin Admin',
    active: true,
    roleIds: ['admin'],
    groupIds: [],
    grants: [],
  },
  {
    employeeId: 2,
    name: 'Anand R',
    active: true,
    roleIds: ['pm'],
    groupIds: [],
    grants: [],
  },
  {
    employeeId: 3,
    name: 'Arun',
    active: true,
    roleIds: [],
    groupIds: ['stores'],
    grants: [],
  },
];

let setRoleGrants: ReturnType<typeof spyOn>;

beforeEach(() => {
  spyOn(accessService, 'getCatalog').mockResolvedValue(catalog);
  spyOn(accessService, 'getRoles').mockResolvedValue(roles as AccessRole[]);
  spyOn(accessService, 'getGroups').mockResolvedValue(groups as never);
  spyOn(accessService, 'getUsers').mockResolvedValue(users);
  spyOn(accessService, 'getCurrentUserAccess').mockResolvedValue({
    organizationId: 1,
    employeeId: 1,
    grants: {},
  });
  setRoleGrants = spyOn(accessService, 'setRoleGrants').mockImplementation(
    async (id: string, sent: AccessGrantRequest[]) => ({
      ...(roles.find((r) => r.id === id) as AccessRole),
      grants: sent.map((g) => ({ ...g, locked: false })),
    })
  );
});

afterEach(() => {
  cleanup();
  for (const name of [
    'getCatalog',
    'getRoles',
    'getGroups',
    'getUsers',
    'getCurrentUserAccess',
    'setRoleGrants',
  ] as const) {
    (
      accessService[name] as unknown as { mockRestore?: () => void }
    ).mockRestore?.();
  }
});

function renderView() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AccessControlView />
    </QueryClientProvider>
  );
}

/** Renders the view and waits for the roles matrix. */
async function openTable() {
  const view = renderView();
  await waitFor(() =>
    expect(
      view.getByRole('button', { name: 'Admin: Assets: Full · All' })
    ).toBeTruthy()
  );
  return view;
}

const openCell = async (view: ReturnType<typeof render>, name: string) => {
  fireEvent.keyDown(view.getByRole('button', { name }), { key: 'Enter' });
  return within(await view.findByRole('menu'));
};

/** The grants the last cell write sent, as `permission@scope`. */
const sent = () =>
  (setRoleGrants.mock.calls.at(-1)?.[1] as AccessGrantRequest[])
    .map((g) => `${g.permission}@${g.scope}`)
    .toSorted();

describe('AccessControlView', () => {
  test("a cell saves at once, sending the role's whole grant list", async () => {
    const view = await openTable();
    const menu = await openCell(view, 'Asset Clerk: Finance: No Access');
    fireEvent.click(menu.getByRole('menuitem', { name: 'View + Create' }));
    await waitFor(() => expect(setRoleGrants).toHaveBeenCalled());
    expect(setRoleGrants.mock.calls[0][0]).toBe('clerk');
    expect(sent()).toEqual([
      'assets:create@ALL',
      'assets:view@ALL',
      'finance:create@ALL',
      'finance:view@ALL',
    ]);
  });

  test('a scope applies to every action in the cell', async () => {
    const view = await openTable();
    const menu = await openCell(view, 'Project Manager: Assets: Full · All');
    fireEvent.click(
      menu.getByRole('menuitemradio', { name: 'Assigned projects' })
    );
    await waitFor(() => expect(setRoleGrants).toHaveBeenCalled());
    expect(sent()).toEqual(
      STANDARD.map((a) => `assets:${a}@ASSIGNED_PROJECTS`).toSorted()
    );
  });

  test('a locked grant cannot be cleared and fixes its scope', async () => {
    const view = await openTable();
    const menu = await openCell(view, 'Member: Leave: View + Create · Own');
    expect(
      menu.getByRole('menuitemcheckbox', { name: /^View/ })
    ).toHaveAttribute('data-disabled');
    expect(menu.getByRole('menuitemradio', { name: 'All' })).toHaveAttribute(
      'data-disabled'
    );
    fireEvent.click(menu.getByRole('menuitem', { name: 'No Access' }));
    await waitFor(() => expect(setRoleGrants).toHaveBeenCalled());
    expect(sent()).toContain('leave:view@OWN');
    expect(sent()).toContain('leave:create@OWN');
  });

  test("a role the caller's roles may not assign is read-only", async () => {
    const view = await openTable();
    expect(
      view.getByRole('button', { name: 'Owner: Finance: Full · All' })
    ).toHaveProperty('disabled', true);
    expect(
      view.getByRole('button', {
        name: 'Asset Clerk: Assets: View + Create · All',
      })
    ).toHaveProperty('disabled', false);
  });

  test('a column header opens the role in a drawer with a dropdown per area', async () => {
    const view = await openTable();
    fireEvent.click(view.getByRole('button', { name: /^Asset Clerk(?!:)/ }));
    const drawer = within(await view.findByRole('dialog'));
    expect((drawer.getByLabelText('Role name') as HTMLInputElement).value).toBe(
      'Asset Clerk'
    );
    expect(
      drawer.getByRole('button', {
        name: 'Asset Clerk: Assets: View + Create · All',
      })
    ).toBeTruthy();
  });

  test('the groups tab is a table; a row opens the group in a drawer', async () => {
    const view = await openTable();
    fireEvent.mouseDown(view.getByRole('tab', { name: /^Departments/ }));
    fireEvent.click(await view.findByRole('button', { name: 'Open Stores' }));
    const drawer = within(await view.findByRole('dialog'));
    expect((drawer.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'Stores'
    );
    expect(
      drawer.getByRole('button', { name: 'Stores: Finance: View · All' })
    ).toBeTruthy();
  });

  test("a person's drawer counts the roles and grants their groups give", async () => {
    const view = await openTable();
    fireEvent.mouseDown(view.getByRole('tab', { name: /^Users/ }));
    fireEvent.click(
      await view.findByRole('button', { name: 'Manage access for Arun' })
    );
    const drawer = within(await view.findByRole('dialog'));
    // Stores gives Arun the Asset Clerk role and Finance view.
    expect(
      drawer.getByRole('button', { name: 'Arun: Assets: View + Create' })
    ).toBeTruthy();
    expect(
      drawer.getByRole('button', { name: 'Arun: Finance: View' })
    ).toBeTruthy();
    expect(drawer.getByTitle('via Stores')).toHaveTextContent('Asset Clerk');
  });

  test('closing the drawer with unsaved edits asks first', async () => {
    const view = await openTable();
    fireEvent.click(view.getByRole('button', { name: /^Asset Clerk(?!:)/ }));
    const drawer = within(await view.findByRole('dialog'));
    fireEvent.change(drawer.getByLabelText('Role name'), {
      target: { value: 'Stores Clerk' },
    });
    expect(drawer.getByText('Unsaved changes')).toBeTruthy();
    fireEvent.keyDown(drawer.getByLabelText('Role name'), { key: 'Escape' });
    await waitFor(() =>
      expect(view.getByText('Discard unsaved changes?')).toBeTruthy()
    );
  });
});
