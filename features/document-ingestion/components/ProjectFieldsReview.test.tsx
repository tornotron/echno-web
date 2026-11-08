/**
 * Project fields: each value beside its source, a bulk accept that leaves
 * out flagged rows until each flag is ticked and never takes a value whose
 * quote was not found, apply that creates the project, and the tender
 * profile with its sources.
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
  pageSource,
  pdfCandidate,
  pdfNames,
  pkg,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

installMocks();

const { ProjectFieldsReview } = await import('./ProjectFieldsReview');

const name = pdfCandidate();
const client = pdfCandidate({
  id: 'pf-2',
  naturalKey: 'client',
  payload: { value: 'Riverside Development Authority' },
  flags: [{ code: 'OCR_PAGE', message: 'Read from a scanned page.' }],
});
const emd = pdfCandidate({
  id: 'pf-3',
  naturalKey: 'emd',
  payload: { value: 'Rs. 2,50,000' },
  flags: [{ code: 'QUOTE_NOT_FOUND', message: 'The quote is not on page 3.' }],
  sources: [pageSource({ id: 'src-emd', page: 3, quoteVerified: false })],
});

beforeEach(() => {
  resetMocks();
  ingest.listCandidates.mockImplementation(async () =>
    page([name, client, emd])
  );
});
afterEach(cleanup);

function open(overrides = {}) {
  return renderWithClient(
    createElement(ProjectFieldsReview, {
      pkg: { ...pkg, projectId: undefined, ...overrides },
      fileNames: pdfNames,
    })
  );
}

describe('ProjectFieldsReview', () => {
  test('each field says where it goes, and the source opens beside it', async () => {
    const screen = open();
    expect(
      await screen.findByText('Riverside Development Authority')
    ).toBeInTheDocument();
    expect(screen.getByText('Project name')).toBeInTheDocument();
    expect(screen.getAllByText('Tender profile').length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Show source' })[0]);
    expect(screen.getByText('NIT.pdf, page 2')).toBeInTheDocument();
    expect(screen.getByTestId('source-box')).toBeInTheDocument();
  });

  test('bulk accept skips flagged rows until ticked, and never the unquoted one', async () => {
    const screen = open();
    const bulk = await screen.findByRole('button', {
      name: 'Accept 1 value ready to accept',
    });
    expect(
      screen.getByText(
        /whose quote was not found on the page is accepted one at a time/
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Checked: Scanned page'));
    fireEvent.click(
      screen.getByLabelText('Checked: Quote not found on the page')
    );
    expect(
      screen.getByRole('button', { name: 'Accept 2 values ready to accept' })
    ).toBe(bulk);
    fireEvent.click(bulk);
    await waitFor(() => expect(ingest.decide).toHaveBeenCalled());
    expect(ingest.decide.mock.calls[0]).toEqual([
      'pkg-1',
      [
        { candidateId: 'pf-1', action: 'ACCEPT' },
        {
          candidateId: 'pf-2',
          action: 'ACCEPT',
          acknowledgedFlags: ['OCR_PAGE'],
        },
      ],
    ]);
  });

  test('the unquoted value is accepted on its own once its flag is ticked', async () => {
    const screen = open();
    const accept = await screen.findByRole('button', { name: 'Accept EMD' });
    expect(accept).toBeDisabled();
    fireEvent.click(
      screen.getByLabelText('Checked: Quote not found on the page')
    );
    expect(accept).toBeEnabled();
    fireEvent.click(accept);
    await waitFor(() => expect(ingest.decide).toHaveBeenCalled());
    expect(ingest.decide.mock.calls[0]?.[1]).toEqual([
      {
        candidateId: 'pf-3',
        action: 'ACCEPT',
        acknowledgedFlags: ['QUOTE_NOT_FOUND'],
      },
    ]);
  });

  test('a correction is sent as an edit of the value', async () => {
    const screen = open();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit Project name' })
    );
    fireEvent.change(screen.getByLabelText('Value'), {
      target: { value: 'Construction of Block A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save and accept' }));
    await waitFor(() => expect(ingest.decide).toHaveBeenCalled());
    expect(ingest.decide.mock.calls[0]?.[1]).toEqual([
      {
        candidateId: 'pf-1',
        action: 'EDIT',
        edits: { value: 'Construction of Block A' },
      },
    ]);
  });

  test('model output is shown as text', async () => {
    const hostile = '<b onclick="steal()">Bold claim</b>';
    ingest.listCandidates.mockImplementation(async () =>
      page([pdfCandidate({ payload: { value: hostile } })])
    );
    const screen = open();
    expect(await screen.findByText(hostile)).toBeInTheDocument();
    expect(screen.container.querySelector('b')).toBeNull();
  });

  test('apply creates the project when the package has none', async () => {
    const screen = open();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Create the project' })
    );
    await waitFor(() => expect(ingest.applyAll).toHaveBeenCalled());
    expect(ingest.applyAll.mock.calls[0]).toEqual(['pkg-1', 'PROJECT_FIELD']);
  });

  test('with a project, apply updates it and its fields link to their source', async () => {
    ingest.provenance.mockImplementation(async () => [
      {
        id: 'prov-1',
        targetType: 'PROJECT',
        targetId: '7',
        targetField: 'projectName',
        valueExtracted: 'Construction of Block A, Riverside Campus',
        valueAccepted: 'Construction of Block A, Riverside Campus',
        enteredByHand: false,
        source: pageSource(),
      },
    ]);
    ingest.getTenderProfile.mockImplementation(async () => ({
      id: 'tp-1',
      packageId: 'pkg-1',
      client: 'Riverside Development Authority',
      emdText: 'Rs. 2,50,000',
    }));
    const screen = open({ projectId: 7 });
    expect(
      await screen.findByRole('button', { name: 'Update the project' })
    ).toBeInTheDocument();
    const link = await screen.findByRole('button', {
      name: 'Source: NIT.pdf, page 2',
    });
    expect(ingest.provenance.mock.calls).toContainEqual(['PROJECT', '7']);
    fireEvent.click(link);
    expect(screen.getAllByTestId('page-viewer').length).toBeGreaterThan(0);
    expect(await screen.findByTestId('tender-profile')).toHaveTextContent(
      'Rs. 2,50,000'
    );
    expect(ingest.provenance.mock.calls).toContainEqual([
      'TENDER_PROFILE',
      'tp-1',
    ]);
  });

  test('a role that may not review or apply sees the values only', async () => {
    access.roles = [OrgRole.SITE_ENGINEER];
    const screen = open();
    expect(
      await screen.findByText('Riverside Development Authority')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Accept/ })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Create the project' })
    ).toBeNull();
    expect(
      screen.getByText(/Your role can see these values/)
    ).toBeInTheDocument();
  });
});
