/**
 * The form refuses to submit without a work category or an assignee, and said
 * so only after the attempt. Every field it refuses on carries the same red
 * asterisk.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realWorkCategoryHooks from '@tornotron/echno-core/work-category/hooks';
import * as realAttachmentHooks from '@tornotron/echno-core/attachment/hooks';
import * as realFormDraft from '@/hooks/use-form-draft';

mock.module('@tornotron/echno-core/employee/hooks', () => ({
  ...realEmployeeHooks,
  useCurrentUserEmployee: () => ({ data: { id: 1 } }),
}));
mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useEmployeesByProject: () => ({ data: [] }),
}));
mock.module('@tornotron/echno-core/work-category/hooks', () => ({
  ...realWorkCategoryHooks,
  useWorkCategories: () => ({ data: [] }),
  useWorkSubcategories: () => ({ data: [] }),
  useCreateWorkCategory: () => ({ mutate: () => {}, isPending: false }),
}));
mock.module('@tornotron/echno-core/attachment/hooks', () => ({
  ...realAttachmentHooks,
  useDeleteAttachment: () => ({ mutate: () => {}, isPending: false }),
}));
mock.module('@/hooks/use-form-draft', () => ({
  ...realFormDraft,
  useFormDraftScope: () => 'test',
  useFormDraft: () => ({
    draft: null,
    restoreDraft: () => {},
    discardDraft: () => {},
  }),
}));

const { TaskForm } = await import('./task-form');

afterEach(cleanup);

describe('TaskForm required marks', () => {
  test('every field the form refuses on is marked', () => {
    const { container, getByText } = render(
      <TaskForm mode="create" projectId={1} onSubmit={() => {}} />
    );
    for (const field of [
      'title',
      'startDate',
      'endDate',
      'category',
      'status',
    ]) {
      const label = container.querySelector(`label[for="${field}"]`);
      expect(label?.textContent, field).toContain('*');
    }
    expect(getByText(/^Assign Team Members/).textContent).toContain('*');
  });

  test('optional fields are not marked', () => {
    const { getByText } = render(
      <TaskForm mode="create" projectId={1} onSubmit={() => {}} />
    );
    expect(getByText('Description').textContent).not.toContain('*');
  });
});
