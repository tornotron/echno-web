/**
 * Milestones: the schedule checks are said in full (percentages that total
 * 95, a date out of order, a time counted from the start), flagged rows wait
 * for their ticks, and apply writes the kind.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import {
  ingest,
  installMocks,
  page,
  pdfCandidate,
  pdfNames,
  pkg,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

installMocks();

const { MilestonesReview } = await import('./MilestonesReview');

const percentFlag = {
  code: 'PERCENT_TOTAL',
  message: 'The payment percentages add up to 95, not 100.',
};

function milestone(
  id: string,
  name: string,
  time: string,
  percent: string,
  flags: { code: string; message: string }[] = [percentFlag]
) {
  return pdfCandidate({
    id,
    kind: 'MILESTONE',
    naturalKey: name,
    payload: { name, time, percent },
    flags,
  });
}

const rows = [
  milestone('m1', 'Foundation complete', 'Month 2', '20', [
    percentFlag,
    { code: 'RELATIVE_TIME', message: 'Counted from the start date.' },
  ]),
  milestone('m2', 'Structure complete', '15/03/2027', '30'),
  milestone('m3', 'Roof complete', '01/02/2027', '25', [
    percentFlag,
    { code: 'DATE_ORDER', message: 'Falls before the milestone above it.' },
  ]),
  milestone('m4', 'Finishes', '30/06/2027', '15'),
  milestone('m5', 'Handover', '31/07/2027', '5'),
];

beforeEach(() => {
  resetMocks();
  ingest.listCandidates.mockImplementation(async () => page(rows));
});
afterEach(cleanup);

function open(overrides = {}) {
  return renderWithClient(
    createElement(MilestonesReview, {
      pkg: { ...pkg, ...overrides },
      fileNames: pdfNames,
    })
  );
}

describe('MilestonesReview', () => {
  test('says plainly what the checks found', async () => {
    const screen = open();
    const checks = await screen.findByTestId('schedule-checks');
    expect(checks).toHaveTextContent(
      'The payment percentages on this page add up to 95%, not 100.'
    );
    expect(checks).toHaveTextContent(
      '1 milestone falls before the one above it.'
    );
    expect(checks).toHaveTextContent(
      /1 milestone is printed as a time from the start/
    );
    expect(screen.getAllByText('Percentages do not add up to 100').length).toBe(
      5
    );
    expect(
      screen.getByText('Counted from the project start date')
    ).toBeInTheDocument();
  });

  test('no row is ready until its flags are ticked', async () => {
    const screen = open();
    const bulk = await screen.findByRole('button', {
      name: 'Accept 0 values ready to accept',
    });
    expect(bulk).toBeDisabled();
    const ticks = screen.getAllByLabelText(
      'Checked: Percentages do not add up to 100'
    );
    fireEvent.click(ticks[1]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Accept 1 value ready to accept' })
    );
    await waitFor(() => expect(ingest.decide).toHaveBeenCalled());
    expect(ingest.decide.mock.calls[0]?.[1]).toEqual([
      {
        candidateId: 'm2',
        action: 'ACCEPT',
        acknowledgedFlags: ['PERCENT_TOTAL'],
      },
    ]);
  });

  test('apply writes the milestones and says where they go', async () => {
    const screen = open({ subContractId: 31 });
    expect(
      await screen.findByText(
        /become payment milestones on the picked contract/
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Apply milestones' }));
    await waitFor(() => expect(ingest.applyAll).toHaveBeenCalled());
    expect(ingest.applyAll.mock.calls[0]).toEqual(['pkg-1', 'MILESTONE']);
  });

  test('with no project, says to create it first', async () => {
    const screen = open({ projectId: undefined });
    expect(
      await screen.findByText(/Create it from the project fields first/)
    ).toBeInTheDocument();
  });
});
