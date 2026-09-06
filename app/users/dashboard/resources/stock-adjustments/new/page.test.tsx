/**
 * Raising the stock adjustment that closes a site transfer's variance.
 *
 * A cross-project transfer received short leaves a quantity accounted for at
 * neither site, and the transfer writes no loss movement for it on purpose. The
 * only thing that settles it is an adjustment naming the transfer, and until
 * echno-web#398 there was no route to one: no reference on the payload, so a
 * form filled in from a transfer would post a document with no link back to it
 * and the variance would stay open however many adjustments were raised.
 *
 * The things worth pinning are the ways this can be got wrong:
 *
 * - carrying the reference on screen and dropping it on submit, which is the
 *   original defect wearing a prefilled form;
 * - prefilling the receiving site, which is the one balance the transfer cannot
 *   have left wrong;
 * - asserting a counted figure, which writes off the shortfall before anybody
 *   has been to the shelf;
 * - prefilling against a transfer with no open variance, which invents a
 *   discrepancy;
 * - letting a duplicate of some other adjustment inherit its provenance.
 *
 * Assertions are on counts, strings and booleans, never on a rendered Radix
 * node: an assertion that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { SiteTransferStatus } from '@tornotron/echno-core/site-transfers/types';
import type { SiteTransfer } from '@tornotron/echno-core/site-transfers/types';
import type { StockAdjustment } from '@/types/resource';
import { toPayload } from '@/services/stock-adjustments-service';
import type { StockAdjustmentSubmitData } from '@/features/stock-adjustments/components/stock-adjustment-form';

/** The query string the page is rendered with, per test. */
let search = '';

import * as realNavigation from 'next/navigation';

mock.module('next/navigation', () => ({
  ...realNavigation,
  useSearchParams: () => new URLSearchParams(search),
  usePathname: () => '/users/dashboard/resources/stock-adjustments/new',
  useRouter: () => ({ push: () => {}, replace: () => {} }),
}));

/** The transfer `?fromTransfer=` resolves to, or undefined for a failed read. */
let transfer: SiteTransfer | undefined;
/** The adjustment `?from=` resolves to. */
let copySource: StockAdjustment | undefined;

import * as realTransferHooks from '@tornotron/echno-core/site-transfers/hooks';

mock.module('@tornotron/echno-core/site-transfers/hooks', () => ({
  ...realTransferHooks,
  useSiteTransfer: (id: number) => ({
    data: id ? transfer : undefined,
    isPending: id ? false : true,
  }),
}));

const create = mock((..._args: unknown[]) => Promise.resolve({ id: 1 }));

// Spread the real module: `hooks/stock-adjustments/index.ts` re-exports it
// wholesale, and a partial replacement leaves every other hook unresolvable to
// anything that imports through the barrel.
import * as realStockAdjustmentHooks from '@/hooks/stock-adjustments/use-stock-adjustments';

mock.module('@/hooks/stock-adjustments/use-stock-adjustments', () => ({
  ...realStockAdjustmentHooks,
  useCreateStockAdjustment: () => ({
    mutateAsync: create,
    isPending: false,
  }),
  useStockAdjustment: (id: number) => ({
    data: id ? copySource : undefined,
    isPending: id ? false : true,
  }),
}));

const MATERIALS = [
  { id: 21, materialName: 'TNT Steel', unit: 'MT' },
  { id: 22, materialName: 'Cement', unit: 'bags' },
];

import * as realMaterialHooks from '@tornotron/echno-core/materials/hooks';

mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialHooks,
  useMaterials: () => ({ data: MATERIALS }),
  useMaterialWithStock: () => ({ data: undefined }),
}));

import * as realProjectHooks from '@tornotron/echno-core/project/hooks';

mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({
    data: [
      { id: 2, projectName: 'Marina Tower' },
      { id: 6, projectName: 'Harbour Wing' },
    ],
  }),
}));

import * as realStorageLocationHooks from '@tornotron/echno-core/storage-locations/hooks';

mock.module('@tornotron/echno-core/storage-locations/hooks', () => ({
  ...realStorageLocationHooks,
  useStorageLocations: () => ({
    data: [
      { id: 11, locationName: 'Marina Store', projectId: 2 },
      { id: 12, locationName: 'Harbour Store', projectId: 6 },
    ],
  }),
}));

mock.module('@/hooks/materials', () => ({
  useMaterialStock: () => ({ data: undefined }),
  useMaterialStocks: () => new Map(),
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
  },
}));

const { default: CreateStockAdjustmentPage } = await import('./page');

/** Ten sent, eight recorded, two nobody can account for. */
function aShortTransfer(over: Partial<SiteTransfer> = {}): SiteTransfer {
  return {
    id: 7,
    transferNumber: 'TRF-2026-000007',
    issueDate: '2026-01-17',
    sendingPerson: { id: 3, name: 'Hrishi' },
    sendingProjectId: 2,
    sendingProjectName: 'Marina Tower',
    sendingStorageLocationId: 11,
    sendingStorageLocationName: 'Marina Store',
    receivingProjectId: 6,
    receivingProjectName: 'Harbour Wing',
    receivingStorageLocationId: 12,
    receivingStorageLocationName: 'Harbour Store',
    status: SiteTransferStatus.completed,
    items: [
      {
        id: 84,
        materialId: 21,
        materialName: 'TNT Steel',
        sentQuantity: 10,
        receivedQuantity: 8,
        inTransitQuantity: 2,
      },
      {
        id: 85,
        materialId: 22,
        materialName: 'Cement',
        sentQuantity: 40,
        receivedQuantity: 40,
        inTransitQuantity: 0,
      },
    ],
    ...over,
  };
}

afterEach(() => {
  cleanup();
  search = '';
  transfer = undefined;
  copySource = undefined;
  create.mockClear();
});

/** Renders the page and returns its container. */
function renderPage(): HTMLElement {
  return render(createElement(CreateStockAdjustmentPage)).container;
}

/** The read-only note naming the document this adjustment answers. */
function sourceNote(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-testid="source-document-note"]');
}

/** Submits the form and returns what the create mutation was handed. */
function submit(container: HTMLElement): StockAdjustmentSubmitData {
  act(() => {
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
  });
  expect(create.mock.calls.length).toBe(1);
  return create.mock.calls[0]?.[0] as StockAdjustmentSubmitData;
}

describe('the reference reaches the server', () => {
  test('a form raised from a transfer posts a payload naming that transfer', () => {
    search = 'fromTransfer=7';
    transfer = aShortTransfer();

    const submitted = submit(renderPage());
    const payload = toPayload(submitted);

    // The whole of #398: the screen said which transfer, and the request said
    // nothing, so the transfer went on showing its variance as unanswered.
    expect(payload.sourceDocumentType).toBe('SITE_TRANSFER');
    expect(payload.sourceDocumentId).toBe(7);
  });

  test('an ordinary adjustment claims no source document', () => {
    const container = renderPage();

    // A blank adjustment answers nothing, and a note saying otherwise would be
    // a claim about a document that does not exist.
    expect(sourceNote(container) === null).toBe(true);
  });

  test('the transfer is named on screen as well as on the wire', () => {
    search = 'fromTransfer=7';
    transfer = aShortTransfer();

    const container = renderPage();

    // The number the transfer is called on paper, not the internal id. A
    // storekeeper asked to check this document against a transfer has the
    // number in front of them and nothing else.
    expect(sourceNote(container)?.textContent).toContain('TRF-2026-000007');
  });

  test('nothing on the form offers to change which transfer it closes', () => {
    search = 'fromTransfer=7';
    transfer = aShortTransfer();

    const container = renderPage();

    // Provenance, not a field. An input here would let somebody attach the
    // document to a transfer it has nothing to do with.
    const note = container.querySelector(
      '[data-testid="source-document-note"]'
    ) as HTMLElement;
    expect(note.querySelectorAll('input,select,textarea').length).toBe(0);
  });
});

describe('what the prefill fills in', () => {
  test('the sending project and the sending store are chosen', () => {
    search = 'fromTransfer=7';
    transfer = aShortTransfer();

    const submitted = submit(renderPage());

    // The transfer drew the full sent quantity off the sending balance, while
    // the receiving balance was set by the count actually taken there. The
    // sending side is the only balance the transfer itself could have left
    // wrong, so seeding the receiving one sends the correction to the site that
    // is already right.
    expect(submitted.form.projectId).toBe(2);
    expect(submitted.form.storageLocationId).toBe(11);
  });

  test('one line per material still unaccounted for, and no others', () => {
    search = 'fromTransfer=7';
    transfer = aShortTransfer();

    const submitted = submit(renderPage());

    // Cement arrived in full. A line for it would be a correction of nothing,
    // and the person would have to notice and delete it.
    expect(submitted.items.length).toBe(1);
    expect(submitted.items[0].materialId).toBe(21);
    expect(submitted.items[0].description).toContain('TNT Steel');
  });

  test('the justification names the transfer and the shortfall', () => {
    search = 'fromTransfer=7';
    transfer = aShortTransfer();

    const submitted = submit(renderPage());

    expect(submitted.form.adjustmentReason).toContain('TRF-2026-000007');
    expect(submitted.form.adjustmentReason).toContain('2');
  });

  test('no counted quantity is asserted', () => {
    search = 'fromTransfer=7';
    transfer = aShortTransfer();

    const submitted = submit(renderPage());

    // A prefilled figure here writes the shortfall off as a loss at the sending
    // site before anybody has been to the shelf, which is the automatic
    // correction the transfer refuses to make.
    expect(submitted.items[0].countedStock).toBe(0);
  });

  test('every prefilled field stays editable', () => {
    search = 'fromTransfer=7';
    transfer = aShortTransfer();

    const container = renderPage();
    const reason = container.querySelector(
      '#adjustmentReason'
    ) as HTMLTextAreaElement;
    fireEvent.change(reason, { target: { value: 'Counted at Harbour' } });

    const submitted = submit(container);
    // Which site was wrong is the storekeeper's finding, not the form's.
    expect(submitted.form.adjustmentReason).toBe('Counted at Harbour');
  });
});

describe('a transfer with no open variance', () => {
  test('a cancelled transfer prefills nothing and says why', () => {
    search = 'fromTransfer=7';
    transfer = aShortTransfer({
      status: SiteTransferStatus.cancelled,
      items: [
        {
          id: 84,
          materialId: 21,
          materialName: 'TNT Steel',
          sentQuantity: 10,
          receivedQuantity: null,
          inTransitQuantity: 10,
        },
      ],
    });

    const container = renderPage();

    // Its outbound leg was reversed and the stock is back on the sending
    // balance. Seeding a correction from the leftover in-transit figure would
    // take the same stock off twice.
    expect(container.textContent).toContain('no open variance');
    expect(sourceNote(container) === null).toBe(true);
    expect(container.textContent).toContain('Select project');
  });

  test('a pending transfer prefills nothing either', () => {
    search = 'fromTransfer=7';
    transfer = aShortTransfer({
      status: SiteTransferStatus.pending,
      items: [
        {
          id: 84,
          materialId: 21,
          materialName: 'TNT Steel',
          sentQuantity: 10,
          receivedQuantity: null,
          inTransitQuantity: 10,
        },
      ],
    });

    const container = renderPage();

    expect(container.textContent).toContain('no open variance');
    expect(sourceNote(container) === null).toBe(true);
  });

  test('the form is still offered, unprefilled', () => {
    search = 'fromTransfer=7';
    transfer = aShortTransfer({ status: SiteTransferStatus.cancelled });

    const container = renderPage();

    expect(container.querySelector('form') === null).toBe(false);
  });
});

describe('a transfer that could not be read', () => {
  test('the failure is said, and no form is offered against a guess', () => {
    search = 'fromTransfer=7';
    transfer = undefined;

    const container = renderPage();

    expect(container.textContent).toContain('could not be loaded');
    expect(container.querySelector('form') === null).toBe(true);
  });
});

describe('duplicating an adjustment', () => {
  test('the copy does not inherit the original document provenance', () => {
    search = 'from=55';
    copySource = {
      id: 55,
      adjustmentNumber: 'SA-2026-0055',
      projectId: 2,
      locationId: 11,
      justification: 'Closes TRF-2026-000007',
      lineItems: [
        {
          id: 1,
          materialId: 21,
          description: 'TNT Steel',
          physicalQuantity: 4,
          unit: 'MT',
          unitValue: 100,
          reason: 'shortfall',
        },
      ],
      sourceDocumentType: 'SITE_TRANSFER',
      sourceDocumentId: 7,
    } as unknown as StockAdjustment;

    const submitted = submit(renderPage());

    // A duplicate is a new decision about a different count. Inheriting the
    // reference would tell the transfer that a second document closes it, when
    // that document was raised to answer something else.
    expect(submitted.source).toBeUndefined();
    expect(toPayload(submitted).sourceDocumentId).toBeUndefined();
    // The numbers it was copied for still come across.
    expect(submitted.form.projectId).toBe(2);
    expect(submitted.items[0].countedStock).toBe(4);
  });
});
