/**
 * Class confirmation: the proposed class with how it was found, a person's
 * class and page ranges sent as one confirmation, a range problem caught
 * before anything is sent, and one "confirm all".
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import {
  classification,
  ingest,
  installMocks,
  page,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

installMocks();

const { ClassConfirmation } = await import('./ClassConfirmation');

const nit = classification({
  segments: [
    {
      id: 'seg-1',
      docClass: 'NIT',
      pageFrom: 1,
      pageTo: 4,
      status: 'PROPOSED',
      unreadPages: [],
    },
    {
      id: 'seg-2',
      docClass: 'GCC',
      pageFrom: 5,
      pageTo: 12,
      status: 'PROPOSED',
      reason: 'Headed "General Conditions of Contract".',
      unreadPages: [],
    },
  ],
});
const pending = classification({
  documentId: 'doc-2',
  fileName: 'Scope.pdf',
  docClass: undefined,
  classMethod: undefined,
  classReason: undefined,
  classification: {
    id: 'job-c',
    documentId: 'doc-2',
    extractorKey: 'classify',
    extractorVersion: '1',
    status: 'WAITING_LLM',
    attempt: 0,
    maxAttempts: 3,
    chunksTotal: 1,
    chunksDone: 0,
    chunksFailed: 0,
    message: 'AI reading is off for the organization.',
    failedPages: [],
    unreadPages: [],
  },
});

beforeEach(() => {
  resetMocks();
  ingest.listClassifications.mockImplementation(async () =>
    page([nit, pending])
  );
});
afterEach(cleanup);

function open() {
  return renderWithClient(
    createElement(ClassConfirmation, { packageId: 'pkg-1' })
  );
}

describe('ClassConfirmation', () => {
  test('shows the proposal and how it was found, and a file still waiting', async () => {
    const screen = open();
    expect(
      await screen.findByText(/Proposed: Notice inviting tender, by a rule/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Notice Inviting Tender/)).toBeInTheDocument();
    expect(screen.getByText('Waiting for AI reading')).toBeInTheDocument();
    expect(
      screen.getByText('AI reading is off for the organization.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('1 file waits for its class to be confirmed.')
    ).toBeInTheDocument();
  });

  test('confirms the class with its page ranges', async () => {
    const screen = open();
    await screen.findByTestId('class-doc-nit');
    fireEvent.change(screen.getByLabelText('Range 2 class'), {
      target: { value: 'SCC' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(ingest.classifyDocument).toHaveBeenCalled());
    expect(ingest.classifyDocument.mock.calls[0]).toEqual([
      'doc-nit',
      {
        docClass: 'NIT',
        segments: [
          { docClass: 'NIT', pageFrom: 1, pageTo: 4 },
          { docClass: 'SCC', pageFrom: 5, pageTo: 12 },
        ],
      },
    ]);
  });

  test('a range problem is named and nothing is sent', async () => {
    const screen = open();
    await screen.findByTestId('class-doc-nit');
    fireEvent.change(
      screen.getByLabelText('To page', { selector: '#range-doc-nit-1-to' }),
      {
        target: { value: '14' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(
      await screen.findByText('Range 2: the file has 12 pages.')
    ).toBeInTheDocument();
    expect(ingest.classifyDocument).not.toHaveBeenCalled();
  });

  test('confirm all reports what it confirmed', async () => {
    ingest.confirmAllClassificationsFully.mockImplementation(async () => ({
      documentsConfirmed: 1,
      segmentsConfirmed: 2,
      jobsQueued: 2,
      remaining: 0,
    }));
    const screen = open();
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Confirm all proposed classes',
      })
    );
    expect(
      await screen.findByText(
        /Confirmed 1 files and 2 parts; 2 reading jobs queued\./
      )
    ).toBeInTheDocument();
    expect(ingest.confirmAllClassificationsFully.mock.calls[0]?.[0]).toBe(
      'pkg-1'
    );
  });
});
