/**
 * The mapping step opens on what the backend proposed for the sheet (header
 * row and one column per field, letters from the cell references) and sends
 * the confirmed mapping as 1-based column numbers.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import {
  ingest,
  installMocks,
  renderWithClient,
  resetMocks,
  sheet,
} from '../test/mocks';

installMocks();

const { BoqSheetMapping } = await import('./BoqSheetMapping');

beforeEach(resetMocks);
afterEach(cleanup);

function open() {
  return renderWithClient(
    createElement(BoqSheetMapping, { documentId: 'doc-1', sheet })
  );
}

describe('BoqSheetMapping', () => {
  test('proposes the detected header row and columns', () => {
    const screen = open();
    expect(screen.getByLabelText('Header row')).toHaveValue('3');
    expect(screen.getByLabelText('Item code')).toHaveValue('1');
    expect(screen.getByLabelText('Description (required)')).toHaveValue('2');
    expect(screen.getByLabelText('Rate')).toHaveValue('5');
    // Not detected: the person picks it or leaves it out.
    expect(screen.getByLabelText('Amount')).toHaveValue('');
    // Each column is offered by its letter and its heading in the header row.
    expect(
      screen.getAllByRole('option', { name: 'F: Amount' }).length
    ).toBeGreaterThan(0);
    const header = screen.container.querySelector('tr[data-header="true"]');
    expect(header?.textContent).toContain('Description');
  });

  test('submits the confirmed mapping as column numbers', async () => {
    const screen = open();
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '6' },
    });
    fireEvent.change(screen.getByLabelText('Code prefix (optional)'), {
      target: { value: ' CIV- ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Read sheet' }));
    await waitFor(() => expect(ingest.extractBoqSheet).toHaveBeenCalled());
    expect(ingest.extractBoqSheet.mock.calls[0]).toEqual([
      'doc-1',
      'sheet-1',
      {
        headerRow: 3,
        columns: {
          itemCode: 1,
          description: 2,
          unit: 3,
          quantity: 4,
          rate: 5,
          amount: 6,
        },
        codePrefix: 'CIV-',
      },
    ]);
  });

  test('a sheet cannot be read without a description column', () => {
    const screen = open();
    fireEvent.change(screen.getByLabelText('Description (required)'), {
      target: { value: '' },
    });
    expect(screen.getByRole('button', { name: 'Read sheet' })).toBeDisabled();
    expect(
      screen.getByText('Pick the description column to read this sheet.')
    ).toBeInTheDocument();
  });
});
