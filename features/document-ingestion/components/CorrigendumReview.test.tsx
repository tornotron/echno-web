/**
 * Corrigendum: each change with its old, new and earlier value, variance and
 * money impact; a statement that matches nothing listed apart; a change the
 * apply step refused offered as a choice between the record and the change;
 * and a revised file recorded against the one it replaces.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import type { IngestDocument } from '@tornotron/echno-core/document-ingestion/types';
import {
  ingest,
  installMocks,
  page,
  pageSource,
  pdfCandidate,
  pdfNames,
  pkg,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

installMocks();

const { CorrigendumReview } = await import('./CorrigendumReview');

function change(id: string, payload: Record<string, unknown>, overrides = {}) {
  return pdfCandidate({
    id,
    kind: 'CHANGE',
    documentId: 'doc-cor',
    payload: { origin: 'CORRIGENDUM', targetKind: 'BOQ_ITEM', ...payload },
    sources: [pageSource({ id: `src-${id}`, documentId: 'doc-cor', page: 1 })],
    ...overrides,
  });
}

const quantity = change('ch-1', {
  target: '3.2',
  field: 'quantity',
  oldValue: '850',
  newValue: '920',
  priorValue: '850',
  quantityVariance: '+70',
  moneyImpact: '686000.00',
});
const unmatched = change(
  'ch-2',
  { target: '9.9', field: 'rate', newValue: '410' },
  {
    flags: [{ code: 'UNMATCHED', message: 'No BOQ item 9.9 in the package.' }],
  }
);
const conflict = change(
  'ch-3',
  { target: '4.1', field: 'rate', priorValue: '5400', newValue: '5600' },
  {
    status: 'APPLY_FAILED',
    applyError:
      'The BOQ line 4.1 was edited by hand after it was applied. Its rate is 5500 on the record, 5400 was applied, and the change gives 5600. Nothing was overwritten; choose which to keep.',
  }
);

const documents: IngestDocument[] = [
  {
    id: 'doc-1',
    packageId: 'pkg-1',
    fileName: 'BOQ.xlsx',
    sizeBytes: 1,
    status: 'PARSED',
    fileType: 'XLSX',
  },
  {
    id: 'doc-2',
    packageId: 'pkg-1',
    fileName: 'BOQ-rev1.xlsx',
    sizeBytes: 1,
    status: 'PARSED',
    fileType: 'XLSX',
    supersedesDocumentId: 'doc-1',
    revisionLabel: 'Rev 1',
  },
];

beforeEach(() => {
  resetMocks();
  ingest.listCandidates.mockImplementation(async (_id, params) => {
    const status = (params as { status?: string } | undefined)?.status;
    if (status === 'APPLY_FAILED') return page([conflict]);
    return page([quantity, unmatched, conflict]);
  });
});
afterEach(cleanup);

function open() {
  return renderWithClient(
    createElement(CorrigendumReview, {
      pkg,
      documents,
      fileNames: { ...pdfNames, 'doc-2': 'BOQ-rev1.xlsx' },
    })
  );
}

describe('CorrigendumReview', () => {
  test('a change shows old, new, earlier value, variance and money impact', async () => {
    const screen = open();
    const row = await screen.findByTestId('candidate-ch-1');
    for (const text of [
      '3.2',
      '850',
      '920',
      '+70',
      '686000.00',
      'Corrigendum',
    ]) {
      expect(row).toHaveTextContent(text);
    }
    expect(screen.queryByTestId('candidate-ch-2')).toBeNull();
    expect(screen.queryByTestId('candidate-ch-3')).toBeNull();
  });

  test('an unmatched statement is listed apart, never dropped', async () => {
    const screen = open();
    const list = await screen.findByTestId('unmatched');
    expect(list).toHaveTextContent('Not matched to any earlier value (1)');
    expect(list).toHaveTextContent('9.9, rate: 410');
    expect(list).toHaveTextContent('No BOQ item 9.9 in the package.');
  });

  test('a refused change offers the record or the change', async () => {
    const screen = open();
    const card = await screen.findByTestId('conflict-ch-3');
    expect(card).toHaveTextContent('Value last applied5400');
    expect(card).toHaveTextContent('Value in the change5600');
    expect(card).toHaveTextContent('Its rate is 5500 on the record');
    fireEvent.click(screen.getByRole('button', { name: 'Keep the record' }));
    await waitFor(() => expect(ingest.resolveConflict).toHaveBeenCalled());
    expect(ingest.resolveConflict.mock.calls[0]).toEqual([
      'ch-3',
      'KEEP_RECORD',
    ]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Write the change over the record' })
    );
    await waitFor(() =>
      expect(ingest.resolveConflict).toHaveBeenCalledTimes(2)
    );
    expect(ingest.resolveConflict.mock.calls[1]).toEqual([
      'ch-3',
      'APPLY_CHANGE',
    ]);
  });

  test('a revised file is recorded against the one it replaces, and compared', async () => {
    ingest.diffRevision.mockImplementation(async () => ({
      itemsCompared: 120,
      changesProposed: 3,
      itemsAdded: 1,
      itemsRemoved: 0,
    }));
    const screen = open();
    fireEvent.change(screen.getByLabelText('Revised file'), {
      target: { value: 'doc-2' },
    });
    fireEvent.change(screen.getByLabelText('Replaces'), {
      target: { value: 'doc-1' },
    });
    fireEvent.change(screen.getByLabelText('Revision label'), {
      target: { value: 'Rev 1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save revision' }));
    await waitFor(() => expect(ingest.setRevision).toHaveBeenCalled());
    expect(ingest.setRevision.mock.calls[0]).toEqual([
      'doc-2',
      { supersedesDocumentId: 'doc-1', revisionLabel: 'Rev 1' },
    ]);
    expect(
      screen.getByText(/BOQ-rev1\.xlsx \(Rev 1\) replaces BOQ\.xlsx/)
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Compare with the file it replaces' })
    );
    expect(
      await screen.findByText(
        'Compared 120 items: 3 changes, 1 added, 0 removed.'
      )
    ).toBeInTheDocument();
    expect(ingest.diffRevision.mock.calls[0]).toEqual(['doc-2']);
  });

  test('apply writes the accepted changes', async () => {
    const screen = open();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Apply changes' })
    );
    await waitFor(() => expect(ingest.applyAll).toHaveBeenCalled());
    expect(ingest.applyAll.mock.calls[0]).toEqual(['pkg-1', 'CHANGE']);
  });
});
