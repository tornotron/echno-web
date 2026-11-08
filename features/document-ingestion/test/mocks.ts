/**
 * What the Document Ingestion component tests replace. The core services are
 * stubbed so the real query and mutation hooks run through TanStack; the
 * project list is replaced outright, and the org-role gate answers from
 * `access.roles`, which a test sets to the roles it signs in with. Every replaced module is put
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
  DocumentClassification,
  ExtractJob,
  IngestPackage,
  IngestPage,
  SourceRef,
} from '@tornotron/echno-core/document-ingestion/types';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realUseCan from '@/hooks/use-can';
import { can } from '@/nav/access/evaluate';
import type { AccessConfig } from '@/nav/access/roles';

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
  '@/hooks/use-can': { ...realUseCan },
};

/** The org roles the signed-in person holds; a project manager unless a test says otherwise. */
export const access: { roles: OrgRole[] } = {
  roles: [OrgRole.PROJECT_MANAGER],
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
  listClassifications: mock(
    async (_packageId: string, _params?: unknown): Promise<unknown> => page([])
  ),
  classifyDocument: mock(
    async (_documentId: string, _req: unknown): Promise<unknown> => ({})
  ),
  confirmAllClassificationsFully: mock(
    async (_packageId: string): Promise<unknown> => ({
      documentsConfirmed: 0,
      segmentsConfirmed: 0,
      jobsQueued: 0,
      remaining: 0,
    })
  ),
  listExtractJobs: mock(
    async (_packageId: string, _params?: unknown): Promise<unknown> => page([])
  ),
  retryFailedChunks: mock(async (_jobId: string): Promise<unknown> => ({})),
  getLlmSpend: mock(async (_packageId: string): Promise<unknown> => spend),
  listPackageLlmCalls: mock(
    async (_packageId: string, _params?: unknown): Promise<unknown> => page([])
  ),
  getSettings: mock(async (): Promise<unknown> => settings),
  setLlmReading: mock(async (_enabled: boolean): Promise<unknown> => settings),
  setMonthlyLlmBudget: mock(
    async (_req: unknown): Promise<unknown> => settings
  ),
  getTenderProfile: mock(async (_packageId: string): Promise<unknown> => null),
  setRevision: mock(
    async (_documentId: string, _req: unknown): Promise<unknown> => ({})
  ),
  diffRevision: mock(
    async (_documentId: string): Promise<unknown> => ({
      itemsCompared: 0,
      changesProposed: 0,
      itemsAdded: 0,
      itemsRemoved: 0,
    })
  ),
  resolveConflict: mock(
    async (_candidateId: string, _choice: string): Promise<unknown> => ({})
  ),
  provenance: mock(
    async (_targetType: string, _targetId: string): Promise<unknown> => []
  ),
  listPackages: mock(async (_params?: unknown): Promise<unknown> => page([])),
  getPackage: mock(async (_packageId: string): Promise<unknown> => pkg),
  listDocuments: mock(
    async (_packageId: string, _params?: unknown): Promise<unknown> => page([])
  ),
  createPackage: mock(async (_req: unknown): Promise<unknown> => pkg),
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
  mock.module('@/hooks/use-can', () => ({
    ...originals['@/hooks/use-can'],
    useCan: (config: AccessConfig) => ({
      allowed: can(config, access.roles),
      isLoading: false,
    }),
  }));
}

function restoreMocks() {
  for (const [path, original] of Object.entries(originals)) {
    mock.module(path, () => original);
  }
}

const defaults = Object.fromEntries(
  Object.entries(ingest).map(([name, fn]) => [name, fn.getMockImplementation()])
);

export function resetMocks() {
  access.roles = [OrgRole.PROJECT_MANAGER];
  for (const [name, fn] of Object.entries(ingest)) {
    fn.mockReset();
    const impl = defaults[name];
    if (impl) fn.mockImplementation(impl as never);
  }
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

// ------------------------------------------------- fixtures for read documents

export const spend = {
  packageCalls: 4,
  packageTokens: 12_000,
  packageCostUsd: 0.0123,
  packageTokenLimit: 0,
  packageUsdLimit: 5,
  monthCalls: 30,
  monthTokens: 90_000,
  monthCostUsd: 0.4,
  monthTokenLimit: 0,
  monthUsdLimit: 20,
  pricesKnown: true,
};

export const settings = {
  llmReadingEnabled: true,
  llmReadingDisclosure:
    'When this is on, the text of tender files uploaded here is sent to the AI service Echno is set up with. The service states that it does not keep the text or train on it.',
  recentChanges: [],
};

export const pdfNames = {
  'doc-nit': 'NIT.pdf',
  'doc-cor': 'Corrigendum-1.pdf',
  'doc-1': 'BOQ.xlsx',
};

export function pageSource(overrides: Partial<SourceRef> = {}): SourceRef {
  return {
    id: 'src-p-1',
    field: 'value',
    documentId: 'doc-nit',
    page: 2,
    box: [0.1, 0.2, 0.6, 0.25],
    quote: 'Name of work: Construction of Block A, Riverside Campus',
    quoteVerified: true,
    ...overrides,
  };
}

/** A candidate read from a PDF page, of any kind. */
export function pdfCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'pf-1',
    packageId: 'pkg-1',
    documentId: 'doc-nit',
    kind: 'PROJECT_FIELD',
    naturalKey: 'project_name',
    payload: { value: 'Construction of Block A, Riverside Campus' },
    flags: [],
    acknowledgedFlags: [],
    method: 'LLM',
    status: 'PROPOSED',
    sources: [pageSource()],
    ...overrides,
  };
}

export function classification(
  overrides: Partial<DocumentClassification> = {}
): DocumentClassification {
  return {
    documentId: 'doc-nit',
    fileName: 'NIT.pdf',
    fileType: 'PDF',
    status: 'PARSED',
    pageCount: 12,
    docClass: 'NIT',
    classMethod: 'DETERMINISTIC',
    classReason: 'The first page is headed "Notice Inviting Tender".',
    confirmed: false,
    segments: [],
    unreadPages: [],
    ...overrides,
  };
}

export function extractJob(overrides: Partial<ExtractJob> = {}): ExtractJob {
  return {
    id: 'job-1',
    documentId: 'doc-nit',
    segmentId: 'seg-1',
    extractorKey: 'project-fields',
    extractorVersion: '1',
    status: 'DONE',
    attempt: 1,
    maxAttempts: 3,
    chunksTotal: 2,
    chunksDone: 2,
    chunksFailed: 0,
    failedPages: [],
    unreadPages: [],
    ...overrides,
  };
}
