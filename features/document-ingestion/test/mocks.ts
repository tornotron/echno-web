/**
 * What the Document Ingestion component tests replace. The core services are
 * stubbed so the real query and mutation hooks run through TanStack, and the
 * project list is the one hook replaced outright. Every replaced module is put
 * back after the file: `mock.module` is process wide and would otherwise keep
 * answering in whichever test file runs next.
 */
import { afterAll, mock } from 'bun:test';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import * as realContractBillingServices from '@tornotron/echno-core/contract-billing/services';
import * as realIngestServices from '@tornotron/echno-core/document-ingestion/services';
import type {
  BoqSheet,
  Candidate,
  IngestPackage,
  IngestPage,
} from '@tornotron/echno-core/document-ingestion/types';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';

// Copied now, before `installMocks` runs: a namespace object is live, so once a
// module is mocked its namespace reads as the mock.
const originals: Record<string, Record<string, unknown>> = {
  '@tornotron/echno-core/document-ingestion/services': {
    ...realIngestServices,
  },
  '@tornotron/echno-core/contract-billing/services': {
    ...realContractBillingServices,
  },
  '@tornotron/echno-core/project/hooks': { ...realProjectHooks },
};

export function page<T>(content: T[]): IngestPage<T> {
  return {
    content,
    page: 0,
    size: 200,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
  };
}

const empty = async (): Promise<unknown> => page([]);

export const ingest = {
  status: mock(
    async (): Promise<unknown> => ({
      moduleId: 'document-ingestion',
      version: '1',
    })
  ),
  listCandidates: mock(
    async (_packageId: string, _params?: unknown): Promise<unknown> => page([])
  ),
  decide: mock(
    async (_packageId: string, _decisions: unknown[]): Promise<unknown> => []
  ),
  applyAll: mock(
    async (_packageId: string, _kind: string): Promise<unknown> => ({
      applied: 0,
      failed: 0,
      remaining: 0,
    })
  ),
  setBoqTarget: mock(
    async (_packageId: string, _req: unknown): Promise<unknown> => ({})
  ),
  extractBoqSheet: mock(
    async (
      _documentId: string,
      _sheetId: string,
      _req: unknown
    ): Promise<unknown> => ({})
  ),
  listBoqSheets: mock(async (_documentId: string): Promise<unknown> => []),
  detectBoqSheets: mock(async (_documentId: string): Promise<unknown> => []),
};

export const billing = {
  listContracts: mock(empty),
};

export function installMocks() {
  afterAll(restoreMocks);
  mock.module('@tornotron/echno-core/document-ingestion/services', () => ({
    ...realIngestServices,
    documentIngestionService: {
      ...realIngestServices.documentIngestionService,
      ...ingest,
    },
  }));
  mock.module('@tornotron/echno-core/contract-billing/services', () => ({
    ...realContractBillingServices,
    contractBillingService: {
      ...realContractBillingServices.contractBillingService,
      ...billing,
    },
  }));
  mock.module('@tornotron/echno-core/project/hooks', () => ({
    ...realProjectHooks,
    useProjects: () => ({ data: [], isPending: false, isLoading: false }),
  }));
}

function restoreMocks() {
  for (const [path, original] of Object.entries(originals)) {
    mock.module(path, () => original);
  }
}

export function resetMocks() {
  for (const fn of Object.values(ingest)) fn.mockReset();
  ingest.status.mockImplementation(async () => ({
    moduleId: 'document-ingestion',
    version: '1',
  }));
  ingest.listCandidates.mockImplementation(async () => page([]));
  ingest.decide.mockImplementation(async () => []);
  ingest.applyAll.mockImplementation(async () => ({
    applied: 0,
    failed: 0,
    remaining: 0,
  }));
  ingest.setBoqTarget.mockImplementation(async () => ({}));
  ingest.extractBoqSheet.mockImplementation(async () => ({}));
  ingest.listBoqSheets.mockImplementation(async () => []);
  ingest.detectBoqSheets.mockImplementation(async () => []);
  billing.listContracts.mockReset();
  billing.listContracts.mockImplementation(empty);
}

/** Renders inside a fresh query client, so no cache crosses tests. */
export function renderWithClient(element: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(createElement(QueryClientProvider, { client }, element));
}

// ------------------------------------------------------------------ fixtures

export const pkg: IngestPackage = {
  id: 'pkg-1',
  name: 'Tower C civil works tender',
  projectId: 7,
  stage: 'TENDER',
  status: 'OPEN',
  documentCount: 1,
};

export const fileNames = { 'doc-1': 'BOQ.xlsx' };

function source(field: string, cell: string, quote: string, row = 47) {
  return {
    id: `src-${field}-${row}`,
    field,
    documentId: 'doc-1',
    sheet: 'BOQ',
    rowNumber: row,
    cell,
    quote,
    quoteVerified: true,
  };
}

export function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'cand-1',
    packageId: 'pkg-1',
    documentId: 'doc-1',
    kind: 'BOQ_ITEM',
    naturalKey: 'BOQ!47',
    payload: {
      itemCode: '2.1',
      description: 'PCC 1:4:8 below footings',
      unit: 'cum',
      quantity: '12.500',
      rate: '5400.00',
      amount: '67500.00',
      section: 'Substructure',
      sheet: 'BOQ',
      sheetIndex: 0,
      row: 47,
    },
    flags: [],
    acknowledgedFlags: [],
    status: 'PROPOSED',
    sources: [
      source('itemCode', 'A47', '2.1'),
      source('description', 'B47', 'PCC 1:4:8 below footings'),
      source('unit', 'C47', 'cum'),
      source('quantity', 'D47', '12.5'),
      source('rate', 'E47', '5400'),
      source('amount', 'F47', '67500'),
    ],
    ...overrides,
  };
}

export const sheet: BoqSheet = {
  id: 'sheet-1',
  documentId: 'doc-1',
  sheetName: 'BOQ',
  sheetIndex: 0,
  hidden: false,
  status: 'DETECTED',
  headerRow: 3,
  columns: { itemCode: 1, description: 2, unit: 3, quantity: 4, rate: 5 },
  preview: [
    {
      row: 1,
      hidden: false,
      cells: [{ col: 1, ref: 'A1', text: 'Bill of quantities' }],
    },
    {
      row: 3,
      hidden: false,
      cells: [
        { col: 1, ref: 'A3', text: 'Item' },
        { col: 2, ref: 'B3', text: 'Description' },
        { col: 3, ref: 'C3', text: 'Unit' },
        { col: 4, ref: 'D3', text: 'Qty' },
        { col: 5, ref: 'E3', text: 'Rate' },
        { col: 6, ref: 'F3', text: 'Amount' },
      ],
    },
    {
      row: 4,
      hidden: false,
      cells: [
        { col: 1, ref: 'A4', text: '2.1' },
        { col: 2, ref: 'B4', text: 'PCC 1:4:8 below footings' },
        { col: 3, ref: 'C4', text: 'cum' },
        { col: 4, ref: 'D4', text: '12.5' },
        { col: 5, ref: 'E4', text: '5400' },
        { col: 6, ref: 'F4', text: '67500' },
      ],
    },
  ],
  rowCount: 40,
};
