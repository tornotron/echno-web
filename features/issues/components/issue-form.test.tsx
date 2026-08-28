import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realAttachmentHooks from '@tornotron/echno-core/attachment/hooks';
import * as realTaskHooks from '@tornotron/echno-core/task/hooks';
import * as realUserHooks from '@tornotron/echno-core/user/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import type { IssueFormState } from './issue-form';
import {
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
function issue(): Issue {
  return {
    id: 7,
    taskId: 11,
    title: 'Honeycombing on the raft',
    description: 'Voids along the north face of the raft pour.',
    type: IssueType.technical,
    status: IssueStatus.inProgress,
  } as unknown as Issue;
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
    const { container } = render(
      createElement(IssueForm, {
        mode: 'edit',
        projectId: '3',
        issue: issue(),
        isSubmitting: false,
        isDeleting: false,
        onSubmit: () => {},
        onDelete: () => {},
        onCancel: () => {},
      } as never)
    );

    const options = statusOptions(container);
    expect(options).toContain('Resolved');
    expect(options).toContain('Closed');
    expect(options.length).toBe(8);
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
        priority: 'medium',
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
