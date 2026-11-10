/**
 * The review grid shows where each row came from and what is wrong with it,
 * and only sends an accept for a flagged row with the flag codes the person
 * ticked. Bulk accept takes the unflagged rows only.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import {
  candidate,
  fileNames,
  ingest,
  installMocks,
  page,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

installMocks();

const { BoqReviewGrid } = await import('./BoqReviewGrid');

const clean = candidate();

/** The same sources moved to another row, cell references included. */
function atRow(row: number) {
  return clean.sources.map((s) => ({
    ...s,
    rowNumber: row,
    cell: s.cell?.replace(/\d+$/, String(row)),
  }));
}
const mismatch = candidate({
  id: 'cand-2',
  naturalKey: 'BOQ!48',
  payload: {
    ...clean.payload,
    itemCode: '2.2',
    description: 'RCC M25 in footings',
    amount: '99000.00',
    row: 48,
  },
  flags: [
    {
      code: 'AMOUNT_MISMATCH',
      message: 'Quantity times rate is 67500.00, the sheet says 99000.00.',
    },
  ],
  sources: atRow(48),
});
const lumpSum = candidate({
  id: 'cand-3',
  payload: {
    ...clean.payload,
    itemCode: '9.1',
    description: 'Site mobilisation',
    row: 90,
  },
  flags: [{ code: 'LUMP_SUM', message: 'Proposed as 1 LS.' }],
  sources: atRow(90),
});
const done = candidate({ id: 'cand-4', status: 'ACCEPTED' });

beforeEach(() => {
  resetMocks();
  ingest.listCandidates.mockImplementation(async () =>
    page([clean, mismatch, lumpSum, done])
  );
});
afterEach(cleanup);

function open() {
  return renderWithClient(
    createElement(BoqReviewGrid, { packageId: 'pkg-1', fileNames })
  );
}

describe('BoqReviewGrid', () => {
  test('asks for BOQ rows, 200 to a page', async () => {
    const screen = open();
    await screen.findByText('BOQ.xlsx, Sheet BOQ, Row 48');
    expect(ingest.listCandidates.mock.calls[0]).toEqual([
      'pkg-1',
      { kind: 'BOQ_ITEM', status: undefined, page: 0, size: 200 },
    ]);
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'APPLY_FAILED' },
    });
    await waitFor(() =>
      expect(ingest.listCandidates.mock.calls.at(-1)?.[1]).toEqual({
        kind: 'BOQ_ITEM',
        status: 'APPLY_FAILED',
        page: 0,
        size: 200,
      })
    );
  });

  test('shows the source cell of each row and its flags', async () => {
    const screen = open();
    const row = await screen.findByTestId('boq-row-cand-2');
    expect(row.textContent).toContain('BOQ.xlsx, Sheet BOQ, Row 48');
    expect(row.textContent).toContain('Amount mismatch');
    expect(row.textContent).toContain(
      'Quantity times rate is 67500.00, the sheet says 99000.00.'
    );
    expect(screen.getByTitle('Cell B48', { exact: true })).toHaveTextContent(
      'RCC M25 in footings'
    );
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Show cells' })[1] as HTMLElement
    );
    expect(screen.getByText('Cell F48')).toBeInTheDocument();
  });

  test('bulk accept sends the unflagged rows only', async () => {
    const screen = open();
    const button = await screen.findByRole('button', {
      name: /Accept 1 row without flags/,
    });
    fireEvent.click(button);
    await waitFor(() => expect(ingest.decide).toHaveBeenCalled());
    expect(ingest.decide.mock.calls[0]).toEqual([
      'pkg-1',
      [{ candidateId: 'cand-1', action: 'ACCEPT' }],
    ]);
  });

  test('a flagged row is accepted only with its flag ticked, and the code is sent', async () => {
    const screen = open();
    const accept = await screen.findByRole('button', {
      name: 'Accept BOQ.xlsx, Sheet BOQ, Row 48',
    });
    expect(accept).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Checked: Amount mismatch'));
    expect(accept).not.toBeDisabled();
    fireEvent.click(accept);
    await waitFor(() => expect(ingest.decide).toHaveBeenCalled());
    expect(ingest.decide.mock.calls[0]).toEqual([
      'pkg-1',
      [
        {
          candidateId: 'cand-2',
          action: 'ACCEPT',
          acknowledgedFlags: ['AMOUNT_MISMATCH'],
        },
      ],
    ]);
  });

  test('accepting by a chosen flag code sends that code for the rows with only that flag', async () => {
    const screen = open();
    fireEvent.change(await screen.findByLabelText('Flag I have checked'), {
      target: { value: 'LUMP_SUM' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Accept 1 row with only this flag' })
    );
    await waitFor(() => expect(ingest.decide).toHaveBeenCalled());
    expect(ingest.decide.mock.calls[0]).toEqual([
      'pkg-1',
      [
        {
          candidateId: 'cand-3',
          action: 'ACCEPT',
          acknowledgedFlags: ['LUMP_SUM'],
        },
      ],
    ]);
  });

  test('an inline edit sends the changed fields as an EDIT decision', async () => {
    const screen = open();
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Edit BOQ.xlsx, Sheet BOQ, Row 47',
      })
    );
    fireEvent.change(screen.getByLabelText('Unit'), {
      target: { value: 'm3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save and accept' }));
    await waitFor(() => expect(ingest.decide).toHaveBeenCalled());
    expect(ingest.decide.mock.calls[0]).toEqual([
      'pkg-1',
      [{ candidateId: 'cand-1', action: 'EDIT', edits: { unit: 'm3' } }],
    ]);
  });

  test('a row the backend skipped says why', async () => {
    ingest.decide.mockImplementation(async () => [
      {
        candidateId: 'cand-1',
        outcome: 'SKIPPED_FLAGGED',
        message: 'Tick AMOUNT_MISMATCH to accept this row.',
      },
    ]);
    const screen = open();
    fireEvent.click(
      await screen.findByRole('button', { name: /Accept 1 row without flags/ })
    );
    const summary = await screen.findByTestId('decision-summary');
    expect(summary.textContent).toContain('Skipped, a flag is not ticked: 1');
    expect(summary.textContent).toContain(
      'BOQ.xlsx, Sheet BOQ, Row 47: Tick AMOUNT_MISMATCH to accept this row.'
    );
  });
});
