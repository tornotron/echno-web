/**
 * The Roles & Permissions screen on the access endpoints: Roles and Users
 * tabs only, the selected role's details beside the matrix and in step with
 * it, only the options the backend enforces, a role's grant list sent whole
 * with what the screen does not show kept, and a person's roles replaced
 * with the one change.
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
import {
  parseAccessCatalog,
  parseAccessRole,
  parseAccessUser,
  parseCurrentUserAccess,
  type AccessGrantRequest,
  type AccessUserRoleRequest,
} from '@tornotron/echno-core/access/types';
import { AccessView } from './access-view';

const STANDARD = ['read', 'create', 'edit', 'approve', 'delete'];
const enforced = (...actions: string[]) =>
  STANDARD.map((action) => ({ action, enforced: actions.includes(action) }));

const catalog = parseAccessCatalog({
  sections: ['Projects', 'Money', 'Setup'],
  scopes: ['ALL', 'ASSIGNED_PROJECTS', 'RELATED', 'OWN'],
  areas: [
    {
      id: 'assets',
      label: 'Assets',
      section: 'Projects',
      actions: enforced('read', 'create', 'edit', 'delete'),
      scopeAware: true,
    },
    {
      id: 'wbs',
      label: 'WBS',
      section: 'Projects',
      actions: enforced('edit'),
    },
    // Nothing on finance is enforced yet, so the screen leaves it out.
    { id: 'finance', label: 'Finance', section: 'Money', actions: enforced() },
    {
      id: 'access',
      label: 'Roles & Permissions',
      section: 'Setup',
      actions: enforced('read', 'edit'),
    },
  ],
});

const grant = (permission: string, scope = 'ALL') => ({ permission, scope });

const roleRows = [
  {
    id: 'member',
    name: 'Member',
    system: true,
    baseline: true,
    grants: [grant('assets:read')],
  },
  {
    id: 'admin',
    name: 'System Admin',
    system: true,
    grants: STANDARD.map((a) => grant(`assets:${a}`)),
    assignments: [{ employeeId: 1 }],
    grantableRoleIds: ['admin', 'pm', 'clerk'],
  },
  {
    id: 'pm',
    name: 'Project Manager',
    grants: [grant('assets:read'), grant('assets:create')],
    assignments: [{ employeeId: 2 }],
  },
  {
    id: 'clerk',
    name: 'Asset Clerk',
    // finance:read is not enforced and assets:approve is not either: both
    // are held from before and have to survive a save.
    grants: [
      grant('assets:read'),
      grant('assets:approve'),
      grant('finance:read'),
    ],
  },
  { id: 'owner', name: 'Owner', grants: [] },
].map((r) =>
  parseAccessRole({
    slug: r.id,
    system: false,
    baseline: false,
    assignments: [],
    grantableRoleIds: [],
    ...r,
  })
);

const userRows = [
  { employeeId: 1, name: 'First Admin', roles: [{ roleId: 'admin' }] },
  { employeeId: 2, name: 'Second Person', roles: [{ roleId: 'pm' }] },
  { employeeId: 3, name: 'Third Person', roles: [] },
].map((u) => parseAccessUser({ active: true, ...u }));

const caller = parseCurrentUserAccess({
  organizationId: 5,
  employeeId: 1,
  grants: Object.fromEntries(
    [
      'access:read',
      'access:edit',
      ...STANDARD.map((a) => `assets:${a}`),
      'wbs:edit',
    ].map((p) => [p, ['ALL']])
  ),
});

let setRoleGrants: ReturnType<typeof spyOn>;
let setUserRoles: ReturnType<typeof spyOn>;
const spied = [
  'getCatalog',
  'getRoles',
  'getUsers',
  'getCurrentUserAccess',
  'setRoleGrants',
  'setUserRoles',
] as const;

beforeEach(() => {
  spyOn(accessService, 'getCatalog').mockResolvedValue(catalog);
  spyOn(accessService, 'getRoles').mockResolvedValue(roleRows);
  spyOn(accessService, 'getUsers').mockResolvedValue(userRows);
  spyOn(accessService, 'getCurrentUserAccess').mockResolvedValue(caller);
  setRoleGrants = spyOn(accessService, 'setRoleGrants').mockResolvedValue(
    undefined
  );
  setUserRoles = spyOn(accessService, 'setUserRoles').mockResolvedValue(
    undefined
  );
});

afterEach(() => {
  cleanup();
  for (const name of spied) {
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
      <AccessView />
    </QueryClientProvider>
  );
}

/** Renders the view and waits for the roles matrix. */
async function openMatrix() {
  const view = renderView();
  await view.findByRole('button', { name: 'Asset Clerk: Assets: Read · All' });
  return view;
}

const openCell = async (view: ReturnType<typeof render>, name: string) => {
  fireEvent.keyDown(view.getByRole('button', { name }), { key: 'Enter' });
  return within(await view.findByRole('menu'));
};

function closeMenu(view: ReturnType<typeof render>) {
  const menu = view.queryByRole('menu');
  if (menu) fireEvent.keyDown(menu, { key: 'Escape' });
}

/** The grants the last write sent, as `permission@scope`. */
const sent = () =>
  (setRoleGrants.mock.calls.at(-1)?.[1] as AccessGrantRequest[])
    .map((g) => `${g.permission}@${g.scope}`)
    .toSorted();

describe('AccessView', () => {
  test('has Roles and Users tabs only', async () => {
    const view = await openMatrix();
    expect(
      view
        .getAllByRole('tab')
        .map((t) => t.textContent?.replace(/ \(\d+\)$/, ''))
    ).toEqual(['Roles', 'Users']);
  });

  test('shows only the areas, actions and scopes the backend enforces', async () => {
    const view = await openMatrix();
    expect(view.queryByText('Finance')).toBeNull();
    const assets = await openCell(view, 'Asset Clerk: Assets: Read · All');
    expect(
      assets.getAllByRole('menuitemcheckbox').map((i) => i.textContent)
    ).toEqual(['Read', 'Create', 'Edit', 'Delete']);
    expect(assets.getByText('Scope')).toBeTruthy();
    closeMenu(view);
    // WBS does not filter by scope, so only All is possible and no Scope is offered.
    const wbs = await openCell(view, 'Asset Clerk: WBS: No Access');
    fireEvent.click(wbs.getByRole('menuitemcheckbox', { name: 'Edit' }));
    expect(within(view.getByRole('menu')).queryByText('Scope')).toBeNull();
  });

  test("a cell's change waits for Save changes, then sends the whole list with what is not shown", async () => {
    const view = await openMatrix();
    const menu = await openCell(view, 'Asset Clerk: Assets: Read · All');
    fireEvent.click(menu.getByRole('menuitemcheckbox', { name: 'Create' }));
    closeMenu(view);
    expect(setRoleGrants).not.toHaveBeenCalled();
    expect(view.getByText(/Unsaved changes to 1 role/)).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(setRoleGrants).toHaveBeenCalledTimes(1));
    expect(setRoleGrants.mock.calls[0][0]).toBe('clerk');
    expect(sent()).toEqual([
      'assets:approve@ALL',
      'assets:create@ALL',
      'assets:read@ALL',
      'finance:read@ALL',
    ]);
  });

  test('System Admin, a role the caller holds, and one they may not assign are read-only', async () => {
    const view = await openMatrix();
    for (const name of [
      'System Admin: Assets: Full · All',
      'Owner: Assets: No Access',
      'Member: Assets: Read · All',
    ])
      expect(view.getByRole('button', { name })).toHaveProperty(
        'disabled',
        true
      );
    expect(
      view.getByRole('button', { name: 'Asset Clerk: Assets: Read · All' })
    ).toHaveProperty('disabled', false);
  });

  test('a column header opens the role beside the matrix, and its edits show in the matrix', async () => {
    const view = await openMatrix();
    fireEvent.click(view.getByRole('button', { name: 'Open Asset Clerk' }));
    const panel = within(
      await view.findByRole('complementary', { name: 'Asset Clerk details' })
    );
    expect(panel.getByRole('tab', { name: 'Module Permissions' })).toBeTruthy();
    expect(panel.getByRole('tab', { name: /^Assigned Users/ })).toBeTruthy();
    fireEvent.keyDown(
      panel.getByRole('button', {
        name: 'Asset Clerk details: Assets: Read · All',
      }),
      { key: 'Enter' }
    );
    const menu = within(await view.findByRole('menu'));
    fireEvent.click(menu.getByRole('menuitem', { name: 'Edit' }));
    closeMenu(view);
    expect(
      view.getByRole('button', { name: 'Asset Clerk: Assets: Edit · All' })
    ).toBeTruthy();
    expect(view.getByText(/Unsaved changes to 1 role/)).toBeTruthy();
  });

  test("adding a person sends their roles with the new one, and the caller's own row stays", async () => {
    const view = await openMatrix();
    fireEvent.click(view.getByRole('button', { name: 'Open System Admin' }));
    const panel = within(
      await view.findByRole('complementary', { name: 'System Admin details' })
    );
    fireEvent.mouseDown(panel.getByRole('tab', { name: /^Assigned Users/ }));
    expect(
      await panel.findByText('First Admin', { exact: false })
    ).toBeTruthy();
    expect(
      panel.queryByRole('button', { name: /Remove First Admin/ })
    ).toBeNull();
    fireEvent.click(panel.getByRole('button', { name: 'Add person' }));
    fireEvent.click(await view.findByRole('option', { name: /Second Person/ }));
    await waitFor(() => expect(setUserRoles).toHaveBeenCalledTimes(1));
    expect(setUserRoles.mock.calls[0][0]).toBe(2);
    expect(setUserRoles.mock.calls[0][1] as AccessUserRoleRequest[]).toEqual([
      { roleId: 'pm' },
      { roleId: 'admin' },
    ]);
  });

  test("a person's roles are saved from the Users tab as one set", async () => {
    const view = await openMatrix();
    fireEvent.mouseDown(view.getByRole('tab', { name: /^Users/ }));
    fireEvent.click(
      await view.findByRole('button', {
        name: 'Manage access for Third Person',
      })
    );
    const panel = within(
      await view.findByRole('complementary', { name: 'Third Person access' })
    );
    fireEvent.click(panel.getByRole('button', { name: 'Add role' }));
    fireEvent.click(await view.findByRole('option', { name: /Asset Clerk/ }));
    fireEvent.click(panel.getByRole('button', { name: 'Save roles' }));
    await waitFor(() => expect(setUserRoles).toHaveBeenCalledTimes(1));
    expect(setUserRoles.mock.calls[0]).toEqual([3, [{ roleId: 'clerk' }]]);
  });

  test('leaving the Roles tab with unsaved edits asks first', async () => {
    const view = await openMatrix();
    const menu = await openCell(view, 'Asset Clerk: Assets: Read · All');
    fireEvent.click(menu.getByRole('menuitemcheckbox', { name: 'Create' }));
    closeMenu(view);
    fireEvent.mouseDown(view.getByRole('tab', { name: /^Users/ }));
    await waitFor(() =>
      expect(view.getByText('Discard unsaved changes?')).toBeTruthy()
    );
  });
});
