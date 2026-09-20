import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createEmptySchema } from '@/types/inspection';
import { useBuilderStore } from '@/features/inspections/builder/use-builder-store';
import { ChecklistBuilder } from './checklist-builder';

// The builder saves through the page, which owns the mutation; here the save
// is a plain promise so the test can decide whether it lands or fails.

beforeEach(() => {
  useBuilderStore.setState({
    schema: { ...createEmptySchema(), title: 'Rebar' },
    selectedElementId: undefined,
    mode: 'builder',
    dirty: true,
    saving: false,
    past: [],
    future: [],
  });
});

afterEach(cleanup);

/** The toolbar Save button, found by the tooltip it carries in every state. */
function saveButton(container: HTMLElement): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(
    'button[title^="Saves the checklist"]'
  );
  if (!button) throw new Error('Save button not rendered');
  return button;
}

describe('ChecklistBuilder save', () => {
  test('closes the builder once the save has gone through', async () => {
    const onSave = mock(() => Promise.resolve());
    const onClose = mock(() => {});
    const { container } = render(
      createElement(ChecklistBuilder, { onSave, onClose })
    );

    fireEvent.click(saveButton(container));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({ title: 'Rebar' });
  });

  test('stays open when the save fails', async () => {
    const onSave = mock(() => Promise.reject(new Error('422')));
    const onClose = mock(() => {});
    const { container } = render(
      createElement(ChecklistBuilder, { onSave, onClose })
    );

    fireEvent.click(saveButton(container));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    // give a resolved close every chance to have fired before asserting it did not
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onClose).not.toHaveBeenCalled();
  });

  test('the Close button still asks before discarding unsaved edits', () => {
    const onSave = mock(() => Promise.resolve());
    const onClose = mock(() => {});
    const { getByLabelText, getByText } = render(
      createElement(ChecklistBuilder, { onSave, onClose })
    );

    fireEvent.click(getByLabelText('Close builder'));

    expect(getByText('Discard unsaved changes?')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
