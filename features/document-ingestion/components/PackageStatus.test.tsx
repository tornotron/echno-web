/**
 * The package screen's state: the banner names each page not read, file by
 * file, and "Retry failed parts" sends only that job's failed chunks again;
 * the spend panel states use against the limits; the documents table shows
 * each file's class, parts and reading jobs.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import {
  classification,
  extractJob,
  ingest,
  installMocks,
  page,
  pdfNames,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

installMocks();

const { UnreadPagesBanner, unreadEntries } =
  await import('./UnreadPagesBanner');
const { LlmSpendPanel } = await import('./LlmSpendPanel');
const { IngestDocumentsTable } = await import('./IngestDocuments');

const spec = classification({
  documentId: 'doc-spec',
  fileName: 'Specification.pdf',
  docClass: 'SPECIFICATION',
  unreadPages: [
    { page: 40, reason: 'CORRUPT', detail: 'the page would not open' },
  ],
});
const partial = extractJob({
  id: 'job-9',
  documentId: 'doc-spec',
  status: 'PARTIAL',
  chunksTotal: 5,
  chunksDone: 4,
  chunksFailed: 1,
  failedPages: [
    { page: 17, reason: 'NO_ANSWER' },
    { page: 18, reason: 'NO_ANSWER' },
  ],
});

beforeEach(resetMocks);
afterEach(cleanup);

describe('UnreadPagesBanner', () => {
  test('names the unread pages of each file and retries only failed parts', async () => {
    const screen = renderWithClient(
      createElement(UnreadPagesBanner, {
        classifications: [spec],
        jobs: [partial, extractJob({ id: 'job-ok' })],
      })
    );
    const banner = screen.getByTestId('unread-banner');
    expect(banner).toHaveTextContent(
      'Specification.pdf: page 40 not read (the page would not open)'
    );
    expect(banner).toHaveTextContent(
      'Specification.pdf: pages 17 and 18 not read (NO_ANSWER)'
    );
    const retry = screen.getAllByRole('button', { name: 'Retry failed parts' });
    expect(retry).toHaveLength(1);
    fireEvent.click(retry[0]);
    await waitFor(() => expect(ingest.retryFailedChunks).toHaveBeenCalled());
    expect(ingest.retryFailedChunks.mock.calls[0]).toEqual(['job-9']);
  });

  test('nothing to say, no banner', () => {
    expect(unreadEntries([classification()], [extractJob()])).toEqual([]);
    const screen = renderWithClient(
      createElement(UnreadPagesBanner, { classifications: [], jobs: [] })
    );
    expect(screen.queryByTestId('unread-banner')).toBeNull();
  });

  test('a job still running offers no retry', () => {
    const entries = unreadEntries([spec], [{ ...partial, status: 'RUNNING' }]);
    expect(
      entries.find((e) => e.key === 'job-job-9')?.retryJob
    ).toBeUndefined();
  });
});

describe('LlmSpendPanel', () => {
  test('states use against the limits and lists what was sent', async () => {
    ingest.listPackageLlmCalls.mockImplementation(async () =>
      page([
        {
          id: 'call-1',
          packageId: 'pkg-1',
          documentId: 'doc-nit',
          jobId: 'job-1',
          chunkKey: '1-8',
          callNumber: 1,
          extractorKey: 'project-fields',
          promptVersion: '1',
          model: 'llama3.3-70b-instruct',
          promptTokens: 3000,
          completionTokens: 200,
          estimatedCostUsd: 0.0031,
          latencyMs: 900,
          outcome: 'OK',
          pages: [1, 2, 3],
        },
      ])
    );
    const screen = renderWithClient(
      createElement(LlmSpendPanel, { packageId: 'pkg-1', fileNames: pdfNames })
    );
    const panel = await screen.findByTestId('llm-spend');
    expect(panel).toHaveTextContent(
      'This package: 4 AI reading calls, 12,000 tokens, about $0.0123 of $5.00.'
    );
    expect(panel).toHaveTextContent(
      'Your organization this month: 30 calls, 90,000 tokens, about $0.4000 of $20.00.'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show what was sent' }));
    expect(
      await screen.findByText('NIT.pdf, pages 1, 2 and 3')
    ).toBeInTheDocument();
    expect(screen.getByText('llama3.3-70b-instruct')).toBeInTheDocument();
    expect(screen.getByText('3200')).toBeInTheDocument();
  });

  test('a limit reached is said in the backend sentence', async () => {
    ingest.getLlmSpend.mockImplementation(async () => ({
      packageCalls: 0,
      packageTokens: 0,
      packageCostUsd: 0,
      packageTokenLimit: 0,
      packageUsdLimit: 0,
      monthCalls: 0,
      monthTokens: 0,
      monthCostUsd: 0,
      monthTokenLimit: 0,
      monthUsdLimit: 0,
      pricesKnown: false,
      exceeded: 'The monthly limit of $20.00 is reached.',
    }));
    const screen = renderWithClient(
      createElement(LlmSpendPanel, { packageId: 'pkg-1', fileNames: pdfNames })
    );
    expect(
      await screen.findByText('The monthly limit of $20.00 is reached.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/dollar figures are lower than the real cost/)
    ).toBeInTheDocument();
  });
});

describe('IngestDocumentsTable', () => {
  test('shows each file with its class, parts and reading jobs', () => {
    const screen = render(
      createElement(IngestDocumentsTable, {
        documents: [
          {
            id: 'doc-spec',
            packageId: 'pkg-1',
            fileName: 'Specification.pdf',
            sizeBytes: 2048,
            status: 'PARSED',
            pageCount: 120,
            pagesOcr: 3,
          },
        ],
        classifications: [
          {
            ...spec,
            confirmed: true,
            segments: [
              {
                id: 'seg-s',
                docClass: 'SPECIFICATION',
                pageFrom: 1,
                pageTo: 120,
                status: 'PARTIAL',
                unreadPages: [],
              },
            ],
          },
        ],
        jobs: [partial],
      })
    );
    const row = screen.getByTestId('document-doc-spec');
    expect(row).toHaveTextContent('120 pages, 3 scanned');
    expect(row).toHaveTextContent('Pages 1 to 120: Specification, Partly read');
    expect(row).toHaveTextContent(
      'project-fields: Partly read, 4 of 5 parts, 1 failed'
    );
  });
});
