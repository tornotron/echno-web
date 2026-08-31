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
/**
 * The cited order: 100 asked for on one line, 95 of it already in.
 *
 * `receivedQuantity` is the field echno-backend#659 made real. It was written 0
 * at creation and never again, so the 95 here is a figure no order could have
 * carried before that change.
 */
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

mock.module('@tornotron/echno-core/purchase-orders/hooks', () => ({
  ...realPurchaseOrderHooks,
  usePurchaseOrders: () => ({ data: [ORDER] }),
  usePurchaseOrder: (id: number) => ({
    data: id === ORDER.id ? ORDER : undefined,
  }),
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
  },
}));

/** The page clears the draft once the receipt exists; nothing here reads it. */
const clearDraft = () => {};

// `mock.module` replaces the module for the whole test process, so the double
// has to carry every export the module has, not only the ones this file uses:
// a file that runs after this one and imports `useClearFormDraft` gets this
// object, and a missing key is a module-resolution error rather than a test
// failure that names itself.
mock.module('@/hooks/use-form-draft', () => ({
  useFormDraftScope: () => ({ userId: 'u1', orgId: 1 }),
  useFormDraft: () => ({
    draft: null,
    restoreDraft: () => {},
    discardDraft: () => {},
  }),
  useClearFormDraft: () => clearDraft,
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

/**
 * What the order still expects, while the quantities are being typed.
 *
 * Before echno-backend#659 the form asked for the ordered quantity and the
 * server stored whatever came back, so the column was a free-text field whose
 * value meant nothing. The server now takes that figure from the order itself
 * and refuses a receipt that exceeds it, which makes both halves of this worth
 * showing: the order's own figure, and what is left of it. A form that shows
 * neither turns a rule the receiver could have seen coming into a 400 they
 * discover with the document already filled in.
 *
 * `receivedQuantity` on an order line is the thing that had to change on the
 * server for any of this to be true. It was written 0 at creation and never
 * again, so an outstanding figure derived from it used to be the ordered
 * quantity under another name.
 */
/** Renders with the order chosen and one row for a material on it. */
function withTheOrderChosen(): HTMLElement {
  const { container } = render(
    createElement(GoodsReceiptForm, { onSubmit: () => {} })
  );
  choose(container, 'vendorId', 'Acme Supplies');
  choose(container, 'purchaseOrderId', 'PO-2026-011');
  choose(container, 'projectId', 'Marina Tower');
  chooseInRow(container, 'TNT Steel');
  return container;
}

describe('GoodsReceiptForm outstanding quantities', () => {
  afterEach(() => {
    cleanup();
  });

  test('the order says what is still expected, and what has already arrived', () => {
    const container = withTheOrderChosen();

    const shown = container.textContent ?? '';
    expect(shown).toContain('Still Expected');
    expect(shown).toContain('95 already received');
  });

  test('the ordered quantity is read from the order, not collected', () => {
    const container = withTheOrderChosen();

    // One number input per row for the received quantity and one for the unit
    // cost. A third would be the ordered quantity still being typed, which the
    // server overwrites from the order anyway.
    const numbers = container.querySelectorAll(
      'tbody input[type="number"]'
    ).length;
    expect(numbers).toBe(2);
    expect(container.textContent).toContain('from the order');
  });

  test("the order's figure is what the payload carries", () => {
    const onSubmit = mock((..._args: unknown[]) => {});
    const { container } = render(
      createElement(GoodsReceiptForm, { onSubmit })
    );
    choose(container, 'vendorId', 'Acme Supplies');
    choose(container, 'purchaseOrderId', 'PO-2026-011');
    choose(container, 'projectId', 'Marina Tower');
    chooseInRow(container, 'TNT Steel');
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as {
      items: Array<{ orderedQuantity: number }>;
    };
    expect(submitted.items[0].orderedQuantity).toBe(100);
  });

  test('a quantity past what is outstanding is flagged before it is sent', () => {
    const container = withTheOrderChosen();
    const received = container.querySelectorAll(
      'tbody input[type="number"]'
    )[0] as HTMLInputElement;

    fireEvent.change(received, { target: { value: '20' } });

    expect(container.textContent).toContain('More than this order expects');
  });

  test('a quantity inside it is not', () => {
    const container = withTheOrderChosen();
    const received = container.querySelectorAll(
      'tbody input[type="number"]'
    )[0] as HTMLInputElement;

    fireEvent.change(received, { target: { value: '5' } });

    expect(container.textContent).not.toContain('More than this order expects');
  });
});
