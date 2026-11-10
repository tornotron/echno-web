/**
 * Contract: every term shows whether it was found and where, a general value
 * the special conditions replace is struck through, a risk is raised once
 * and only by a role that manages risks, and bulk accept leaves flagged rows
 * and rows whose quote was not found.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import {
  access,
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

const { ContractReview, ContractTermsRegister, ObligationsRegister } =
  await import('./ContractReview');

const coverage = {
  read: [
    {
      documentId: 'doc-gcc',
      segmentId: 'seg-gcc',
      fileName: 'GCC.pdf',
      docClass: 'GCC',
      status: 'DONE',
      pagesSearched: '1-40',
      pagesNotRead: [12],
    },
  ],
  terms: [
    {
      term: 'ld_rate',
      label: 'Liquidated damages rate',
      status: 'FOUND',
      found: [
        {
          candidateId: 'c-scc',
          value: '0.5% per week',
          clause: '8.7',
          docClass: 'SCC',
          status: 'APPLIED',
          overridden: false,
        },
        {
          candidateId: 'c-gcc',
          value: '1% per week',
          clause: '8.7',
          docClass: 'GCC',
          status: 'SUPERSEDED',
          overridden: true,
        },
      ],
    },
    {
      term: 'dlp',
      label: 'Defects liability period',
      status: 'NOT_FOUND',
      message: 'Searched pages 1-40 of GCC.pdf.',
      found: [],
    },
    {
      term: 'insurance',
      label: 'Insurance',
      status: 'NOT_READ',
      found: [],
    },
  ],
};

const ldTerm = {
  id: 'term-1',
  packageId: 'pkg-1',
  projectId: 7,
  candidateId: 'c-scc',
  documentId: 'doc-scc',
  term: 'ld_rate',
  label: 'Liquidated damages rate',
  value: '0.5% per week',
  clause: '8.7',
};

beforeEach(() => {
  resetMocks();
  ingest.getContractTermCoverage.mockImplementation(async () => coverage);
  ingest.listContractTerms.mockImplementation(async () => [ldTerm]);
});
afterEach(cleanup);

describe('ContractTermsRegister', () => {
  test('shows each term as found, not found or not read', async () => {
    const screen = renderWithClient(
      createElement(ContractTermsRegister, { packageId: 'pkg-1' })
    );
    const ld = await screen.findByTestId('term-ld_rate');
    expect(ld).toHaveTextContent('Found');
    expect(ld).toHaveTextContent('Special conditions, clause 8.7');
    expect(ld).toHaveTextContent('replaced by the special conditions');
    expect(screen.getByText('1% per week').className).toContain('line-through');
    expect(screen.getByTestId('term-dlp')).toHaveTextContent('Not found');
    expect(screen.getByTestId('term-dlp')).toHaveTextContent(
      'Searched pages 1-40 of GCC.pdf.'
    );
    expect(screen.getByTestId('term-insurance')).toHaveTextContent('Not read');
    expect(
      screen.getByText('GCC.pdf, pages 1-40 searched, pages 12 not read')
    ).toBeInTheDocument();
  });

  test('raises a risk from an applied term', async () => {
    ingest.raiseContractTermRisk.mockImplementation(async () => ({
      riskId: 'risk-1',
      riskNumber: 'R-004',
      projectId: 7,
      created: true,
    }));
    const screen = renderWithClient(
      createElement(ContractTermsRegister, { packageId: 'pkg-1' })
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Raise a risk: Liquidated damages rate',
      })
    );
    expect(await screen.findByText('Risk R-004 raised')).toBeInTheDocument();
    expect(ingest.raiseContractTermRisk.mock.calls[0]?.[0]).toBe('term-1');
  });

  test('says when the risk was raised before', async () => {
    ingest.raiseContractTermRisk.mockImplementation(async () => ({
      riskId: 'risk-1',
      riskNumber: 'R-004',
      projectId: 7,
      created: false,
    }));
    const screen = renderWithClient(
      createElement(ContractTermsRegister, { packageId: 'pkg-1' })
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Raise a risk: Liquidated damages rate',
      })
    );
    expect(
      await screen.findByText('Already raised as R-004')
    ).toBeInTheDocument();
  });

  test('a role that cannot manage risks sees no button', async () => {
    access.roles = [OrgRole.SITE_ENGINEER];
    const screen = renderWithClient(
      createElement(ContractTermsRegister, { packageId: 'pkg-1' })
    );
    await screen.findByTestId('term-ld_rate');
    expect(screen.queryByRole('button', { name: /Raise a risk/ })).toBeNull();
  });
});

describe('ObligationsRegister', () => {
  test('lists obligations, and one with a risk says so', async () => {
    ingest.listObligations.mockImplementation(async () =>
      page([
        {
          id: 'ob-1',
          packageId: 'pkg-1',
          candidateId: 'c-ob1',
          documentId: 'doc-gcc',
          clause: '4.2',
          deadline: 'Within 28 days of the letter of acceptance',
          responsibleParty: 'Contractor',
          requiredDocument: 'Performance security',
          financialImpact: 'Forfeit of the bid security',
          riskId: 'risk-9',
        },
        {
          id: 'ob-2',
          packageId: 'pkg-1',
          candidateId: 'c-ob2',
          documentId: 'doc-gcc',
          clause: '8.3',
          deadline: '14 days after commencement',
          requiredDocument: 'Programme of works',
        },
      ])
    );
    ingest.raiseObligationRisk.mockImplementation(async () => ({
      riskId: 'risk-10',
      riskNumber: 'R-010',
      projectId: 7,
      created: true,
    }));
    const screen = renderWithClient(
      createElement(ObligationsRegister, { packageId: 'pkg-1' })
    );
    expect(
      await screen.findByText('Within 28 days of the letter of acceptance')
    ).toBeInTheDocument();
    expect(screen.getByText('Risk raised')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Raise a risk: 8.3' }));
    expect(await screen.findByText('Risk R-010 raised')).toBeInTheDocument();
    expect(ingest.raiseObligationRisk.mock.calls[0]?.[0]).toBe('ob-2');
  });
});

describe('ContractReview', () => {
  test('bulk accept leaves flagged rows and a row whose quote was not found', async () => {
    const terms = [
      pdfCandidate({
        id: 't1',
        kind: 'CONTRACT_TERM',
        naturalKey: 'retention',
        payload: {
          term: 'retention',
          value: '5% of each bill',
          clause: '14.3',
        },
      }),
      pdfCandidate({
        id: 't2',
        kind: 'CONTRACT_TERM',
        naturalKey: 'ld_rate',
        payload: { term: 'ld_rate', value: '1% per week', clause: '8.7' },
        flags: [
          {
            code: 'OVERRIDDEN_BY_SCC',
            message: 'The special conditions give another value.',
          },
        ],
      }),
      pdfCandidate({
        id: 't3',
        kind: 'CONTRACT_TERM',
        naturalKey: 'dlp',
        payload: { term: 'dlp', value: '12 months', clause: '11.1' },
        flags: [
          {
            code: 'QUOTE_NOT_FOUND',
            message: 'The quoted text is not on page 2.',
          },
        ],
      }),
    ];
    ingest.listCandidates.mockImplementation(async (_id, params) =>
      page((params as { kind?: string })?.kind === 'CONTRACT_TERM' ? terms : [])
    );
    ingest.decide.mockImplementation(async () => [
      { candidateId: 't1', outcome: 'ACCEPTED' },
    ]);
    const screen = renderWithClient(
      createElement(ContractReview, { pkg, fileNames: pdfNames })
    );
    const bulk = await screen.findByRole('button', {
      name: 'Accept 1 value ready to accept',
    });
    expect(screen.getByText('Replaced by the special conditions')).toBeTruthy();
    fireEvent.click(bulk);
    await waitFor(() => expect(ingest.decide).toHaveBeenCalledTimes(1));
    const decisions = ingest.decide.mock.calls[0]?.[1] as {
      candidateId: string;
    }[];
    expect(decisions.map((d) => d.candidateId)).toEqual(['t1']);
  });
});
