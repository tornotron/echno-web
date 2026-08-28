import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realAttachmentHooks from '@tornotron/echno-core/attachment/hooks';
import {
  ProjectStatus,
  type Project,
} from '@tornotron/echno-core/project/types';
import type { ProjectFormState } from './project-form';

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

/**
 * The draft the mocked hook offers, or null for no banner. Set it to drive the
 * restore path; pressing Restore hands it to the form's `onRestore`.
 */
let offeredDraft: {
  fields: ProjectFormState;
  createLocationForProject: boolean;
} | null = null;

mock.module('@/hooks/use-form-draft', () => ({
  useFormDraftScope: () => ({ userId: 'u1', orgId: 1 }),
  useFormDraft: (options: { onRestore: (values: unknown) => void }) => ({
    draft: offeredDraft ? { savedAt: Date.now() } : null,
    restoreDraft: () => options.onRestore(offeredDraft),
    discardDraft: () => {},
  }),
}));

const { ProjectForm, PROJECT_FORM_ID } = await import('./project-form');

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
    offeredDraft = null;
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

describe('ProjectForm restored draft', () => {
  afterEach(() => {
    cleanup();
    offeredDraft = null;
  });

  // Drafts are kept on the device, so one saved while the create form still
  // offered Approved outlives the change. Restoring it put the refused value
  // back into a form that no longer shows it, and the create then failed.
  test('a legacy Approved draft comes back as Upcoming', () => {
    offeredDraft = {
      fields: {
        projectName: 'Sunrise Tower',
        projectAddress: '12 Beach Road',
        projectCity: '',
        projectState: '',
        projectPostalCode: '',
        status: ProjectStatus.approved,
        projectType: '',
        projectLatitude: '',
        projectLongitude: '',
        startDate: '',
        endDate: '',
        description: '',
      },
      createLocationForProject: false,
    };
    const onSubmit = mock((..._args: unknown[]) => {});
    const { container, getByText } = render(
      createElement(ProjectForm, { mode: 'create', onSubmit } as never)
    );

    fireEvent.click(getByText('Restore'));
    fireEvent.submit(container.querySelector(`#${PROJECT_FORM_ID}`)!);

    const data = onSubmit.mock.calls.at(-1)?.[0] as {
      fields: { projectName: string; status: string };
    };
    // The rest of the draft is still restored; only the status is corrected.
    expect(data.fields.projectName).toBe('Sunrise Tower');
    expect(data.fields.status).toBe(ProjectStatus.upcoming);
  });
});
