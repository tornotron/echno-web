/**
 * The record-progress dialog: the outcome decides which fields are asked
 * for, a late activity needs a reason, a milestone is done or not, and a
 * refusal from the server reaches the user in the toast.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react';
import { ApiError } from '@tornotron/echno-core';
import { WbsStatus, type WbsActivity } from '@tornotron/echno-core/wbs/types';
import { installMocks, resetMocks, toast, workProgress } from '../test/mocks';

installMocks();

const { RecordProgressDialog } = await import('./RecordProgressDialog');

const base: WbsActivity = {
  id: 42,
  wbsCode: '1.2',
  title: 'Column casting',
  level: 1,
  sortOrder: 0,
  status: WbsStatus.IN_PROGRESS,
  startDate: '2026-09-01',
  endDate: '2099-12-31',
  actualStartDate: '2026-09-02',
  progress: 40,
  weight: 1,
  budgetedCost: 0,
  actualCost: 0,
  isLeaf: true,
  isMilestone: false,
};

function open(activity: WbsActivity = base) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(RecordProgressDialog, {
        activity,
        open: true,
        onOpenChange: () => {},
      })
    )
  );
  // The dialog portals into the body, outside the render container.
  return within(document.body);
}

beforeEach(resetMocks);
afterEach(cleanup);

describe('RecordProgressDialog', () => {
  test('the outcome decides which fields are asked for', () => {
    const screen = open();
    // Done: an actual finish, no percent, no forecast; the start is already on record.
    expect(screen.getByLabelText('Actual finish')).toBeInTheDocument();
    expect(screen.queryByLabelText('Percent complete')).toBeNull();
    expect(screen.queryByLabelText('Revised finish (forecast)')).toBeNull();
    expect(screen.queryByLabelText('Actual start')).toBeNull();

    fireEvent.click(screen.getByLabelText('Partly done'));
    expect(screen.getByLabelText('Percent complete')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Revised finish (forecast)')
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Actual finish')).toBeNull();
  });

  test('an activity with no start on record asks for one', () => {
    const screen = open({ ...base, actualStartDate: undefined });
    expect(screen.getByLabelText('Actual start')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Not done'));
    expect(screen.queryByLabelText('Actual start')).toBeNull();
  });

  test('a milestone is done or not done, never partly', () => {
    const screen = open({ ...base, isMilestone: true });
    expect(screen.queryByLabelText('Partly done')).toBeNull();
    expect(screen.getByLabelText('Not done')).toBeInTheDocument();
  });

  test('a reason is required once the activity is late', () => {
    const screen = open({ ...base, endDate: '2026-01-10' });
    fireEvent.click(screen.getByLabelText('Not done'));
    const reason = screen.getByLabelText(/Reason for delay/);
    expect(reason).toBeRequired();
    expect(
      screen.getByText(/required, the activity is late/)
    ).toBeInTheDocument();
  });

  test('an on-time activity does not demand a reason', () => {
    const screen = open();
    fireEvent.click(screen.getByLabelText('Partly done'));
    expect(screen.getByLabelText(/Reason for delay/)).not.toBeRequired();
  });

  test('a refusal from the server shows its message', async () => {
    workProgress.record.mockImplementation(async () => {
      throw new ApiError(
        'Activity 1.2 already shows 40.0 percent progress; record it as PARTIAL with the current percent',
        400
      );
    });
    const screen = open();
    fireEvent.click(screen.getByLabelText('Not done'));
    fireEvent.submit(
      screen
        .getByRole('button', { name: 'Save record' })
        .closest('form') as HTMLFormElement
    );
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    const [, options] = toast.error.mock.calls[0] as [
      string,
      { description: string },
    ];
    expect(options.description).toContain('record it as PARTIAL');
  });

  test('a partly done record sends the percent and the forecast', async () => {
    const screen = open();
    fireEvent.click(screen.getByLabelText('Partly done'));
    fireEvent.change(screen.getByLabelText('Percent complete'), {
      target: { value: '60' },
    });
    fireEvent.change(screen.getByLabelText('Revised finish (forecast)'), {
      target: { value: '2099-12-31' },
    });
    fireEvent.submit(
      screen
        .getByRole('button', { name: 'Save record' })
        .closest('form') as HTMLFormElement
    );
    await waitFor(() => expect(workProgress.record).toHaveBeenCalled());
    const sent = workProgress.record.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(sent).toMatchObject({
      wbsElementId: 42,
      outcome: 'PARTIAL',
      percentComplete: 60,
      forecastFinishDate: '2099-12-31',
    });
    expect(sent).not.toHaveProperty('actualStartDate');
    expect(sent).not.toHaveProperty('actualFinishDate');
  });
});
