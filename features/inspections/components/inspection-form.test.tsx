import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import {
  CheckItemStatus,
  InspectionStatus,
  InspectionType,
  type Inspection,
  type InspectionCheckItem,
} from '@/types/inspection';

mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({ data: [{ id: 3, projectName: 'Test' }] }),
}));
mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useEmployeeLookup: () => ({
    data: [{ id: 8, firstName: 'Ravi', lastName: 'Kumar' }],
  }),
}));

const toast = {
  success: mock((..._args: unknown[]) => {}),
  error: mock((..._args: unknown[]) => {}),
  info: mock((..._args: unknown[]) => {}),
  warning: mock((..._args: unknown[]) => {}),
};
mock.module('@/lib/styles/toast-styles', () => ({ toast }));

const { InspectionForm, INSPECTION_FORM_ID } = await import(
  './inspection-form'
);

function checkItem(
  overrides: Partial<InspectionCheckItem> = {}
): InspectionCheckItem {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    category: 'Reinforcement',
    checkPoint: 'Rebar spacing matches drawing',
    specification: '150mm c/c +/- 10mm',
    status: CheckItemStatus.PASSED,
    remarks: 'Within tolerance',
    photosRequired: true,
    photos: ['photo-1'],
    measurement: '148mm',
    expectedValue: '150mm',
    priority: 'high',
    ...overrides,
  };
}

/** An inspection whose required fields are all filled, so validation passes. */
function inspection(checkItems: InspectionCheckItem[]): Inspection {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Foundation Safety Inspection',
    type: InspectionType.SAFETY,
    status: InspectionStatus.SCHEDULED,
    projectId: 3,
    location: 'Block C, Ground Floor',
    areaInspected: 'Column grid C3-C6',
    scheduledDate: '2026-08-25',
    inspectorId: 8,
    checkItems,
    defects: [],
  } as unknown as Inspection;
}

/** Renders the edit form and returns its queries plus a submit helper. */
function renderEditForm(checkItems: InspectionCheckItem[]) {
  const onSubmit = mock((..._args: unknown[]) => {});
  const view = render(
    createElement(InspectionForm, {
      mode: 'edit',
      inspection: inspection(checkItems),
      onSubmit,
    })
  );
  return {
    ...view,
    onSubmit,
    submit: () =>
      fireEvent.submit(view.container.querySelector(`#${INSPECTION_FORM_ID}`)!),
    /** The checkItems of the most recent submit. */
    submittedCheckItems: () =>
      (onSubmit.mock.calls.at(-1)![0] as { checkItems: Record<string, unknown>[] })
        .checkItems,
  };
}

beforeEach(() => {
  for (const spy of Object.values(toast)) spy.mockReset();
});

afterEach(() => {
  cleanup();
});

// Rendering the whole form drives several Radix selects through the DOM shim,
// which is slow enough to overrun the default per-test budget.
const RENDER_TIMEOUT_MS = 20_000;

describe('InspectionForm — checkpoints in edit mode', () => {
  // The API replaces the whole checkpoint list on save, so a form that does not
  // carry the existing ones back deletes them. This is the guard on that.
  test('an untouched form hands back the checkpoints it was given', () => {
    const { submit, submittedCheckItems } = renderEditForm([checkItem()]);

    submit();

    expect(submittedCheckItems()).toEqual([
      {
        category: 'Reinforcement',
        checkPoint: 'Rebar spacing matches drawing',
        specification: '150mm c/c +/- 10mm',
        status: CheckItemStatus.PASSED,
        remarks: 'Within tolerance',
        photosRequired: true,
        photos: ['photo-1'],
        measurement: '148mm',
        expectedValue: '150mm',
        priority: 'high',
      },
    ]);
  }, RENDER_TIMEOUT_MS);

  test('the existing checkpoints are on screen to be edited', () => {
    const { getByDisplayValue, getByText } = renderEditForm([checkItem()]);

    expect(getByDisplayValue('Rebar spacing matches drawing')).toBeDefined();
    expect(getByText('Checkpoint 1')).toBeDefined();
  }, RENDER_TIMEOUT_MS);

  test('a checkpoint can be removed', () => {
    const { getByLabelText, submit, submittedCheckItems } = renderEditForm([
      checkItem(),
    ]);

    fireEvent.click(getByLabelText('Remove checkpoint 1'));
    submit();

    expect(submittedCheckItems()).toEqual([]);
  }, RENDER_TIMEOUT_MS);
});

describe('InspectionForm — adding a checkpoint', () => {
  test('a filled-in checkpoint reaches the payload, blank optionals dropped', () => {
    const { getByLabelText, getByText, submit, submittedCheckItems } =
      renderEditForm([]);

    fireEvent.click(getByText('Add checkpoint'));
    fireEvent.change(getByLabelText(/^Category/), {
      target: { value: 'Formwork' },
    });
    fireEvent.change(getByLabelText(/^Check point/), {
      target: { value: 'Props plumb and braced' },
    });
    submit();

    const items = submittedCheckItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      category: 'Formwork',
      checkPoint: 'Props plumb and braced',
      // A checkpoint is written down before it is carried out.
      status: CheckItemStatus.PENDING,
      photosRequired: false,
    });
    expect(items[0].remarks).toBeUndefined();
    expect(items[0].specification).toBeUndefined();
  }, RENDER_TIMEOUT_MS);

  test('an incomplete checkpoint blocks the save', () => {
    const { getByLabelText, getByText, submit, onSubmit } = renderEditForm([]);

    fireEvent.click(getByText('Add checkpoint'));
    fireEvent.change(getByLabelText(/^Category/), {
      target: { value: 'Formwork' },
    });
    submit();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
    expect(getByText('Check point is required')).toBeDefined();
  }, RENDER_TIMEOUT_MS);
});
