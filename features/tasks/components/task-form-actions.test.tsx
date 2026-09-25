/**
 * The task create and edit pages show their Cancel and submit buttons side by
 * side in the page header, opposite the title, the same way the other create
 * pages do. The submit button lives outside the form element, so it has to
 * reach the form through the `form` attribute or it submits nothing.
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { TaskFormActions, TASK_FORM_ID } from './task-form';

afterEach(cleanup);

describe('TaskFormActions', () => {
  test('create mode shows Cancel then Create Task, submitting the task form', () => {
    const { getAllByRole } = render(
      createElement(TaskFormActions, {
        mode: 'create',
        isSubmitting: false,
        onCancel: () => {},
      })
    );
    const buttons = getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual([
      'Cancel',
      'Create Task',
    ]);
    expect(buttons[1].getAttribute('type')).toBe('submit');
    expect(buttons[1].getAttribute('form')).toBe(TASK_FORM_ID);
  });

  test('both buttons are disabled while the task is being created', () => {
    const { getAllByRole } = render(
      createElement(TaskFormActions, {
        mode: 'create',
        isSubmitting: true,
        onCancel: () => {},
      })
    );
    const buttons = getAllByRole('button');
    expect(buttons[1].textContent).toBe('Creating...');
    expect(buttons.every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
  });

  test('edit mode adds Delete Task and submits as Save Changes', () => {
    const { getAllByRole } = render(
      createElement(TaskFormActions, {
        mode: 'edit',
        isSubmitting: false,
        onCancel: () => {},
        onDelete: () => {},
      })
    );
    expect(getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Delete Task',
      'Cancel',
      'Save Changes',
    ]);
  });
});
