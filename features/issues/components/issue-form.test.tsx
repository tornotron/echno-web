import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realAttachmentHooks from '@tornotron/echno-core/attachment/hooks';
import * as realTaskHooks from '@tornotron/echno-core/task/hooks';
import * as realUserHooks from '@tornotron/echno-core/user/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';

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

mock.module('@/hooks/use-form-draft', () => ({
  useFormDraftScope: () => ({ userId: 'u1', orgId: 1 }),
  useFormDraft: () => ({
    draft: null,
    restoreDraft: () => {},
    discardDraft: () => {},
  }),
}));

const { IssueForm } = await import('./issue-form');

/**
 * Every control on the create form that can submit it.
 *
 * The regression this guards against was a second submitting button that skipped
 * `validateForm`, so asking for the submit button by name would have missed it
 * entirely. The test presses everything and asserts on what came out.
 */
function renderCreateForm() {
  const onSubmit = mock((..._args: unknown[]) => {});
  const view = render(
    createElement(IssueForm, {
      mode: 'create',
      projectId: '3',
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
