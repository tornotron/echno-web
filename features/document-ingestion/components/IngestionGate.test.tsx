/**
 * With the module closed to the organization the status call answers 403
 * `MODULE_DISABLED`, and the gate then renders nothing at all: no page body,
 * no error, no hint that the module exists.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, waitFor } from '@testing-library/react';
import { ApiError } from '@tornotron/echno-core';
import {
  ingest,
  installMocks,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

installMocks();

const { IngestionGate } = await import('./IngestionGate');

beforeEach(resetMocks);
afterEach(cleanup);

function open() {
  return renderWithClient(
    createElement(IngestionGate, null, createElement('p', null, 'Packages'))
  );
}

describe('IngestionGate', () => {
  test('renders nothing when the module is disabled for the organization', async () => {
    ingest.status.mockImplementation(async () => {
      throw new ApiError(
        'Not available',
        403,
        undefined,
        undefined,
        undefined,
        {
          code: 'MODULE_DISABLED',
        }
      );
    });
    const screen = open();
    await waitFor(() => expect(ingest.status).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Loading')).toBeNull());
    expect(screen.container.innerHTML).toBe('');
  });

  test('renders the screens once the module answers', async () => {
    const screen = open();
    expect(await screen.findByText('Packages')).toBeInTheDocument();
  });

  test('another failure says what went wrong', async () => {
    ingest.status.mockImplementation(async () => {
      throw new ApiError('The server is not answering.', 503);
    });
    const screen = open();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The server is not answering.'
    );
    expect(screen.queryByText('Packages')).toBeNull();
  });
});
