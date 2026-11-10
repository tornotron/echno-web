/**
 * The package screen: the AI reading notice and the unread-pages banner sit
 * above the tabs, the first tab lists the files with their classes, and each
 * review kind has its own tab.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup } from '@testing-library/react';
import {
  classification,
  extractJob,
  ingest,
  installMocks,
  page,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

installMocks();

const { IngestPackageDetail } = await import('./IngestPackageDetail');

beforeEach(() => {
  resetMocks();
  ingest.listDocuments.mockImplementation(async () =>
    page([
      {
        id: 'doc-nit',
        packageId: 'pkg-1',
        fileName: 'NIT.pdf',
        sizeBytes: 4096,
        status: 'PARSED',
        fileType: 'PDF',
        pageCount: 12,
      },
    ])
  );
  ingest.listClassifications.mockImplementation(async () =>
    page([classification()])
  );
  ingest.listExtractJobs.mockImplementation(async () =>
    page([
      extractJob({
        status: 'PARTIAL',
        chunksFailed: 1,
        failedPages: [{ page: 9, reason: 'NO_ANSWER' }],
      }),
    ])
  );
});
afterEach(cleanup);

describe('IngestPackageDetail', () => {
  test('shows the notice, the unread pages and the tabs', async () => {
    const screen = renderWithClient(
      createElement(IngestPackageDetail, { packageId: 'pkg-1' })
    );
    expect(
      await screen.findByText('Tower C civil works tender')
    ).toBeInTheDocument();
    expect(screen.getByTestId('ai-reading-notice')).toBeInTheDocument();
    expect(await screen.findByTestId('unread-banner')).toHaveTextContent(
      'NIT.pdf: page 9 not read'
    );
    for (const tab of [
      'Files and classes',
      'BOQ',
      'Project',
      'Milestones',
      'Corrigendum',
    ]) {
      expect(screen.getByRole('tab', { name: tab })).toBeInTheDocument();
    }
    expect(await screen.findByTestId('document-doc-nit')).toHaveTextContent(
      'Notice inviting tender, to confirm'
    );
    expect(screen.getByTestId('class-doc-nit')).toBeInTheDocument();
  });
});
