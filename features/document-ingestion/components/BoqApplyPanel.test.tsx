/**
 * Apply writes the accepted rows to the picked contract. With no contract the
 * backend refuses with a sentence, which the person reads as it was sent; a
 * row the contract refused is listed with its reason.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import { ApiError } from '@tornotron/echno-core';
import {
  billing,
  candidate,
  fileNames,
  ingest,
  installMocks,
  page,
  pkg,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

installMocks();

const { BoqApplyPanel } = await import('./BoqApplyPanel');

const NO_TARGET =
  'Pick a contract to write this BOQ to; until then the accepted rows stay on the package as its tender BOQ.';

const contract = {
  subContractId: 31,
  contractRef: 'SC-031',
  contractName: 'Civil works',
  contractorName: 'Sample Builders',
  projectId: 7,
  billCount: 0,
  approvedBillCount: 0,
  certifiedToDate: 0,
  netApprovedToDate: 0,
  paidToDate: 0,
  amountDue: 0,
};

beforeEach(() => {
  resetMocks();
  billing.listContracts.mockImplementation(async () => page([contract]));
});
afterEach(cleanup);

function open(overrides = {}) {
  return renderWithClient(
    createElement(BoqApplyPanel, { pkg: { ...pkg, ...overrides }, fileNames })
  );
}

describe('BoqApplyPanel', () => {
  test('apply with no contract shows the refusal sentence', async () => {
    ingest.applyAll.mockImplementation(async () => {
      throw new ApiError(NO_TARGET, 400);
    });
    const screen = open();
    expect(
      screen.getByText(
        /No contract is picked\. Accepted rows stay on this package/
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Apply to contract' }));
    expect(await screen.findByText(NO_TARGET)).toBeInTheDocument();
    expect(ingest.applyAll.mock.calls[0]).toEqual(['pkg-1', 'BOQ_ITEM']);
  });

  test('the contract list is the package project, and picking one sets the target', async () => {
    const screen = open();
    await screen.findByRole('option', {
      name: 'SC-031 Civil works, Sample Builders',
    });
    expect(billing.listContracts.mock.calls[0]?.[0]).toEqual({
      projectId: 7,
      pageSize: 200,
    });
    fireEvent.change(screen.getByLabelText('Contract'), {
      target: { value: '31' },
    });
    await waitFor(() => expect(ingest.setBoqTarget).toHaveBeenCalled());
    expect(ingest.setBoqTarget.mock.calls[0]).toEqual([
      'pkg-1',
      { subContractId: 31 },
    ]);
  });

  test('shows applied, failed and remaining, and each refused row with its reason', async () => {
    ingest.applyAll.mockImplementation(async () => ({
      applied: 3,
      failed: 1,
      remaining: 0,
    }));
    ingest.listCandidates.mockImplementation(async () =>
      page([
        candidate({
          id: 'cand-9',
          status: 'APPLY_FAILED',
          applyError: 'Quantity must be above zero.',
        }),
      ])
    );
    const screen = open({ subContractId: 31 });
    expect(
      await screen.findByText('Quantity must be above zero.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/BOQ\.xlsx, Sheet BOQ, Row 47/)
    ).toBeInTheDocument();
    expect(ingest.listCandidates.mock.calls[0]?.[1]).toEqual({
      kind: 'BOQ_ITEM',
      status: 'APPLY_FAILED',
      size: 200,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply to contract' }));
    expect(
      await screen.findByText(/Applied 3, failed 1, still to apply 0\./)
    ).toBeInTheDocument();
  });
});
