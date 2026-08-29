import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realMaterialHooks from '@tornotron/echno-core/materials/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realStorageLocationHooks from '@tornotron/echno-core/storage-locations/hooks';
import * as realSiteTransferHooks from '@tornotron/echno-core/site-transfers/hooks';

/**
 * The transfer list the mocked `useSiteTransfers` hands back. It starts empty
 * because that is the state of the cache on the first render, before the
 * request resolves. Reassigning it and re-rendering reproduces the load.
 */
let transfers: { transferNumber: string }[] = [];

const MATERIALS = [{ id: 2, materialName: 'TNT Steel', unit: 'MT' }];

const PROJECTS = [
  { id: 3, projectName: 'Test 2' },
  { id: 6, projectName: 'Riverside' },
];

/** Shaped after staging: half the locations carry no owning project. */
const STORAGE_LOCATIONS = [
  { id: 14, locationName: 'Godown', projectId: undefined },
  { id: 2, locationName: 'Central Warehouse', projectId: undefined },
  { id: 4, locationName: 'Riverside Store', projectId: 6 },
];

/** What the organisation-wide aggregate reports: the misleading total. */
const AGGREGATE_STOCK = { currentStock: 60, unit: 'MT' };

/** What the sending project and location actually hold. */
let scopedStock = new Map<number, { currentStock: number; unit: string }>();

mock.module('@tornotron/echno-core/site-transfers/hooks', () => ({
  ...realSiteTransferHooks,
  useSiteTransfers: () => ({ data: transfers }),
}));
mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialHooks,
  useMaterials: () => ({ data: MATERIALS }),
  useMaterialWithStock: () => ({ data: AGGREGATE_STOCK }),
}));
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({ data: PROJECTS }),
}));
mock.module('@tornotron/echno-core/storage-locations/hooks', () => ({
  ...realStorageLocationHooks,
  useStorageLocations: () => ({ data: STORAGE_LOCATIONS }),
}));
// Both exports are named even though this form only uses the plural one:
// `mock.module` replaces the whole module record, and a partial replacement
// leaves the consumption form's test unable to link `useMaterialStock`.
mock.module('@/hooks/materials', () => ({
  useMaterialStock: () => ({ data: scopedStock.get(0) }),
  useMaterialStocks: () => scopedStock,
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

const { SiteTransferForm } = await import('./site-transfer-form');

const year = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Driving the form
// ---------------------------------------------------------------------------

/** Opens a shadcn/Radix select and returns its rendered options. */
function openSelect(container: HTMLElement, id: string): HTMLElement[] {
  const trigger = container.querySelector(`#${id}`) as HTMLElement;
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  return [...document.body.querySelectorAll('[role="option"]')] as HTMLElement[];
}

function offeredBy(container: HTMLElement, id: string): string {
  return openSelect(container, id)
    .map((option) => option.textContent ?? '')
    .join(' | ');
}

function chooseOption(container: HTMLElement, id: string, label: string) {
  const options = openSelect(container, id);
  const match = options.find((option) => option.textContent?.includes(label));
  if (!match) {
    throw new Error(
      `"${label}" was not offered by #${id}. Offered: ${options
        .map((option) => option.textContent)
        .join(', ')}`
    );
  }
  fireEvent.click(match);
}

/** The label a Radix trigger currently shows, placeholder included. */
function chosen(container: HTMLElement, id: string): string {
  return (container.querySelector(`#${id}`) as HTMLElement).textContent ?? '';
}

function typeQuantity(container: HTMLElement, value: string) {
  fireEvent.change(
    container.querySelector('#sentQuantity-0') as HTMLInputElement,
    { target: { value } }
  );
}

function submit(container: HTMLElement) {
  fireEvent.submit(container.querySelector('form') as HTMLFormElement);
}

function renderForm() {
  const onSubmit = mock((..._args: unknown[]) => {});
  const view = render(createElement(SiteTransferForm, { onSubmit }));
  return { ...view, onSubmit };
}

function transferNumberField(container: HTMLElement) {
  return (container.querySelector('#transferNumber') as HTMLInputElement).value;
}

// ---------------------------------------------------------------------------
// Transfer number
// ---------------------------------------------------------------------------

describe('SiteTransferForm transfer number', () => {
  afterEach(() => {
    cleanup();
    transfers = [];
  });

  test('advances past the transfer numbers already on the server', () => {
    // First render: the list query has not resolved, so the form has nothing to
    // count from and offers the first number of the year.
    const { container, rerender } = render(
      createElement(SiteTransferForm, { onSubmit: () => {} })
    );
    expect(transferNumberField(container)).toBe(`TRF-${year}-000001`);

    // The list resolves and it already holds that number. The form has to move
    // on; leaving it where it is guarantees a duplicate on submit.
    transfers = [{ transferNumber: `TRF-${year}-000001` }];
    rerender(createElement(SiteTransferForm, { onSubmit: () => {} }));

    expect(transferNumberField(container)).toBe(`TRF-${year}-000002`);
  });

  test('keeps following the list as later transfers arrive', () => {
    const { container, rerender } = render(
      createElement(SiteTransferForm, { onSubmit: () => {} })
    );

    transfers = [{ transferNumber: `TRF-${year}-000001` }];
    rerender(createElement(SiteTransferForm, { onSubmit: () => {} }));
    expect(transferNumberField(container)).toBe(`TRF-${year}-000002`);

    // A second page of the list, or a refetch after someone else created one.
    transfers = [
      { transferNumber: `TRF-${year}-000001` },
      { transferNumber: `TRF-${year}-000007` },
    ];
    rerender(createElement(SiteTransferForm, { onSubmit: () => {} }));
    expect(transferNumberField(container)).toBe(`TRF-${year}-000008`);
  });
});

// ---------------------------------------------------------------------------
// Storage location scope
// ---------------------------------------------------------------------------

describe('SiteTransferForm storage location scope', () => {
  beforeEach(() => {
    scopedStock = new Map([[2, { currentStock: 0, unit: 'MT' }]]);
  });

  afterEach(() => {
    cleanup();
    transfers = [];
  });

  test('offers each side only the locations its own project may use', () => {
    const { container } = renderForm();

    chooseOption(container, 'sendingProjectId', 'Test 2');
    const sending = offeredBy(container, 'sendingStorageLocationId');

    // Organisation-level locations stay available from every project.
    expect(sending).toContain('Godown');
    // Riverside Store belongs to project 6, so project 3 can never draw on it.
    expect(sending).not.toContain('Riverside Store');
  });

  test('offers the receiving side its own project, not the sending one', () => {
    const { container } = renderForm();

    chooseOption(container, 'sendingProjectId', 'Test 2');
    chooseOption(container, 'receivingProjectId', 'Riverside');
    const receiving = offeredBy(container, 'receivingStorageLocationId');

    // Scoped to the receiving project, which does own Riverside Store.
    expect(receiving).toContain('Riverside Store');
  });

  test('drops the sending location from the receiving list when both sides are one project', () => {
    const { container } = renderForm();

    chooseOption(container, 'sendingProjectId', 'Test 2');
    chooseOption(container, 'sendingStorageLocationId', 'Godown');
    chooseOption(container, 'receivingProjectId', 'Test 2');
    const receiving = offeredBy(container, 'receivingStorageLocationId');

    // Same project and same location is one `current_stock` row, so nothing
    // moves and echno-backend#554 rejects it with a 400.
    expect(receiving).not.toContain('Godown');
    // Store to store within one project is a real move and stays on offer.
    expect(receiving).toContain('Central Warehouse');
  });

  test('resets a side location when that side project changes, leaving the other side alone', () => {
    const { container } = renderForm();

    chooseOption(container, 'sendingProjectId', 'Riverside');
    chooseOption(container, 'sendingStorageLocationId', 'Riverside Store');
    chooseOption(container, 'receivingProjectId', 'Test 2');
    chooseOption(container, 'receivingStorageLocationId', 'Godown');

    // Project 3 does not own Riverside Store, so the choice cannot survive.
    chooseOption(container, 'sendingProjectId', 'Test 2');

    expect(chosen(container, 'sendingStorageLocationId')).not.toContain(
      'Riverside Store'
    );
    // The receiving side was not touched and must not be cleared with it.
    expect(chosen(container, 'receivingStorageLocationId')).toContain('Godown');
  });
});

// ---------------------------------------------------------------------------
// Stock figure
// ---------------------------------------------------------------------------

describe('SiteTransferForm stock', () => {
  beforeEach(() => {
    scopedStock = new Map([[2, { currentStock: 0, unit: 'MT' }]]);
  });

  afterEach(() => {
    cleanup();
    transfers = [];
  });

  test('shows the balance at the sending project and location, not the organisation total', () => {
    const { container } = renderForm();

    chooseOption(container, 'sendingProjectId', 'Test 2');
    chooseOption(container, 'sendingStorageLocationId', 'Godown');
    chooseOption(container, 'materialId-0', 'TNT Steel');

    // 60 is the sum over every project and location. The transfer is debited
    // from one row, and that row holds nothing.
    expect(container.textContent).toContain('0 MT');
    expect(container.textContent).not.toContain('60');
  });

  test('refuses a quantity the sending location cannot cover, and says what it holds', () => {
    const { container, onSubmit } = renderForm();

    chooseOption(container, 'sendingProjectId', 'Test 2');
    chooseOption(container, 'sendingStorageLocationId', 'Godown');
    chooseOption(container, 'receivingProjectId', 'Riverside');
    chooseOption(container, 'receivingStorageLocationId', 'Riverside Store');
    chooseOption(container, 'materialId-0', 'TNT Steel');
    typeQuantity(container, '5');
    submit(container);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Only 0 MT');
  });

  test('lets a covered quantity through', () => {
    scopedStock = new Map([[2, { currentStock: 32, unit: 'MT' }]]);
    const { container, onSubmit } = renderForm();

    chooseOption(container, 'sendingProjectId', 'Test 2');
    chooseOption(container, 'sendingStorageLocationId', 'Godown');
    chooseOption(container, 'receivingProjectId', 'Riverside');
    chooseOption(container, 'receivingStorageLocationId', 'Riverside Store');
    chooseOption(container, 'materialId-0', 'TNT Steel');
    typeQuantity(container, '30');
    submit(container);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('keeps a store to store move within one project submittable', () => {
    scopedStock = new Map([[2, { currentStock: 32, unit: 'MT' }]]);
    const { container, onSubmit } = renderForm();

    chooseOption(container, 'sendingProjectId', 'Test 2');
    chooseOption(container, 'sendingStorageLocationId', 'Godown');
    chooseOption(container, 'receivingProjectId', 'Test 2');
    chooseOption(container, 'receivingStorageLocationId', 'Central Warehouse');
    chooseOption(container, 'materialId-0', 'TNT Steel');
    typeQuantity(container, '5');
    submit(container);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const data = onSubmit.mock.calls[0][0] as {
      form: {
        sendingStorageLocationId: number;
        receivingStorageLocationId: number;
      };
    };
    expect(data.form.sendingStorageLocationId).toBe(14);
    expect(data.form.receivingStorageLocationId).toBe(2);
  });
});
