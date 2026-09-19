/**
 * The detail page's actions call the module's endpoints through the core
 * hooks: Record posts the talk id, attendance changes send the batch and
 * the single removal, and a recorded talk offers none of them.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import {
  addAttendees as add,
  downloadPdf,
  installCoreMocks,
  record,
  removeAttendee as remove,
  resetCoreMocks,
  settled,
  state,
} from '../test/core-mocks';

installCoreMocks();

const TALK_ID = 'b5a1c3d2-8e4f-4a6b-9c7d-0e1f2a3b4c5d';
const draft = {
  id: TALK_ID,
  projectId: 7,
  spatialNodeId: undefined,
  topic: 'Working at height',
  talkDate: '2026-09-19',
  talkTime: '07:30:00',
  conductorEmployeeId: 12,
  notes: 'Harness check.',
  status: 'DRAFT',
  attendees: [{ employeeId: 21 }],
};

const { ToolboxTalkDetail } = await import('./ToolboxTalkDetail');

beforeEach(() => {
  state.talk = settled(draft);
});

afterEach(() => {
  cleanup();
  resetCoreMocks();
});

describe('ToolboxTalkDetail', () => {
  test('Record calls the record endpoint with the talk id', () => {
    const { getByRole } = render(
      createElement(ToolboxTalkDetail, { talkId: TALK_ID })
    );
    fireEvent.click(getByRole('button', { name: 'Record talk' }));
    expect(record.mutate).toHaveBeenCalledTimes(1);
    expect(record.mutate.mock.calls[0]?.[0]).toBe(TALK_ID);
  });

  test('Record stays disabled until someone attended', () => {
    state.talk = settled({ ...draft, attendees: [] });
    const { getByRole } = render(
      createElement(ToolboxTalkDetail, { talkId: TALK_ID })
    );
    expect(getByRole('button', { name: 'Record talk' })).toBeDisabled();
  });

  test('attendance is added as a batch and removed one at a time', () => {
    const { getByLabelText, getByRole } = render(
      createElement(ToolboxTalkDetail, { talkId: TALK_ID })
    );
    fireEvent.change(getByLabelText('Add attendee'), {
      target: { value: '12' },
    });
    fireEvent.click(getByRole('button', { name: 'Add' }));
    expect(add.mutate.mock.calls[0]?.[0]).toEqual({
      id: TALK_ID,
      data: { employeeIds: [12] },
    });
    fireEvent.click(getByLabelText('Remove Anil Das'));
    expect(remove.mutate.mock.calls[0]?.[0]).toEqual({
      id: TALK_ID,
      employeeId: 21,
    });
  });

  test('a recorded talk shows no edit, record or attendance controls', () => {
    state.talk = settled({
      ...draft,
      status: 'RECORDED',
      recordedAt: '2026-09-19T02:05:00Z',
    });
    const { queryByRole, queryByLabelText, getByRole } = render(
      createElement(ToolboxTalkDetail, { talkId: TALK_ID })
    );
    expect(queryByRole('button', { name: 'Record talk' })).toBeNull();
    expect(queryByRole('link', { name: 'Edit' })).toBeNull();
    expect(queryByLabelText('Add attendee')).toBeNull();
    expect(getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
  });

  test('the PDF is fetched from the module service for the talk', async () => {
    const { getByRole } = render(
      createElement(ToolboxTalkDetail, { talkId: TALK_ID })
    );
    fireEvent.click(getByRole('button', { name: 'Download PDF' }));
    await Promise.resolve();
    expect(downloadPdf).toHaveBeenCalledWith(TALK_ID);
  });
});
