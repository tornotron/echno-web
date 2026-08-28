import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realMaterialHooks from '@tornotron/echno-core/materials/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realStorageLocationHooks from '@tornotron/echno-core/storage-locations/hooks';
import * as realTaskHooks from '@tornotron/echno-core/task/hooks';

/**
 * Staging, trimmed to the rows that produced the report. Material 2 has 60 MT
 * across the organisation and nothing at all in project 3, which is the gap the
 * form was hiding.
 */
const MATERIALS = [{ id: 2, materialName: 'TNT Steel', unit: 'MT' }];
const PROJECTS = [
  { id: 3, projectName: 'Test 2' },
  { id: 6, projectName: 'Riverside' },
];
const STORAGE_LOCATIONS = [
  // No owning project. Seven of the thirteen rows on staging look like this.
  { id: 14, locationName: 'Godown', projectId: undefined },
  // Owned by a different project, so it can never hold stock for project 3.
  { id: 4, locationName: 'Riverside Store', projectId: 6 },
];
const TASKS = [
  { id: 42, title: 'Build the concrete wall', projectId: 3 },
  { id: 43, title: 'Backfill', projectId: 6 },
];

/** What the organisation-wide aggregate endpoint reports: the misleading 60. */
const AGGREGATE_STOCK = { currentStock: 60, unit: 'MT' };

/** What the location the write is checked against actually holds. */
let scopedStock: { currentStock: number; unit: string } | undefined = {
  currentStock: 0,
  unit: 'MT',
};

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
mock.module('@tornotron/echno-core/task/hooks', () => ({
  ...realTaskHooks,
  useTasks: () => ({ data: TASKS }),
}));
mock.module('@/hooks/materials', () => ({
  useMaterialStock: () => ({ data: scopedStock }),
}));

const toast = {
  success: mock((..._args: unknown[]) => {}),
  error: mock((..._args: unknown[]) => {}),
  info: mock((..._args: unknown[]) => {}),
  warning: mock((..._args: unknown[]) => {}),
};
mock.module('@/lib/styles/toast-styles', () => ({ toast }));

const { MaterialConsumptionForm } = await import(
  './material-consumption-form'
);

// ---------------------------------------------------------------------------
// Driving the form
// ---------------------------------------------------------------------------

/** Opens a shadcn/Radix select and returns its rendered options. */
function openSelect(container: HTMLElement, id: string): HTMLElement[] {
  const trigger = container.querySelector(`#${id}`) as HTMLElement;
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  return [...document.body.querySelectorAll('[role="option"]')] as HTMLElement[];
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

function typeQuantity(container: HTMLElement, value: string) {
  fireEvent.change(container.querySelector('#quantity') as HTMLInputElement, {
    target: { value },
  });
}

function submit(container: HTMLElement) {
  fireEvent.submit(container.querySelector('form') as HTMLFormElement);
}

function renderForm(props: { fromTaskId?: number; fromTaskTitle?: string }) {
  const onSubmit = mock((..._args: unknown[]) => {});
  const view = render(
    createElement(MaterialConsumptionForm, { ...props, onSubmit } as never)
  );
  return { ...view, onSubmit };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MaterialConsumptionForm', () => {
  beforeEach(() => {
    scopedStock = { currentStock: 0, unit: 'MT' };
  });

  afterEach(() => {
    cleanup();
    toast.error.mockClear();
  });

  test('shows the balance at the chosen project and location, not the organisation total', () => {
    const { container } = renderForm({});

    chooseOption(container, 'projectId', 'Test 2');
    chooseOption(container, 'storageLocationId', 'Godown');
    chooseOption(container, 'materialId', 'TNT Steel');

    // 60 is the sum over every project and location in the organisation. The
    // write is checked against one row, and that row holds nothing.
    expect(container.textContent).toContain('Current stock: 0 MT');
    expect(container.textContent).not.toContain('60');
  });

  test('does not offer a storage location belonging to another project', () => {
    const { container } = renderForm({});

    chooseOption(container, 'projectId', 'Test 2');
    const offered = openSelect(container, 'storageLocationId')
      .map((option) => option.textContent ?? '')
      .join(' | ');

    // Organisation-level locations stay available from every project.
    expect(offered).toContain('Godown');
    // Riverside Store belongs to project 6 and can never hold stock for 3.
    expect(offered).not.toContain('Riverside Store');
  });

  test('refuses a quantity the chosen location cannot cover, and says what it holds', () => {
    const { container, onSubmit } = renderForm({});

    chooseOption(container, 'projectId', 'Test 2');
    chooseOption(container, 'storageLocationId', 'Godown');
    chooseOption(container, 'materialId', 'TNT Steel');
    typeQuantity(container, '1');
    submit(container);

    expect(onSubmit).not.toHaveBeenCalled();
    // The rejection the backend would return names the figure; so should this.
    expect(container.textContent).toContain('0 MT');
  });

  test('lets a covered quantity through', () => {
    scopedStock = { currentStock: 32, unit: 'MT' };
    const { container, onSubmit } = renderForm({});

    chooseOption(container, 'projectId', 'Test 2');
    chooseOption(container, 'storageLocationId', 'Godown');
    chooseOption(container, 'materialId', 'TNT Steel');
    typeQuantity(container, '30');
    submit(container);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('will not submit without a project, which the API requires', () => {
    const { container, onSubmit } = renderForm({});

    chooseOption(container, 'materialId', 'TNT Steel');
    typeQuantity(container, '1');
    submit(container);

    // MaterialConsumptionCreationDto has @NotNull on projectId, so leaving it
    // unset buys a raw 400 rather than a field error.
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('inherits the project from the task and does not offer a choice', () => {
    const { container } = renderForm({
      fromTaskId: 42,
      fromTaskTitle: 'Build the concrete wall',
    });

    // The task belongs to project 3. Offering a free choice the API will reject
    // is the defect; the project has to be shown and locked.
    expect(container.textContent).toContain('Test 2');
    // Counted rather than compared to null: a failing assertion that prints a
    // Radix trigger element stalls the reporter serializing it.
    expect(container.querySelectorAll('button#projectId').length).toBe(0);
  });

  test('submits the task project rather than nothing', () => {
    scopedStock = { currentStock: 32, unit: 'MT' };
    const { container, onSubmit } = renderForm({
      fromTaskId: 42,
      fromTaskTitle: 'Build the concrete wall',
    });

    chooseOption(container, 'storageLocationId', 'Godown');
    chooseOption(container, 'materialId', 'TNT Steel');
    typeQuantity(container, '1');
    submit(container);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const data = onSubmit.mock.calls[0][0] as {
      form: { projectId: number; taskId: number };
    };
    expect(data.form.projectId).toBe(3);
    expect(data.form.taskId).toBe(42);
  });
});
