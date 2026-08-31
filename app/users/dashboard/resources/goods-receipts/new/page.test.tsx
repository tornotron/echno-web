/**
 * What the receipt form does when the server refuses an over-receipt.
 *
 * echno-backend#659 turned a receipt bigger than its order from a 201 into a
 * 400, and the deployed client had no idea the rule existed: a storekeeper
 * receiving 105 bags against an order for 100 got "Failed to Record GRN" and a
 * filled-in document with nowhere to go. The figures that explain the refusal
 * are in the server's message, and the way past it is a second, deliberate
 * filing rather than anything that can be corrected on the form.
 *
 * The three things worth pinning are the three ways this can be got wrong:
 * treating the refusal as an ordinary failure, which is the break itself;
 * treating every 400 as an over-receipt, which offers to overrule a rule nobody
 * has been shown; and rebuilding the payload for the second attempt, which
 * would let anything edited behind the dialog ride in under an acknowledgement
 * given for different figures.
 *
 * Assertions are on counts, strings and booleans, never on a rendered Radix
 * node: an assertion that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { ApiError } from '@/lib/api/api-client';

/** The query string the page is rendered with, per test. */
let search = '';

import * as realNavigation from 'next/navigation';

mock.module('next/navigation', () => ({
  ...realNavigation,
  useSearchParams: () => new URLSearchParams(search),
  usePathname: () => '/users/dashboard/resources/goods-receipts/new',
  useRouter: () => ({ push: () => {}, replace: () => {} }),
}));

/** Query keys the page asked to be dropped after a failure. */
const invalidated: unknown[] = [];

import * as realQuery from '@tanstack/react-query';

mock.module('@tanstack/react-query', () => ({
  ...realQuery,
  useQueryClient: () => ({
    // Nothing is prefilled from the cache here; the page falls back to the
    // query, which these tests answer through `usePurchaseOrder`.
    getQueryData: () => {},
    invalidateQueries: (args: { queryKey: unknown }) => {
      invalidated.push(args.queryKey);
    },
  }),
}));

const createGRN = mock((..._args: unknown[]) => {});

import * as realGrnHooks from '@tornotron/echno-core/grn/hooks';

mock.module('@tornotron/echno-core/grn/hooks', () => ({
  ...realGrnHooks,
  useCreateGRN: () => ({ mutate: createGRN, isPending: false }),
}));

import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useCurrentUserEmployee: () => ({ data: { id: 3, name: 'Asha' } }),
}));

/** One order, one line: 100 asked for, 95 already in. */
const ORDER = {
  id: 11,
  poNumber: 'PO-2026-011',
  vendorId: 5,
  projectId: 7,
  items: [
    {
      id: 1,
      materialId: 2,
      materialName: 'TNT Steel',
      orderedQuantity: 100,
      receivedQuantity: 95,
      unitPrice: 0,
      totalPrice: 0,
    },
  ],
};

import * as realPurchaseOrderHooks from '@tornotron/echno-core/purchase-orders/hooks';

mock.module('@tornotron/echno-core/purchase-orders/hooks', () => ({
  ...realPurchaseOrderHooks,
  usePurchaseOrders: () => ({ data: [ORDER] }),
  usePurchaseOrder: (id: number) => ({ data: id === ORDER.id ? ORDER : undefined }),
}));

import * as realMaterialHooks from '@tornotron/echno-core/materials/hooks';

mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialHooks,
  useMaterials: () => ({
    data: [{ id: 2, materialName: 'TNT Steel', unit: 'MT' }],
  }),
}));

import * as realProjectHooks from '@tornotron/echno-core/project/hooks';

mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({ data: [{ id: 7, projectName: 'Marina Tower' }] }),
}));

import * as realVendorHooks from '@tornotron/echno-core/vendor/hooks';

mock.module('@tornotron/echno-core/vendor/hooks', () => ({
  ...realVendorHooks,
  useVendors: () => ({ data: [{ id: 5, name: 'Acme Supplies' }] }),
}));

import * as realStorageLocationHooks from '@tornotron/echno-core/storage-locations/hooks';

mock.module('@tornotron/echno-core/storage-locations/hooks', () => ({
  ...realStorageLocationHooks,
  useStorageLocations: () => ({ data: [] }),
}));

const errorToast = mock((..._args: unknown[]) => {});
const successToast = mock((..._args: unknown[]) => {});

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    error: errorToast,
    success: successToast,
    info: () => {},
    warning: () => {},
  },
}));

/** The page clears the draft once the receipt exists; nothing here reads it. */
const clearDraft = () => {};

mock.module('@/hooks/use-form-draft', () => ({
  useFormDraftScope: () => ({ userId: 'u1', orgId: 1 }),
  useFormDraft: () => ({
    draft: null,
    restoreDraft: () => {},
    discardDraft: () => {},
  }),
  useClearFormDraft: () => clearDraft,
}));

const { default: NewGRNPage } = await import('./page');

/** The sentence the backend sends, from echno-backend#659. */
const REFUSAL =
  'Purchase order PO-2026-011 orders 100 of TNT Steel, 95 has already been ' +
  'received against it, and this note receives a further 20, which would take ' +
  'it to 115. If the delivery really did exceed the order, send the note again ' +
  'with allowOverReceipt set, which records the excess and marks the note as an ' +
  'acknowledged over-receipt.';

afterEach(() => {
  cleanup();
  search = '';
  createGRN.mockClear();
  errorToast.mockClear();
  successToast.mockClear();
  invalidated.length = 0;
});

/** Opens a shadcn/Radix select by id and clicks the option carrying `label`. */
function choose(container: HTMLElement, id: string, label: string) {
  const trigger = container.querySelector(`#${id}`) as HTMLElement;
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  const option = [...document.body.querySelectorAll('[role="option"]')].find(
    (o) => o.textContent?.includes(label)
  );
  if (!option) throw new Error(`"${label}" was not offered by #${id}`);
  fireEvent.click(option);
}

/** The item rows carry no ids, so the row select is reached through the table. */
function chooseInRow(container: HTMLElement, label: string) {
  const trigger = container.querySelector(
    'tbody [role="combobox"]'
  ) as HTMLElement;
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  const option = [...document.body.querySelectorAll('[role="option"]')].find(
    (o) => o.textContent?.includes(label)
  );
  if (!option) throw new Error(`"${label}" was not offered in the item row`);
  fireEvent.click(option);
}

/** Fills the receipt in and submits it, leaving one create call recorded. */
function fileAReceipt(): HTMLElement {
  const { container } = render(createElement(NewGRNPage));
  choose(container, 'vendorId', 'Acme Supplies');
  choose(container, 'purchaseOrderId', 'PO-2026-011');
  choose(container, 'projectId', 'Marina Tower');
  chooseInRow(container, 'TNT Steel');
  fireEvent.submit(container.querySelector('form') as HTMLFormElement);
  expect(createGRN).toHaveBeenCalledTimes(1);
  return container;
}

/** The payload of the nth create call. */
function payloadOf(call: number): Record<string, unknown> {
  return createGRN.mock.calls[call]?.[0] as Record<string, unknown>;
}

/**
 * Fails the nth create the way the server would.
 *
 * Wrapped in `act` because the failure is what opens the dialog: without it
 * React has not flushed the state change by the time the assertions read the
 * document, and every one of them reads the page as it was before the refusal.
 */
function refuse(call: number, error: unknown) {
  act(() => optionsOf(call).onError(error));
}

/** The options object the nth create call was passed. */
function optionsOf(call: number) {
  return createGRN.mock.calls[call]?.[1] as {
    onError: (error: unknown) => void;
    onSuccess: (grn: { id: number }) => void;
  };
}

/** The button whose label contains `label`, dialog included. */
function button(label: string): HTMLButtonElement | undefined {
  return [...document.body.querySelectorAll('button')].find((b) =>
    (b.textContent ?? '').includes(label)
  ) as HTMLButtonElement | undefined;
}

describe('the refusal reaches the person who has to answer it', () => {
  test('the server figures are read out, not replaced by a generic failure', () => {
    fileAReceipt();

    refuse(0, new ApiError(REFUSAL, 400));

    const shown = document.body.textContent ?? '';
    expect(shown).toContain('PO-2026-011');
    expect(shown).toContain('orders 100 of TNT Steel');
    expect(shown).toContain('95 has already been received');
    expect(shown).toContain('would take it to 115');
  });

  test('the instruction meant for the client is not read out with them', () => {
    fileAReceipt();

    refuse(0, new ApiError(REFUSAL, 400));

    expect(document.body.textContent).not.toContain('allowOverReceipt');
  });

  test('the acknowledgement is offered as an act, with its consequence stated', () => {
    fileAReceipt();

    refuse(0, new ApiError(REFUSAL, 400));

    expect(button('Record the excess') === undefined).toBe(false);
    expect(button('Go back and check') === undefined).toBe(false);
    expect(document.body.textContent).toContain(
      'marked as an over-receipt somebody accepted'
    );
  });

  test('the refusal is not left to a toast', () => {
    fileAReceipt();

    refuse(0, new ApiError(REFUSAL, 400));

    expect(errorToast).toHaveBeenCalledTimes(0);
  });
});

describe('acknowledging it files the same receipt again', () => {
  test('the second attempt carries the acknowledgement', () => {
    fileAReceipt();
    refuse(0, new ApiError(REFUSAL, 400));

    act(() => {
      fireEvent.click(button('Record the excess') as HTMLButtonElement);
    });

    expect(createGRN).toHaveBeenCalledTimes(2);
    expect(payloadOf(1).allowOverReceipt).toBe(true);
  });

  test('the first attempt did not carry it', () => {
    fileAReceipt();

    expect('allowOverReceipt' in payloadOf(0)).toBe(false);
  });

  test('it is the same receipt, not one rebuilt from the form', () => {
    fileAReceipt();
    refuse(0, new ApiError(REFUSAL, 400));

    act(() => {
      fireEvent.click(button('Record the excess') as HTMLButtonElement);
    });

    const first = payloadOf(0);
    const second = payloadOf(1);
    expect(JSON.stringify(second.items)).toBe(JSON.stringify(first.items));
    expect(second.receivedOn).toBe(first.receivedOn);
    expect(second.purchaseOrderId).toBe(first.purchaseOrderId);
  });
});

describe('every other failure is left where it was', () => {
  test('another 400 still goes to a toast', () => {
    fileAReceipt();

    refuse(
      0,
      new ApiError('Project with ID null was not found in this organization.', 400)
    );

    expect(errorToast).toHaveBeenCalledTimes(1);
  });

  test('and offers nothing to acknowledge', () => {
    fileAReceipt();

    refuse(
      0,
      new ApiError('Project with ID null was not found in this organization.', 400)
    );

    expect(button('Record the excess') === undefined).toBe(true);
  });
});

describe('a refused receipt does not leave stale figures on the page', () => {
  test('the cited order is dropped from the cache', () => {
    fileAReceipt();

    refuse(0, new ApiError(REFUSAL, 400));

    // The order is what the outstanding column is drawn from, and a receipt
    // landing between the two attempts decides this one. Left cached, the page
    // goes on offering a quantity the server has already refused.
    expect(JSON.stringify(invalidated)).toContain('11');
    expect(invalidated.length).toBe(1);
  });

  test('it is dropped whatever the failure was', () => {
    fileAReceipt();

    refuse(0, new ApiError('Something else went wrong', 500));

    expect(invalidated.length).toBe(1);
  });
});

describe('arriving from a partially received order', () => {
  test('the receipt is prefilled with what is left, not with the whole order', () => {
    search = 'fromPO=11';

    const { container } = render(createElement(NewGRNPage));

    // 100 ordered, 95 in, so 5 is what a lorry against this order should be
    // bringing. Prefilling 100 was harmless while `receivedQuantity` was always
    // zero; since echno-backend#659 it provokes the refusal every time, and a
    // refusal that fires on every ordinary delivery is one people learn to
    // click past.
    const received = container.querySelectorAll(
      'tbody input[type="number"]'
    )[0] as HTMLInputElement;
    expect(received.value).toBe('5');
  });

  test('and nothing on it is flagged as more than the order expects', () => {
    search = 'fromPO=11';

    const { container } = render(createElement(NewGRNPage));

    expect(container.textContent).not.toContain('More than this order expects');
  });
});
