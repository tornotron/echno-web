/**
 * The edit page delegates its loading/error/draft states to this panel so
 * `app/.../[id]/edit/page.tsx` stays a thin data-fetch wrapper. These tests
 * fail on the pre-fix page, which rendered these states inline and exported
 * no such component.
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { installCoreMocks, resetCoreMocks } from '../test/core-mocks';

installCoreMocks();

const { ToolboxTalkEditPanel } = await import('./ToolboxTalkEditPanel');

const noop = () => {};

const draft = {
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

afterEach(() => {
  cleanup();
  resetCoreMocks();
});

describe('ToolboxTalkEditPanel', () => {
  test('shows a skeleton while the talk is loading', () => {
    const { container } = render(
      createElement(ToolboxTalkEditPanel, {
        talk: undefined,
        isPending: true,
        isError: false,
        error: null,
        onSaved: noop,
        onCancel: noop,
      })
    );
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
  });

  test('shows the fetch error', () => {
    const { getByRole } = render(
      createElement(ToolboxTalkEditPanel, {
        talk: undefined,
        isPending: false,
        isError: true,
        error: new Error('Talk not found'),
        onSaved: noop,
        onCancel: noop,
      })
    );
    expect(getByRole('alert').textContent).toContain('Talk not found');
  });

  test('tells the user a recorded talk no longer changes', () => {
    const { getByText, queryByTestId } = render(
      createElement(ToolboxTalkEditPanel, {
        talk: { ...draft, status: 'RECORDED' as const },
        isPending: false,
        isError: false,
        error: null,
        onSaved: noop,
        onCancel: noop,
      })
    );
    expect(
      getByText('This talk has been recorded and no longer changes.')
    ).not.toBeNull();
    expect(queryByTestId('toolbox-talks-form')).toBeNull();
  });

  test('renders the editable form for a draft', () => {
    const { getByTestId } = render(
      createElement(ToolboxTalkEditPanel, {
        talk: draft,
        isPending: false,
        isError: false,
        error: null,
        onSaved: noop,
        onCancel: noop,
      })
    );
    expect(getByTestId('toolbox-talks-form')).not.toBeNull();
  });
});
