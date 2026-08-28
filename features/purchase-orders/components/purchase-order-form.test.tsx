import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realMaterialHooks from '@tornotron/echno-core/materials/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realVendorHooks from '@tornotron/echno-core/vendor/hooks';
import * as realIndentHooks from '@tornotron/echno-core/indents/hooks';
import * as realPurchaseOrderHooks from '@tornotron/echno-core/purchase-orders/hooks';

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
