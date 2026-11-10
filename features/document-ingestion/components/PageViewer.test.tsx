/**
 * The page viewer draws the source box where the worker found the value,
 * names the sheet, row and cell for a workbook, and shows the quote as
 * text, with a warning when it was not found on the page.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup } from '@testing-library/react';
import {
  ingest,
  installMocks,
  pageSource,
  renderWithClient as render,
  resetMocks,
} from '../test/mocks';

installMocks();
const { PageViewer } = await import('./PageViewer');

beforeEach(resetMocks);
afterEach(cleanup);

describe('PageViewer', () => {
  test('draws the box on the page image at its normalized place', () => {
    const screen = render(
      createElement(PageViewer, {
        source: pageSource(),
        fileName: 'NIT.pdf',
        imageUrl: 'https://store.example.test/page-images/2.webp',
      })
    );
    expect(screen.getByText('NIT.pdf, page 2')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://store.example.test/page-images/2.webp'
    );
    const box = screen.getByTestId('source-box');
    expect(box.style.left).toBe('10%');
    expect(box.style.top).toBe('20%');
    expect(box.style.width).toBe('50%');
    expect(box.style.height).toBe('5%');
  });

  test('fetches the page image for the source and shows it', async () => {
    ingest.getPageImage.mockImplementation(async () => ({
      url: 'https://store.example.test/fetched/2.webp',
      expiresInSeconds: 300,
    }));
    const screen = render(
      createElement(PageViewer, { source: pageSource(), fileName: 'NIT.pdf' })
    );
    expect(await screen.findByRole('img')).toHaveAttribute(
      'src',
      'https://store.example.test/fetched/2.webp'
    );
    expect(ingest.getPageImage.mock.calls[0]).toEqual(['doc-nit', 2]);
    expect(screen.getByTestId('source-box')).toBeInTheDocument();
  });

  test('with no image it still places the box and says why', () => {
    const screen = render(
      createElement(PageViewer, { source: pageSource(), fileName: 'NIT.pdf' })
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByTestId('source-box')).toBeInTheDocument();
    expect(
      screen.getByText(/The page image is not shown here yet/)
    ).toBeInTheDocument();
  });

  test('a workbook source names sheet, row and cell, with no page', () => {
    const screen = render(
      createElement(PageViewer, {
        source: pageSource({
          page: undefined,
          box: undefined,
          sheet: 'Milestones',
          rowNumber: 6,
          cell: 'C6',
          quote: '20%',
        }),
        fileName: 'Schedule.xlsx',
      })
    );
    expect(
      screen.getByText('Schedule.xlsx, sheet Milestones, row 6, cell C6')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('source-box')).toBeNull();
  });

  test('the quote is text, and an unverified one is called out', () => {
    const quote = '<img src=x onerror="alert(1)"> Bid due 14 Dec';
    const screen = render(
      createElement(PageViewer, {
        source: pageSource({ quote, quoteVerified: false }),
        fileName: 'NIT.pdf',
      })
    );
    expect(screen.getByText(quote)).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
    expect(
      screen.getByText(/The quote was not found on the page/)
    ).toBeInTheDocument();
  });
});
