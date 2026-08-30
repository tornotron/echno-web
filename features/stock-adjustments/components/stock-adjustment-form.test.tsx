import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realMaterialHooks from '@tornotron/echno-core/materials/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realStorageLocationHooks from '@tornotron/echno-core/storage-locations/hooks';
import type { StockAdjustment } from '@/types/resource';

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

/**
 * Mutable so a test can hold the query in its unresolved state (`undefined`)
 * and then let it land, the way a cold cache behaves. Defaults to loaded.
 */
let storageLocationList: typeof STORAGE_LOCATIONS | undefined =
  STORAGE_LOCATIONS;

mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialHooks,
  useMaterials: () => ({ data: MATERIALS }),
  useMaterialWithStock: () => ({ data: undefined }),
}));
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({ data: PROJECTS }),
}));
mock.module('@tornotron/echno-core/storage-locations/hooks', () => ({
  ...realStorageLocationHooks,
  useStorageLocations: () => ({ data: storageLocationList }),
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
  },
}));

const { StockAdjustmentForm } = await import('./stock-adjustment-form');

/**
 * A document as the edit and copy pages hand it in, with every field the
 * validation demands already filled, so a submit stands or falls on the
 * storage location alone.
 */
function document(projectId: number, locationId: number): StockAdjustment {
  return {
    id: 21,
    adjustmentNumber: 'SA-2026-0100',
    adjustmentDate: new Date('2026-08-20'),
    type: 'Physical Count',
    projectId,
    locationId,
    justification: 'Monthly count',
    notes: '',
    lineItems: [
      {
        id: 1,
        materialId: 2,
        description: 'TNT Steel',
        systemQuantity: 400,
        physicalQuantity: 370,
        unit: 'MT',
        unitValue: 100,
        reason: 'Data correction',
      },
    ],
  } as unknown as StockAdjustment;
}

function renderForm(initial: StockAdjustment) {
  const onSubmit = mock((..._args: unknown[]) => {});
  const view = render(
    createElement(StockAdjustmentForm, { initial, onSubmit })
  );
  return { ...view, onSubmit };
}

function submit(container: HTMLElement) {
  fireEvent.submit(container.querySelector('form') as HTMLFormElement);
}

describe('StockAdjustmentForm storage location on a cold cache', () => {
  afterEach(() => {
    cleanup();
    storageLocationList = STORAGE_LOCATIONS;
  });

  test("the document's location survives the query resolving after mount", () => {
    // A fresh tab on the edit or copy page: the form mounts with the document
    // before the location query has resolved. The scope reset used to run
    // against that empty list and zero the document's location, so a save that
    // changed only the notes was refused, and re-picking from memory could
    // silently move the adjustment onto a different balance row.
    storageLocationList = undefined;
    const { container, rerender, onSubmit } = renderForm(document(6, 4));

    storageLocationList = STORAGE_LOCATIONS;
    rerender(
      createElement(StockAdjustmentForm, { initial: document(6, 4), onSubmit })
    );

    submit(container);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as {
      form: { storageLocationId: number };
    };
    expect(submitted.form.storageLocationId).toBe(4);
  });

  test("a document already sitting on another project's location keeps it", () => {
    // Location 4 belongs to project 6, so on a document naming project 3 the
    // strict scope does not offer it and the reset used to zero the field,
    // leaving a save that changed only the notes to move the correction onto a
    // different balance row or be refused outright.
    //
    // That pairing is exactly what backend#572 lets an adjustment correct when
    // a balance already sits there, and it is the shape of the documents raised
    // through the API for issue #563 because the form could not draft one. The
    // form recognises it and comes up in the correction path, so the location
    // the document arrived with survives.
    storageLocationList = undefined;
    const { container, rerender, onSubmit } = renderForm(document(3, 4));

    storageLocationList = STORAGE_LOCATIONS;
    rerender(
      createElement(StockAdjustmentForm, { initial: document(3, 4), onSubmit })
    );

    submit(container);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as {
      form: { storageLocationId: number };
    };
    expect(submitted.form.storageLocationId).toBe(4);
  });
});

describe('StockAdjustmentForm balance-correction scope', () => {
  afterEach(() => {
    cleanup();
    storageLocationList = STORAGE_LOCATIONS;
  });

  test("a document on another project's location comes up in the correction path", () => {
    const { getByRole } = renderForm(document(3, 4));
    expect(getByRole('checkbox').getAttribute('aria-checked')).toBe('true');
  });

  test('an ordinary document does not, so the strict scope is what it gets', () => {
    // Project 6 owns location 4, so this document is inside its own scope and
    // has no reason to be offered every location in the organisation.
    const { getByRole } = renderForm(document(6, 4));
    expect(getByRole('checkbox').getAttribute('aria-checked')).toBe('false');
  });

  test('turning it off puts the document back inside the strict scope', () => {
    // The widening is what holds a cross-project location on the document, so
    // withdrawing it drops that location and blocks the submit, which is the
    // strict behaviour every other document gets.
    const { container, getByRole, onSubmit } = renderForm(document(3, 4));

    fireEvent.click(getByRole('checkbox'));
    expect(getByRole('checkbox').getAttribute('aria-checked')).toBe('false');

    submit(container);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
