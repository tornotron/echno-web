import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realMaterialHooks from '@tornotron/echno-core/materials/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realVendorHooks from '@tornotron/echno-core/vendor/hooks';
import * as realIndentHooks from '@tornotron/echno-core/indents/hooks';
import * as realPurchaseOrderHooks from '@tornotron/echno-core/purchase-orders/hooks';
import { PurchaseOrderStatus } from '@tornotron/echno-core/purchase-orders/types';

/**
 * The form no longer reads the order list, since it no longer proposes a
 * number. The mock stays so the module registry is not left handing the real
 * hook to a component rendered without a query client.
 */
mock.module('@tornotron/echno-core/purchase-orders/hooks', () => ({
  ...realPurchaseOrderHooks,
  usePurchaseOrders: () => ({ data: [] }),
}));
mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialHooks,
  useMaterials: () => ({
    data: [{ id: 2, materialName: 'TNT Steel', unit: 'MT' }],
  }),
  useMaterialWithStock: () => ({ data: undefined }),
}));
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({ data: [{ id: 3, projectName: 'Riverside' }] }),
}));
mock.module('@tornotron/echno-core/vendor/hooks', () => ({
  ...realVendorHooks,
  useVendors: () => ({ data: [{ id: 5, name: 'Acme Supplies' }] }),
}));
mock.module('@tornotron/echno-core/indents/hooks', () => ({
  ...realIndentHooks,
  useIndents: () => ({ data: [] }),
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
  },
}));

mock.module('@/hooks/use-form-draft', () => ({
  useFormDraftScope: () => ({ userId: 'u1', orgId: 1 }),
  useFormDraft: () => ({
    draft: null,
    restoreDraft: () => {},
    discardDraft: () => {},
  }),
}));

const { PurchaseOrderForm } = await import('./purchase-order-form');

/**
 * `DocumentNumberAllocator` hands out the PO number per organization, document
 * type and year, and `PurchaseOrderService` calls it unconditionally before it
 * saves. `PurchaseOrderCreationDto` declares no `poNumber`, so a number the
 * browser proposed was read off nothing and dropped.
 *
 * This screen was the worst of the four: the number was a required, editable
 * input, so somebody could type `PO-LEGACY-0042`, be told the order was
 * created, and find it filed under whatever the allocator answered. The
 * previous tests here asserted that the proposal advanced past the list, which
 * pinned exactly that behaviour and would have kept passing after it was
 * removed.
 */
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

describe('PurchaseOrderForm PO number', () => {
  afterEach(() => {
    cleanup();
  });

  test('the form does not ask for a PO number', () => {
    const { container } = render(
      createElement(PurchaseOrderForm, { onSubmit: () => {} })
    );

    // Asserted as a boolean on purpose: a failing assertion that prints a
    // Radix DOM node hangs the reporter rather than reporting.
    expect(container.querySelector('#poNumber') === null).toBe(true);
    expect(container.textContent).not.toContain('PO Number');
  });

  test('nothing named poNumber reaches the submit payload', () => {
    const onSubmit = mock((..._args: unknown[]) => {});
    const { container } = render(
      createElement(PurchaseOrderForm, { onSubmit })
    );

    choose(container, 'vendorId', 'Acme Supplies');
    choose(container, 'projectId', 'Riverside');
    chooseInRow(container, 'TNT Steel');
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as {
      form: Record<string, unknown>;
    };
    expect(Object.keys(submitted.form)).not.toContain('poNumber');
  });
});

/**
 * Opens the status dropdown, if there is one, and returns the labels it offers.
 *
 * Radix keeps the list out of the DOM until the trigger is pressed, so the
 * options have to be read after opening it. The labels come back as strings so
 * a failure prints a list rather than a DOM node.
 */
function statusOptions(container: HTMLElement): string[] {
  const trigger = container.querySelector('#status') as HTMLElement;
  fireEvent.pointerDown(trigger, {
    button: 0,
    ctrlKey: false,
    pointerType: 'mouse',
  });
  return [...document.querySelectorAll('[role="option"]')].map(
    (option) => option.textContent?.trim() ?? ''
  );
}

// This form only ever creates. Approval and every later state change go through
// the status action on the order, and the API takes only DRAFT on create, so
// offering the rest was a 400 waiting to happen.
describe('PurchaseOrderForm status', () => {
  afterEach(() => {
    cleanup();
  });

  test('is shown, not offered', () => {
    const { container } = render(
      createElement(PurchaseOrderForm, { onSubmit: () => {} })
    );

    const status = container.querySelector('#status');

    expect(status?.getAttribute('role')).toBe(null);
    expect(status?.textContent?.trim()).toBe('Draft');
    expect(statusOptions(container)).toEqual([]);
  });

  test('the order is submitted as a draft', () => {
    const onSubmit = mock((..._args: unknown[]) => {});
    const { container } = render(
      createElement(PurchaseOrderForm, {
        initialValues: {
          vendorId: 4,
          projectId: 3,
          status: PurchaseOrderStatus.approved,
        },
        initialItems: [
          {
            materialId: 9,
            materialName: 'OPC 53 cement',
            orderedQuantity: 10,
            unitPrice: 400,
            remarks: '',
          },
        ],
        onSubmit,
      })
    );

    fireEvent.submit(
      container.querySelector('#purchase-order-form') as HTMLFormElement
    );

    const data = onSubmit.mock.calls.at(-1)?.[0] as {
      form: { status: string };
    };
    expect(data.form.status).toBe(PurchaseOrderStatus.draft);
  });
});
