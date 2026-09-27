/**
 * The schedule on the WBS tab: a failed read is an error with the server's
 * message, kept apart from the empty schedule; rows carry their delay; and
 * the Record action appears only when the module is on and the reader is in
 * the project team.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, waitFor } from '@testing-library/react';
import { ApiError } from '@tornotron/echno-core';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import { WbsDependencyType, WbsStatus } from '@tornotron/echno-core/wbs/types';
import { gates, installMocks, resetMocks, wbs } from '../test/mocks';

installMocks();

const { ProjectScheduleView } = await import('./ProjectScheduleView');

const row = (over: Record<string, unknown>) => ({
  id: 1,
  wbsCode: '1',
  title: 'Footings',
  level: 0,
  sortOrder: 0,
  status: WbsStatus.IN_PROGRESS,
  startDate: '2026-09-01',
  endDate: '2026-09-10',
  progress: 40,
  weight: 1,
  budgetedCost: 0,
  actualCost: 0,
  isLeaf: true,
  isMilestone: false,
  ...over,
});

const schedule = {
  activities: [
    row({
      id: 1,
      wbsCode: '1',
      title: 'Footings',
      delayDays: 9,
      forecastEndDate: '2026-09-19',
    }),
    row({
      id: 2,
      wbsCode: '2',
      title: 'Slab cast',
      isMilestone: true,
      delayDays: 0,
      startDate: '2026-09-30',
      endDate: '2026-09-30',
    }),
  ],
  dependencies: [
    {
      id: 5,
      predecessorId: 1,
      predecessorWbsCode: '1',
      successorId: 2,
      successorWbsCode: '2',
      type: WbsDependencyType.FS,
      lagDays: 0,
    },
  ],
};

function renderView() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(ProjectScheduleView, { projectId: 7 })
    )
  );
}

beforeEach(resetMocks);
afterEach(cleanup);

describe('ProjectScheduleView', () => {
  test('an empty schedule says so honestly', async () => {
    const { findByText } = renderView();
    expect(
      await findByText("No activities in this project's schedule yet")
    ).toBeInTheDocument();
  });

  test('a failed read shows the server message, not the empty state', async () => {
    wbs.getSchedule.mockImplementation(async () => {
      throw new ApiError(
        'Project with ID 7 was not found in this organization',
        404
      );
    });
    const { findByText, queryByText } = renderView();
    expect(await findByText('Could not load the schedule')).toBeInTheDocument();
    expect(
      await findByText(/was not found in this organization/)
    ).toBeInTheDocument();
    expect(
      queryByText("No activities in this project's schedule yet")
    ).toBeNull();
  });

  test('rows carry their delay, milestone and what they depend on', async () => {
    wbs.getSchedule.mockImplementation(async () => schedule);
    const { findByTestId, getByTestId } = renderView();
    const footings = await findByTestId('activity-1');
    expect(footings).toHaveTextContent('9 days late');
    expect(footings).toHaveTextContent('2026-09-19');
    const slab = getByTestId('activity-2');
    expect(slab).toHaveTextContent('Milestone');
    expect(slab).toHaveTextContent('On time');
    expect(slab).toHaveTextContent('1');
    expect(getByTestId('summary-delayed')).toHaveTextContent('1');
  });

  test('Record needs both the module and a project-team role', async () => {
    wbs.getSchedule.mockImplementation(async () => schedule);

    gates.orgRoles = [OrgRole.SITE_ENGINEER];
    const first = renderView();
    await first.findByTestId('activity-1');
    expect(first.queryByLabelText('Record progress for 1')).toBeNull();
    cleanup();

    gates.modules = ['work-progress'];
    gates.orgRoles = [];
    const second = renderView();
    await second.findByTestId('activity-1');
    expect(second.queryByLabelText('Record progress for 1')).toBeNull();
    cleanup();

    gates.orgRoles = [OrgRole.SITE_ENGINEER];
    const third = renderView();
    await waitFor(() =>
      expect(third.getByLabelText('Record progress for 1')).toBeInTheDocument()
    );
    // A site engineer records; shaping the schedule is the manager's.
    expect(third.queryByText('Add activity')).toBeNull();
    expect(third.queryByLabelText('Edit 1')).toBeNull();
  });

  test('the schedule roles can add and edit', async () => {
    wbs.getSchedule.mockImplementation(async () => schedule);
    gates.orgRoles = [OrgRole.PROJECT_MANAGER];
    const { findByText, getByLabelText } = renderView();
    expect(await findByText('Add activity')).toBeInTheDocument();
    expect(getByLabelText('Edit 1')).toBeInTheDocument();
    expect(getByLabelText('Links for 2')).toBeInTheDocument();
  });
});
