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
  useProjects: () => ({ data: [] }),
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
  usePurchaseOrders: () => ({ data: [] }),
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
    chooseInRow(container, 'TNT Steel');
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as {
      form: Record<string, unknown>;
    };
    expect(Object.keys(submitted.form)).not.toContain('grnNumber');
  });
});
