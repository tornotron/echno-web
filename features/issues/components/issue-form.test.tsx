import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realAttachmentHooks from '@tornotron/echno-core/attachment/hooks';
import * as realTaskHooks from '@tornotron/echno-core/task/hooks';
import * as realUserHooks from '@tornotron/echno-core/user/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import type { IssueFormState } from './issue-form';
import {
  IssuePriority,
  IssueStatus,
  IssueType,
  type Issue,
} from '@tornotron/echno-core/issue/types';

mock.module('@tornotron/echno-core/attachment/hooks', () => ({
  ...realAttachmentHooks,
  useDeleteAttachment: () => ({ mutateAsync: async () => {} }),
}));
mock.module('@tornotron/echno-core/task/hooks', () => ({
  ...realTaskHooks,
  useTasksByProject: () => ({ data: [{ id: 11, title: 'Raft pour' }] }),
}));
mock.module('@tornotron/echno-core/user/hooks', () => ({
  ...realUserHooks,
  useUser: () => ({ data: { defaultOrganizationId: 1 } }),
  useUserEmployees: () => ({ data: [{ id: 5, organizationId: 1 }] }),
}));
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useEmployeesByProject: () => ({ data: [] }),
}));

const toast = {
  success: mock((..._args: unknown[]) => {}),
  error: mock((..._args: unknown[]) => {}),
  info: mock((..._args: unknown[]) => {}),
  warning: mock((..._args: unknown[]) => {}),
};
mock.module('@/lib/styles/toast-styles', () => ({ toast }));

/**
 * The draft the mocked hook offers, or null for no banner. Set it to drive the
 * restore path; pressing Restore hands it to the form's `onRestore`.
 */
let offeredDraft: { fields: IssueFormState } | null = null;

mock.module('@/hooks/use-form-draft', () => ({
  useFormDraftScope: () => ({ userId: 'u1', orgId: 1 }),
  useFormDraft: (options: { onRestore: (values: unknown) => void }) => ({
    draft: offeredDraft ? { savedAt: Date.now() } : null,
    restoreDraft: () => options.onRestore(offeredDraft),
    discardDraft: () => {},
  }),
}));

const { IssueForm, ISSUE_FORM_ID } = await import('./issue-form');

/** A saved issue, enough of one for the edit form to seed itself from. */
function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 7,
    taskId: 11,
    title: 'Honeycombing on the raft',
    description: 'Voids along the north face of the raft pour.',
    type: IssueType.technical,
    status: IssueStatus.inProgress,
    ...overrides,
  } as unknown as Issue;
}

/** Renders the edit form over a saved issue and returns what it submitted. */
function renderEditForm(saved: Issue) {
  const onSubmit = mock((..._args: unknown[]) => {});
  const view = render(
    createElement(IssueForm, {
      mode: 'edit',
      projectId: '3',
      issue: saved,
      isSubmitting: false,
      isDeleting: false,
      onSubmit,
      onDelete: () => {},
      onCancel: () => {},
    } as never)
  );
  return { ...view, onSubmit };
}

/**
 * Opens the status dropdown, if there is one, and returns the labels it offers.
 *
 * Radix keeps the list out of the DOM until the trigger is pressed, so the
 * options have to be read after opening it. The labels come back as strings so
 * a failure prints a list rather than a DOM node.
 */
function statusOptions(container: HTMLElement): string[] {
  const trigger = container.querySelector('#status') as HTMLElement;
  fireEvent.pointerDown(trigger, {
    button: 0,
    ctrlKey: false,
    pointerType: 'mouse',
  });
  return [...document.querySelectorAll('[role="option"]')].map(
    (option) => option.textContent?.trim() ?? ''
  );
}

/**
 * Every control on the create form that can submit it.
 *
 * The regression this guards against was a second submitting button that skipped
 * `validateForm`, so asking for the submit button by name would have missed it
 * entirely. The test presses everything and asserts on what came out.
 */
function renderCreateForm(initialTaskId?: string) {
  const onSubmit = mock((..._args: unknown[]) => {});
  const view = render(
    createElement(IssueForm, {
      mode: 'create',
      projectId: '3',
      initialTaskId,
      isSubmitting: false,
      onSubmit,
      onCancel: () => {},
    } as never)
  );
  return { ...view, onSubmit };
}

describe('IssueForm create mode', () => {
  afterEach(() => {
    cleanup();
    toast.error.mockClear();
    offeredDraft = null;
  });

  test('no control submits an issue with a blank description', () => {
    const { container, onSubmit } = renderCreateForm();

    // A title and nothing else. This is the exact state the old "Save as Draft"
    // button posted to the API: it checked the title, skipped validateForm, and
    // sent description as the empty string it starts as. A blank title would
    // have short circuited that handler and proved nothing.
    const title = container.querySelector('#title') as HTMLInputElement;
    fireEvent.change(title, { target: { value: 'Honeycombing on the raft' } });

    for (const button of container.querySelectorAll('button')) {
      fireEvent.click(button);
    }

    for (const call of onSubmit.mock.calls) {
      const data = call[0] as { fields: { description: string } };
      expect(data.fields.description.trim()).not.toBe('');
    }
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // Raising an issue is open to every member of the tenant while moving one on
  // wants a system admin or a project manager, so a member creating one
  // straight as resolved or closed was making the move the update endpoint
  // exists to withhold. The API takes only `open` on create.
  test('the status is shown, not offered', () => {
    const { container } = renderCreateForm();

    const status = container.querySelector('#status');

    expect(status?.getAttribute('role')).toBe(null);
    expect(status?.textContent?.trim()).toBe('Open');
    expect(statusOptions(container)).toEqual([]);
  });

  test('an issue is created open', () => {
    const { container, onSubmit } = renderCreateForm('11');

    fireEvent.change(container.querySelector('#title') as HTMLInputElement, {
      target: { value: 'Honeycombing on the raft' },
    });
    fireEvent.change(
      container.querySelector('#description') as HTMLTextAreaElement,
      { target: { value: 'Voids along the north face of the raft pour.' } }
    );
    fireEvent.submit(container.querySelector(`#${ISSUE_FORM_ID}`)!);

    const data = onSubmit.mock.calls.at(-1)?.[0] as {
      fields: { status: string };
    };
    expect(data.fields.status).toBe(IssueStatus.open);
  });

  // A regression guard rather than a fix: the create form has always started
  // at medium. It is here because the priority is now sent, so what the form
  // starts at is on the wire and a change to it is a change to what gets saved.
  test('an issue is created at the priority the form starts on', () => {
    const { container, onSubmit } = renderCreateForm('11');

    fireEvent.change(container.querySelector('#title') as HTMLInputElement, {
      target: { value: 'Honeycombing on the raft' },
    });
    fireEvent.change(
      container.querySelector('#description') as HTMLTextAreaElement,
      { target: { value: 'Voids along the north face of the raft pour.' } }
    );
    fireEvent.submit(container.querySelector(`#${ISSUE_FORM_ID}`)!);

    const data = onSubmit.mock.calls.at(-1)?.[0] as {
      fields: { priority: string };
    };
    expect(data.fields.priority).toBe(IssuePriority.medium);
  });

  // The label carried a required asterisk while the column is nullable and
  // `validateForm` has never checked the field, so it claimed a rule neither
  // the API nor the form enforced.
  test('the priority is not marked required', () => {
    const { container } = renderCreateForm();

    const label = container.querySelector('label[for="priority"]');

    expect(label?.textContent?.trim()).toBe('Priority');
  });

  test('offers no Save as Draft control', () => {
    // The button called an issue a draft and created an ordinary one: status
    // forced to open, "Issue Created" toasted, listed alongside every other
    // issue. Keeping half typed work is what the local form draft is for.
    const { container } = renderCreateForm();

    const labels = [...container.querySelectorAll('button')].map(
      (b) => b.textContent?.trim() ?? ''
    );

    expect(labels.some((l) => l.includes('Save as Draft'))).toBe(false);
  });
});

describe('IssueForm edit mode', () => {
  afterEach(() => {
    cleanup();
    toast.error.mockClear();
    offeredDraft = null;
  });

  // Only the create payload is restricted. Moving an issue on is what the
  // update endpoint is for, so the edit form keeps the whole list.
  test('the status is still offered, with the whole list', () => {
    const { container } = renderEditForm(issue());

    const options = statusOptions(container);
    expect(options).toContain('Resolved');
    expect(options).toContain('Closed');
    expect(options.length).toBe(8);
  });

  // The edit form hardcoded `priority: 'medium'` while seeding itself, so it
  // showed medium against an issue saved as critical and would have written
  // that back on the next save. The field was never sent either, so nobody saw
  // it (#400).
  test('seeds the priority from the saved issue', () => {
    const { container, onSubmit } = renderEditForm(
      issue({ priority: IssuePriority.critical })
    );

    fireEvent.submit(container.querySelector(`#${ISSUE_FORM_ID}`)!);

    const data = onSubmit.mock.calls.at(-1)?.[0] as {
      fields: { priority: string };
    };
    expect(data.fields.priority).toBe(IssuePriority.critical);
  });

  // The column is nullable with no default, so every issue raised before it
  // existed has none. Seeding the control with the create form's default would
  // put a value on screen nobody chose and save it on the next edit.
  test('an issue with no priority does not come back as medium', () => {
    const { container, onSubmit } = renderEditForm(issue());

    fireEvent.submit(container.querySelector(`#${ISSUE_FORM_ID}`)!);

    const data = onSubmit.mock.calls.at(-1)?.[0] as {
      fields: { priority: string };
    };
    expect(data.fields.priority).toBe('');
  });
});

describe('IssueForm restored draft', () => {
  afterEach(() => {
    cleanup();
    toast.error.mockClear();
    offeredDraft = null;
  });

  // Drafts are kept on the device, so one saved while the create form still
  // offered the whole list outlives the change. The create form has nowhere to
  // show a status other than open, so restoring one left the summary card
  // claiming something the form could not have produced.
  test('a legacy Resolved draft comes back open', () => {
    offeredDraft = {
      fields: {
        initialized: true,
        taskId: '11',
        title: 'Honeycombing on the raft',
        description: 'Voids along the north face of the raft pour.',
        issueType: IssueType.technical,
        status: IssueStatus.resolved,
        priority: IssuePriority.medium,
        assigneeId: '',
      },
    };
    const { container, getByText } = renderCreateForm();

    fireEvent.click(getByText('Restore'));

    // The rest of the draft is still restored; only the status is corrected.
    expect((container.querySelector('#title') as HTMLInputElement).value).toBe(
      'Honeycombing on the raft'
    );
    const badges = [...container.querySelectorAll('span')].map(
      (node) => node.textContent?.trim() ?? ''
    );
    expect(badges).not.toContain('Resolved');
  });
});
