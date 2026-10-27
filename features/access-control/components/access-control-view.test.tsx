/**
 * The Roles & Permissions tab: a table per tier, with the editor in a drawer.
 * Pins the system role as read-only, a cell change saving through the
 * service, the discard guard on unsaved drawer edits, and a user's inherited
 * access.
 */
import { afterEach, describe, expect, test } from 'bun:test';
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  accessControlService,
  resetAccessControlStore,
} from '@/services/access-control-service';
import { AccessControlView } from './access-control-view';

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

afterEach(() => {
  cleanup();
  resetAccessControlStore();
});

/** Renders the view and waits for the roles matrix. */
async function openTable() {
  const view = renderView();
  await waitFor(() => expect(view.getByText('Module / Feature')).toBeTruthy());
  return view;
}

describe('AccessControlView', () => {
  test('a cell dropdown saves at once, and the system role column is locked', async () => {
    const view = await openTable();
    expect(
      view.getByRole('button', { name: 'Admin: Finance: Full' })
    ).toHaveProperty('disabled', true);

    // Client has no Finance access; pick a preset from its cell.
    fireEvent.keyDown(
      view.getByRole('button', { name: 'Client: Finance: No Access' }),
      { key: 'Enter' }
    );
    fireEvent.click(
      await view.findByRole('menuitem', { name: 'View + Create' })
    );
    await waitFor(async () => {
      const roles = await accessControlService.getRoles();
      expect(
        roles.find((r) => r.name === 'Client')?.permissions.finance
      ).toEqual(['view', 'create']);
    });
  });

  test('the View + Approve preset grants approval without editing', async () => {
    const view = await openTable();
    fireEvent.keyDown(
      view.getByRole('button', { name: 'Client: Finance: No Access' }),
      { key: 'Enter' }
    );
    fireEvent.click(
      await view.findByRole('menuitem', { name: 'View + Approve' })
    );
    await waitFor(async () => {
      const roles = await accessControlService.getRoles();
      expect(
        roles.find((r) => r.name === 'Client')?.permissions.finance
      ).toEqual(['view', 'approve']);
    });
  });

  test('a custom tick adds Delete on its own, bringing View with it', async () => {
    const view = await openTable();
    fireEvent.keyDown(
      view.getByRole('button', { name: 'Client: Finance: No Access' }),
      { key: 'Enter' }
    );
    fireEvent.click(
      await view.findByRole('menuitemcheckbox', { name: 'Delete' })
    );
    await waitFor(async () => {
      const roles = await accessControlService.getRoles();
      expect(
        roles.find((r) => r.name === 'Client')?.permissions.finance
      ).toEqual(['view', 'delete']);
    });
    // The open menu hides the rest of the page; close it to read the cell.
    fireEvent.keyDown(view.getByRole('menu'), { key: 'Escape' });
    await waitFor(() =>
      expect(
        view.getByRole('button', { name: 'Client: Finance: View + Delete' })
      ).toBeTruthy()
    );
  });

  test('a column header opens the role in a drawer with a dropdown per module', async () => {
    const view = await openTable();
    fireEvent.click(view.getByRole('button', { name: /^Store Keeper(?!:)/ }));
    const drawer = within(await view.findByRole('dialog'));
    expect((drawer.getByLabelText('Role name') as HTMLInputElement).value).toBe(
      'Store Keeper'
    );
    expect(
      drawer.getByRole('button', {
        name: 'Store Keeper: Goods Receipt (GRN): Edit',
      })
    ).toBeTruthy();
  });

  test('the groups tab is a table; a row opens the group in a drawer', async () => {
    const view = await openTable();
    fireEvent.mouseDown(view.getByRole('tab', { name: /^Departments/ }));
    fireEvent.click(await view.findByRole('button', { name: 'Open Auditors' }));
    const drawer = within(await view.findByRole('dialog'));
    expect((drawer.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'Auditors'
    );
    expect(
      drawer.getByRole('button', { name: 'Auditors: Finance: View' })
    ).toBeTruthy();
  });

  test("the users tab is a table; a user's drawer dropdowns include what their roles give", async () => {
    const view = await openTable();
    fireEvent.mouseDown(view.getByRole('tab', { name: /^Users/ }));
    fireEvent.click(
      await view.findByRole('button', { name: 'Manage access for Anand R' })
    );
    const drawer = within(await view.findByRole('dialog'));
    // Anand R is a Project Manager: Edit on WBS comes from the role.
    expect(
      drawer.getByRole('button', { name: 'Anand R: WBS & Schedule: Edit' })
    ).toBeTruthy();
  });

  test('closing the drawer with unsaved edits asks first', async () => {
    const view = await openTable();
    fireEvent.click(view.getByRole('button', { name: /^Store Keeper(?!:)/ }));
    const drawer = within(await view.findByRole('dialog'));
    fireEvent.change(drawer.getByLabelText('Role name'), {
      target: { value: 'Stores' },
    });
    expect(drawer.getByText('Unsaved changes')).toBeTruthy();
    fireEvent.keyDown(drawer.getByLabelText('Role name'), { key: 'Escape' });
    await waitFor(() =>
      expect(view.getByText('Discard unsaved changes?')).toBeTruthy()
    );
  });
});
