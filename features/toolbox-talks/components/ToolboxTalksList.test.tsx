/**
 * The list renders through the core hooks: `useToolboxTalks` is mocked at
 * the `@tornotron/echno-core/toolbox-talks/hooks` subpath, the way the app
 * imports it, and the rows it returns are what the table shows. The filter
 * state reaches the hook as the backend's own query parameters.
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import {
  installCoreMocks,
  resetCoreMocks,
  settled,
  state,
  useToolboxTalks,
} from '../test/core-mocks';

installCoreMocks();

const talk = {
  id: 'b5a1c3d2-8e4f-4a6b-9c7d-0e1f2a3b4c5d',
  projectId: 7,
  topic: 'Working at height',
  talkDate: '2026-09-19',
  talkTime: '07:30:00',
  conductorEmployeeId: 12,
  notes: '',
  status: 'RECORDED',
  attendees: [{ employeeId: 21 }, { employeeId: 22 }],
};

const { ToolboxTalksList } = await import('./ToolboxTalksList');

afterEach(() => {
  cleanup();
  resetCoreMocks();
});

describe('ToolboxTalksList', () => {
  test('shows the loading state before the hook settles', () => {
    const { getByText } = render(createElement(ToolboxTalksList));
    expect(getByText('Loading')).toBeInTheDocument();
  });

  test('renders the rows the hook returns with names resolved', () => {
    state.list = settled({
      content: [talk],
      page: 0,
      totalPages: 1,
      size: 20,
      totalElements: 1,
    });
    const { getByText, getByRole } = render(createElement(ToolboxTalksList));
    expect(getByRole('link', { name: 'Working at height' })).toHaveAttribute(
      'href',
      `/users/dashboard/toolbox-talks/${talk.id}`
    );
    expect(getByRole('cell', { name: 'Tower A' })).toBeInTheDocument();
    expect(getByRole('cell', { name: 'Ravi Kumar' })).toBeInTheDocument();
    expect(getByRole('cell', { name: '2' })).toBeInTheDocument();
    expect(getByRole('cell', { name: 'Recorded' })).toBeInTheDocument();
    expect(getByText('Page 1 of 1')).toBeInTheDocument();
  });

  test('an empty page says so instead of rendering nothing', () => {
    state.list = settled({
      content: [],
      page: 0,
      totalPages: 0,
      size: 20,
      totalElements: 0,
    });
    const { getByText } = render(createElement(ToolboxTalksList));
    expect(getByText('No talks recorded yet.')).toBeInTheDocument();
  });

  test('the filters reach the hook as the backend query and reset the page', () => {
    state.list = settled({
      content: [],
      page: 0,
      totalPages: 0,
      size: 20,
      totalElements: 0,
    });
    const { getByLabelText } = render(createElement(ToolboxTalksList));
    expect(useToolboxTalks.mock.calls[0]?.[0]).toEqual({
      projectId: undefined,
      status: undefined,
      from: undefined,
      to: undefined,
      pageNo: 0,
      pageSize: 20,
    });
    fireEvent.change(getByLabelText('Project'), { target: { value: '7' } });
    fireEvent.change(getByLabelText('Status'), { target: { value: 'DRAFT' } });
    fireEvent.change(getByLabelText('From'), {
      target: { value: '2026-09-01' },
    });
    fireEvent.change(getByLabelText('To'), { target: { value: '2026-09-30' } });
    expect(useToolboxTalks.mock.calls.at(-1)?.[0]).toEqual({
      projectId: 7,
      status: 'DRAFT',
      from: '2026-09-01',
      to: '2026-09-30',
      pageNo: 0,
      pageSize: 20,
    });
  });
});
