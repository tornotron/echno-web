/**
 * Drawings: the register lists current revisions unless told otherwise, a
 * sheet not read says so, and a picked drawing shows its title block crop,
 * or says there is none when the backend has no crop for that page.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import {
  ingest,
  installMocks,
  page,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

installMocks();

const { DrawingsList } = await import('./DrawingRegister');

function drawing(overrides = {}) {
  return {
    id: 'dr-1',
    packageId: 'pkg-1',
    candidateId: 'c-dr1',
    documentId: 'doc-dwg',
    drawingNumber: 'RC-A-101',
    title: 'Ground floor plan',
    discipline: 'Architectural',
    revision: 'C',
    revisionDateText: '12/08/2026',
    sheetPage: 3,
    sourceFormat: 'PDF',
    status: 'READ',
    current: true,
    cropAvailable: true,
    revisionHistory: [
      { revision: 'B', date: '01/07/2026', description: 'Grid revised' },
    ],
    ...overrides,
  };
}

const rows = [
  drawing(),
  drawing({
    id: 'dr-2',
    drawingNumber: 'RC-S-201',
    title: 'Foundation layout',
    discipline: 'Structural',
    status: 'NOT_READ',
    cropAvailable: false,
    sheetPage: undefined,
    revisionHistory: [],
  }),
];

beforeEach(() => {
  resetMocks();
  ingest.listDrawings.mockImplementation(async () => page(rows));
  ingest.listDrawingRevisions.mockImplementation(async () => [
    drawing({ id: 'dr-0', revision: 'B', current: false }),
    drawing(),
  ]);
});
afterEach(cleanup);

function open() {
  return renderWithClient(createElement(DrawingsList, { packageId: 'pkg-1' }));
}

describe('DrawingsList', () => {
  test('lists current revisions first, and all on request', async () => {
    const screen = open();
    expect(await screen.findByText('RC-A-101')).toBeInTheDocument();
    expect(ingest.listDrawings.mock.calls[0]?.[1]).toEqual({
      currentOnly: true,
      size: 200,
    });
    expect(screen.getByText('Not read')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Current revisions only'));
    await waitFor(() =>
      expect(
        ingest.listDrawings.mock.calls.some(
          (call) => (call[1] as { currentOnly?: boolean }).currentOnly === false
        )
      ).toBe(true)
    );
  });

  test('shows the title block crop and the revisions of a picked drawing', async () => {
    ingest.getTitleBlockImage.mockImplementation(async () => ({
      url: 'https://files.example.test/crop-3.webp',
      expiresInSeconds: 60,
    }));
    const screen = open();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Show drawing RC-A-101' })
    );
    const img = await screen.findByAltText('Title block of drawing RC-A-101');
    expect(img.getAttribute('src')).toBe(
      'https://files.example.test/crop-3.webp'
    );
    expect(ingest.getTitleBlockImage.mock.calls[0]).toEqual(['doc-dwg', 3]);
    expect(screen.getByText('B, 01/07/2026, Grid revised')).toBeInTheDocument();
    expect(
      await screen.findByText('Revision B, 12/08/2026, replaced')
    ).toBeInTheDocument();
  });

  test('says there is no crop when the backend has none', async () => {
    const screen = open();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Show drawing RC-A-101' })
    );
    expect(
      await screen.findByText('No title block crop for this sheet.')
    ).toBeInTheDocument();
  });

  test('never asks for a crop the drawing does not have', async () => {
    const screen = open();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Show drawing RC-S-201' })
    );
    expect(
      await screen.findByText('No title block crop for this sheet.')
    ).toBeInTheDocument();
    expect(ingest.getTitleBlockImage).not.toHaveBeenCalled();
  });
});
