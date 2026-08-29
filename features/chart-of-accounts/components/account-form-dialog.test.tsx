import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import * as realFinanceHooks from '@tornotron/echno-core/finance/hooks';
import {
  AccountType,
  type AccountTreeNode,
} from '@tornotron/echno-core/finance/types';

const idleMutation = { mutate: () => {}, isPending: false };

mock.module('@tornotron/echno-core/finance/hooks', () => ({
  ...realFinanceHooks,
  useCreateAccount: () => idleMutation,
  useUpdateAccount: () => idleMutation,
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
  },
}));

const { AccountFormDialog } = await import('./account-form-dialog');

function account(
  id: string,
  code: string,
  name: string
): AccountTreeNode {
  return {
    id,
    code,
    name,
    type: AccountType.EXPENSE,
    postable: true,
    active: true,
    children: [],
  } as unknown as AccountTreeNode;
}

const CEMENT = account('a1', '5100', 'Cement');
const DIESEL = account('a2', '5200', 'Diesel');
const TREE = [CEMENT, DIESEL];

/**
 * The dialog renders into a portal, so the fields are on `document.body`
 * rather than under the container the test rendered. Read by id and assert on
 * the value string: an assertion that fails while printing a Radix element
 * stalls the reporter serialising it.
 */
function fieldValue(id: string): string {
  const field = document.body.querySelector(`#${id}`) as HTMLInputElement;
  return field?.value ?? '';
}

function show(props: {
  open: boolean;
  account?: AccountTreeNode | null;
  defaultParentId?: string | null;
}) {
  return createElement(AccountFormDialog, {
    open: props.open,
    onOpenChange: () => {},
    tree: TREE,
    account: props.account ?? null,
    defaultParentId: props.defaultParentId ?? null,
  });
}

/*
 * These cover the seeding the dialog has always done, not new behaviour: the
 * seeding moved out of an effect and into the render, and the point of the
 * tests is that what the user sees did not move with it. They pass against
 * both versions by design.
 */
describe('AccountFormDialog seeding', () => {
  afterEach(cleanup);

  test('carries the account being edited into the fields', () => {
    render(show({ open: true, account: CEMENT }));

    expect(fieldValue('account-code')).toBe('5100');
    expect(fieldValue('account-name')).toBe('Cement');
  });

  test('re-seeds when opened for a different account', () => {
    const { rerender } = render(show({ open: true, account: CEMENT }));
    expect(fieldValue('account-code')).toBe('5100');

    rerender(show({ open: true, account: DIESEL }));

    expect(fieldValue('account-code')).toBe('5200');
    expect(fieldValue('account-name')).toBe('Diesel');
  });

  test('re-seeds the same account after the dialog is closed and reopened', () => {
    const { rerender } = render(show({ open: true, account: CEMENT }));

    // Stand in for the user typing over the seeded values.
    const code = document.body.querySelector('#account-code') as HTMLInputElement;
    code.value = 'edited';

    rerender(show({ open: false, account: CEMENT }));
    rerender(show({ open: true, account: CEMENT }));

    // The target did not change, so only the close and reopen can restore it.
    expect(fieldValue('account-code')).toBe('5100');
  });

  test('opens blank when there is no account to edit', () => {
    render(show({ open: true }));

    expect(fieldValue('account-code')).toBe('');
    expect(fieldValue('account-name')).toBe('');
  });
});
