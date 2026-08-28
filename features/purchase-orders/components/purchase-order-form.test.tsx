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
 * The order list the mocked `usePurchaseOrders` hands back. It starts empty
 * because that is the state of the cache on the first render, before the
 * request resolves. Reassigning it and re-rendering reproduces the load.
 */
let orders: { poNumber: string }[] = [];

mock.module('@tornotron/echno-core/purchase-orders/hooks', () => ({
  ...realPurchaseOrderHooks,
  usePurchaseOrders: () => ({ data: orders }),
}));
mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialHooks,
  useMaterials: () => ({ data: [] }),
  useMaterialWithStock: () => ({ data: undefined }),
}));
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({ data: [] }),
}));
mock.module('@tornotron/echno-core/vendor/hooks', () => ({
  ...realVendorHooks,
  useVendors: () => ({ data: [] }),
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

const year = new Date().getFullYear();

function poNumberField(container: HTMLElement) {
  return container.querySelector('#poNumber') as HTMLInputElement;
}

describe('PurchaseOrderForm PO number', () => {
  afterEach(() => {
    cleanup();
    orders = [];
  });

  test('advances past the PO numbers already on the server', () => {
    // First render: the list query has not resolved, so the form has nothing to
    // count from and offers the first number of the year.
    const { container, rerender } = render(
      createElement(PurchaseOrderForm, { onSubmit: () => {} })
    );
    expect(poNumberField(container).value).toBe(`PO-${year}-000001`);

    // The list resolves and it already holds that number. Sending it again is
    // the duplicate the vendor-facing create was failing on.
    orders = [{ poNumber: `PO-${year}-000001` }];
    rerender(createElement(PurchaseOrderForm, { onSubmit: () => {} }));

    expect(poNumberField(container).value).toBe(`PO-${year}-000002`);
  });

  test('leaves a number the user typed alone once the list resolves', () => {
    // The field is editable, so re-seeding it must not overwrite a deliberate
    // entry the way it overwrites the placeholder.
    const { container, rerender } = render(
      createElement(PurchaseOrderForm, { onSubmit: () => {} })
    );

    fireEvent.change(poNumberField(container), {
      target: { value: 'PO-LEGACY-0042' },
    });

    orders = [{ poNumber: `PO-${year}-000001` }];
    rerender(createElement(PurchaseOrderForm, { onSubmit: () => {} }));

    expect(poNumberField(container).value).toBe('PO-LEGACY-0042');
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
    orders = [];
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
