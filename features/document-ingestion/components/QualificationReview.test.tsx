/**
 * Compliance matrix: hidden with its notice when the package is not at
 * tender, counts and labels each status, and lets a role that may apply
 * judge a requirement the backend does not compare, or clear the judgement.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import {
  access,
  ingest,
  installMocks,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

installMocks();

const { ComplianceMatrixView } = await import('./QualificationReview');

const matrix = {
  packageId: 'pkg-1',
  stage: 'TENDER',
  shown: true,
  rows: [
    {
      requirementId: 'r1',
      candidateId: 'c-r1',
      documentId: 'doc-elig',
      requirement: 'turnover',
      label: 'Turnover',
      tenderValue: 'Average annual turnover of 12 crore over 3 years',
      companyValue: '15 crore average',
      status: 'MATCH',
      basis: 'COMPARED',
      evidence: [{ id: 'ev-1', fileName: 'audited-accounts.pdf' }],
    },
    {
      requirementId: 'r2',
      candidateId: 'c-r2',
      documentId: 'doc-elig',
      requirement: 'equipment',
      label: 'Equipment',
      tenderValue: 'Two concrete batching plants of 30 cum per hour',
      status: 'UNKNOWN',
      basis: 'AWAITING_PERSON',
      evidence: [],
    },
    {
      requirementId: 'r3',
      candidateId: 'c-r3',
      documentId: 'doc-elig',
      requirement: 'similar_projects',
      label: 'Similar projects',
      tenderValue: 'One similar work of 10 crore',
      status: 'UNKNOWN',
      basis: 'PROFILE_BLANK',
      reason: 'No similar project is listed.',
      evidence: [],
    },
    {
      requirementId: 'r4',
      candidateId: 'c-r4',
      documentId: 'doc-elig',
      requirement: 'experience',
      label: 'Experience',
      tenderValue: '7 years in building works',
      companyValue: '5 years',
      status: 'GAP',
      basis: 'COMPARED',
      evidence: [],
    },
  ],
};

beforeEach(() => {
  resetMocks();
  ingest.getComplianceMatrix.mockImplementation(async () => matrix);
});
afterEach(cleanup);

function open() {
  return renderWithClient(
    createElement(ComplianceMatrixView, { packageId: 'pkg-1' })
  );
}

describe('ComplianceMatrixView', () => {
  test('shows the notice in place of the matrix when it is not shown', async () => {
    ingest.getComplianceMatrix.mockImplementation(async () => ({
      packageId: 'pkg-1',
      stage: 'AWARDED',
      shown: false,
      notice: 'The package is awarded, so the matrix is no longer shown.',
      rows: [],
    }));
    const screen = open();
    expect(
      await screen.findByText(
        'The package is awarded, so the matrix is no longer shown.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByTestId('compliance-matrix')).toBeNull();
  });

  test('counts and labels each status with its reason', async () => {
    const screen = open();
    expect(await screen.findByTestId('matrix-summary')).toHaveTextContent(
      'Meets 1, gaps 1, not known 2.'
    );
    expect(screen.getByTestId('matrix-r1')).toHaveTextContent('Meets it');
    expect(screen.getByTestId('matrix-r1')).toHaveTextContent(
      'audited-accounts.pdf'
    );
    expect(screen.getByTestId('matrix-r3')).toHaveTextContent(
      'The company profile has no value for this'
    );
    expect(screen.getByTestId('matrix-r3')).toHaveTextContent(
      'No similar project is listed.'
    );
    expect(screen.getByTestId('matrix-r3')).toHaveTextContent('Not known');
    expect(screen.getByTestId('matrix-r4')).toHaveTextContent('Gap');
  });

  test('judges a requirement the backend does not compare, and clears it', async () => {
    const screen = open();
    const picker = await screen.findByLabelText('Judgement: Equipment');
    expect(screen.queryByLabelText('Judgement: Turnover')).toBeNull();
    expect(screen.queryByLabelText('Judgement: Experience')).toBeNull();
    fireEvent.change(picker, { target: { value: 'GAP' } });
    await waitFor(() =>
      expect(ingest.setQualificationStatus).toHaveBeenCalledTimes(1)
    );
    expect(ingest.setQualificationStatus.mock.calls[0]).toEqual([
      'r2',
      { status: 'GAP' },
    ]);
    fireEvent.change(picker, { target: { value: '' } });
    await waitFor(() =>
      expect(ingest.setQualificationStatus).toHaveBeenCalledTimes(2)
    );
    expect(ingest.setQualificationStatus.mock.calls[1]).toEqual([
      'r2',
      { status: null },
    ]);
  });

  test('a role that may not apply cannot judge', async () => {
    access.roles = [OrgRole.SITE_ENGINEER];
    const screen = open();
    await screen.findByTestId('matrix-r2');
    expect(screen.queryByLabelText('Judgement: Equipment')).toBeNull();
  });
});
