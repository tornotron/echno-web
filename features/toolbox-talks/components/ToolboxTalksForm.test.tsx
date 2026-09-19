/**
 * The form posts what the backend's `CreateToolboxTalkRequest` and
 * `UpdateToolboxTalkRequest` expect: numeric ids, the date as typed, the
 * time widened to `HH:mm:ss`, the attendance as ids on create only, and no
 * project on update since a talk never moves.
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import {
  create,
  installCoreMocks,
  resetCoreMocks,
  update,
} from '../test/core-mocks';

installCoreMocks();

const { ToolboxTalksForm } = await import('./ToolboxTalksForm');

const noop = () => {};

afterEach(() => {
  cleanup();
  resetCoreMocks();
});

describe('ToolboxTalksForm', () => {
  test('creates a draft with the body the backend expects', () => {
    const { getByLabelText, getByRole } = render(
      createElement(ToolboxTalksForm, { onSaved: noop, onCancel: noop })
    );
    fireEvent.change(getByLabelText('Project'), { target: { value: '7' } });
    fireEvent.change(getByLabelText('Conducted by'), {
      target: { value: '12' },
    });
    fireEvent.change(getByLabelText('Topic'), {
      target: { value: '  Working at height ' },
    });
    fireEvent.change(getByLabelText('Date'), {
      target: { value: '2026-09-19' },
    });
    fireEvent.change(getByLabelText('Time'), { target: { value: '07:30' } });
    fireEvent.click(getByLabelText('Attendee Anil Das'));
    fireEvent.change(getByLabelText('Notes'), {
      target: { value: 'Harness check.' },
    });
    fireEvent.submit(getByRole('form', { name: 'New toolbox talk' }));

    expect(create.mutate).toHaveBeenCalledTimes(1);
    expect(create.mutate.mock.calls[0]?.[0]).toEqual({
      projectId: 7,
      topic: 'Working at height',
      talkDate: '2026-09-19',
      conductorEmployeeId: 12,
      spatialNodeId: undefined,
      talkTime: '07:30:00',
      notes: 'Harness check.',
      attendeeEmployeeIds: [21],
    });
    expect(update.mutate).not.toHaveBeenCalled();
  });

  test('only active employees can conduct or attend', () => {
    const { getByLabelText, queryByLabelText } = render(
      createElement(ToolboxTalksForm, { onSaved: noop, onCancel: noop })
    );
    const conductor = getByLabelText('Conducted by') as HTMLSelectElement;
    expect(
      [...conductor.options].map((option) => option.textContent)
    ).not.toContain('Gone Person (Mason)');
    expect(queryByLabelText('Attendee Gone Person')).toBeNull();
  });

  test('does not submit without a project, a conductor and a topic', () => {
    const { getByRole } = render(
      createElement(ToolboxTalksForm, { onSaved: noop, onCancel: noop })
    );
    fireEvent.submit(getByRole('form', { name: 'New toolbox talk' }));
    expect(create.mutate).not.toHaveBeenCalled();
  });

  test('edits a draft with the update body and keeps the project fixed', () => {
    const talk = {
      id: 't-1',
      projectId: 7,
      spatialNodeId: undefined,
      topic: 'Working at height',
      talkDate: '2026-09-19',
      talkTime: '07:30:00',
      conductorEmployeeId: 12,
      notes: '',
      status: 'DRAFT' as const,
      attendees: [{ employeeId: 21 }],
    };
    const { getByLabelText, getByRole, queryByLabelText } = render(
      createElement(ToolboxTalksForm, { talk, onSaved: noop, onCancel: noop })
    );
    expect((getByLabelText('Project') as HTMLSelectElement).disabled).toBe(
      true
    );
    expect(queryByLabelText('Attendee Anil Das')).toBeNull();
    fireEvent.change(getByLabelText('Topic'), {
      target: { value: 'Working at height, revised' },
    });
    fireEvent.submit(getByRole('form', { name: 'Edit toolbox talk' }));

    expect(update.mutate).toHaveBeenCalledTimes(1);
    expect(update.mutate.mock.calls[0]?.[0]).toEqual({
      id: 't-1',
      data: {
        topic: 'Working at height, revised',
        talkDate: '2026-09-19',
        conductorEmployeeId: 12,
        spatialNodeId: undefined,
        talkTime: '07:30:00',
        notes: undefined,
      },
    });
    expect(create.mutate).not.toHaveBeenCalled();
  });
});
