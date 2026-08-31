import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realMaterialHooks from '@tornotron/echno-core/materials/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realVendorHooks from '@tornotron/echno-core/vendor/hooks';
import * as realStorageLocationHooks from '@tornotron/echno-core/storage-locations/hooks';
import * as realPurchaseOrderHooks from '@tornotron/echno-core/purchase-orders/hooks';

mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialHooks,
  useMaterials: () => ({
    data: [{ id: 2, materialName: 'TNT Steel', unit: 'MT' }],
  }),
}));
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({ data: [{ id: 7, projectName: 'Marina Tower' }] }),
}));
mock.module('@tornotron/echno-core/vendor/hooks', () => ({
  ...realVendorHooks,
  useVendors: () => ({ data: [{ id: 5, name: 'Acme Supplies' }] }),
}));
mock.module('@tornotron/echno-core/storage-locations/hooks', () => ({
  ...realStorageLocationHooks,
  useStorageLocations: () => ({ data: [] }),
}));
mock.module('@tornotron/echno-core/purchase-orders/hooks', () => ({
  ...realPurchaseOrderHooks,
  usePurchaseOrders: () => ({ data: [{ id: 11, poNumber: 'PO-2026-011' }] }),
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

const { GoodsReceiptForm } = await import('./goods-receipt-form');

/**
 * `DocumentNumberAllocator` allocates the GRN number per organization,
 * document type and year, and `GoodsReceivedNoteService` calls it
 * unconditionally before it saves. `GoodsReceivedNoteCreationDto` declares no
 * `grnNumber`, so the key the browser sent was read off nothing and dropped.
 *
 * The field was read-only here rather than typed, which does not make it
 * harmless: it showed a number predicted from the list this browser happened to
 * have loaded, and people read that off the screen and wrote it on the paper
 * the delivery came with. Two receivers on this form at once saw the same
 * prediction and got different allocations.
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

describe('GoodsReceiptForm GRN number', () => {
  afterEach(() => {
    cleanup();
  });

  test('the form does not show a GRN number', () => {
    const { container } = render(
      createElement(GoodsReceiptForm, { onSubmit: () => {} })
    );

    // Asserted as a boolean on purpose: a failing assertion that prints a
    // Radix DOM node hangs the reporter rather than reporting.
    expect(container.querySelector('#grnNumber') === null).toBe(true);
    expect(container.textContent).not.toContain('GRN Number');
  });

  test('nothing named grnNumber reaches the submit payload', () => {
    const onSubmit = mock((..._args: unknown[]) => {});
    const { container } = render(
      createElement(GoodsReceiptForm, { onSubmit })
    );

    // The form has to reach a valid submit for this to mean anything: a
    // blocked one never calls `onSubmit`, and reading the keys off an absent
    // payload passes whatever the form does.
    choose(container, 'vendorId', 'Acme Supplies');
    choose(container, 'purchaseOrderId', 'PO-2026-011');
    choose(container, 'projectId', 'Marina Tower');
    chooseInRow(container, 'TNT Steel');
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as {
      form: Record<string, unknown>;
    };
    expect(Object.keys(submitted.form)).not.toContain('grnNumber');
  });
});

/**
 * `GoodsReceivedNoteService.createGoodsReceivedNoteInTransaction` resolves both
 * the project and the purchase order with `orElseThrow` and no null guard, so a
 * receipt without either is refused. The form marked both "(optional)" and
 * offered an explicit "None", so choosing what it offered filled the whole
 * document and then lost it to a server error: a 400 for the project, which at
 * least carries the field, and for the purchase order a 404 reading "Purchase
 * order with ID null was not found in this organization", which names no field
 * at all.
 *
 * This is the inverse of the GRN-number bug above. There the form asked for a
 * field the server ignores; here it marks optional two the server demands.
 */
describe('GoodsReceiptForm required fields', () => {
  afterEach(() => {
    cleanup();
  });

  test('purchase order and project are marked required, not optional', () => {
    const { container } = render(
      createElement(GoodsReceiptForm, { onSubmit: () => {} })
    );

    for (const id of ['purchaseOrderId', 'projectId']) {
      const label = container.querySelector(`label[for="${id}"]`);
      expect(label === null).toBe(false);
      expect(label?.textContent).toContain('*');
      expect(label?.textContent).not.toContain('optional');
    }
  });

  test('neither select offers a None the server would reject', () => {
    const { container } = render(
      createElement(GoodsReceiptForm, { onSubmit: () => {} })
    );

    for (const id of ['purchaseOrderId', 'projectId']) {
      const trigger = container.querySelector(`#${id}`) as HTMLElement;
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      const none = [...document.body.querySelectorAll('[role="option"]')].some(
        (o) => o.textContent?.trim() === 'None'
      );
      expect(none).toBe(false);
      fireEvent.keyDown(trigger, { key: 'Escape' });
    }
  });

  test('submitting without them is blocked here, not at the server', () => {
    const onSubmit = mock((..._args: unknown[]) => {});
    const { container } = render(createElement(GoodsReceiptForm, { onSubmit }));

    choose(container, 'vendorId', 'Acme Supplies');
    chooseInRow(container, 'TNT Steel');
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledTimes(0);
    expect(container.textContent).toContain('Purchase order is required');
    expect(container.textContent).toContain('Project is required');
  });

  test('choosing both clears the block and lets the receipt through', () => {
    const onSubmit = mock((..._args: unknown[]) => {});
    const { container } = render(createElement(GoodsReceiptForm, { onSubmit }));

    choose(container, 'vendorId', 'Acme Supplies');
    choose(container, 'purchaseOrderId', 'PO-2026-011');
    choose(container, 'projectId', 'Marina Tower');
    chooseInRow(container, 'TNT Steel');
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as {
      form: { purchaseOrderId: number; projectId: number };
    };
    expect(submitted.form.purchaseOrderId).toBe(11);
    expect(submitted.form.projectId).toBe(7);
  });
});
