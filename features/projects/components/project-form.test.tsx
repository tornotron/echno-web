import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realAttachmentHooks from '@tornotron/echno-core/attachment/hooks';
import {
  ProjectStatus,
  type Project,
} from '@tornotron/echno-core/project/types';

mock.module('@tornotron/echno-core/attachment/hooks', () => ({
  ...realAttachmentHooks,
  useDeleteAttachment: () => ({ mutateAsync: async () => {} }),
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
  },
}));

mock.module('@/hooks/use-form-draft', () => ({
  useFormDraftScope: () => ({ userId: 'u1', orgId: 1 }),
  useFormDraft: () => ({
    draft: null,
    restoreDraft: () => {},
    discardDraft: () => {},
  }),
}));

const { ProjectForm } = await import('./project-form');

/** A saved project, enough of one for the edit form to seed itself from. */
function project(): Project {
  return {
    id: 3,
    projectName: 'Sunrise Tower',
    projectAddress: '12 Beach Road',
    status: ProjectStatus.open,
    projectLatitude: 13.08,
    projectLongitude: 80.27,
    attachments: [],
  } as unknown as Project;
}

/**
 * Opens the status dropdown and returns the labels it offers.
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

describe('ProjectForm status options', () => {
  afterEach(() => {
    cleanup();
  });

  // Approval checks that the project's state is known and draws up its
  // compliance inspections. A project created approved skipped both, so the
  // create endpoint refuses the value and offering it here is a 400 waiting to
  // happen.
  test('create does not offer Approved', () => {
    const { container } = render(
      createElement(ProjectForm, {
        mode: 'create',
        onSubmit: () => {},
      } as never)
    );

    expect(statusOptions(container)).not.toContain('Approved');
  });

  test('create still offers the statuses the API accepts', () => {
    const { container } = render(
      createElement(ProjectForm, {
        mode: 'create',
        onSubmit: () => {},
      } as never)
    );

    expect(statusOptions(container)).toEqual([
      'Upcoming',
      'Open',
      'On Hold',
      'Completed',
      'Closed',
      'Cancelled',
      'Dropped',
    ]);
  });

  // Approving a project is legitimate; it is only the create payload that
  // cannot carry it. Dropping it from the edit form as well would take away a
  // move the user is entitled to make.
  test('edit still offers Approved', () => {
    const { container } = render(
      createElement(ProjectForm, {
        mode: 'edit',
        project: project(),
        onSubmit: () => {},
      } as never)
    );

    expect(statusOptions(container)).toContain('Approved');
  });
});
