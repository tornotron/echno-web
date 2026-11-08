/**
 * The project's Documents tab lists only this project's packages, starts a
 * package for the project from "Import from documents", and lists the
 * project's fields read from documents.
 */
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import * as actualNavigation from 'next/navigation';
import { ApiError } from '@tornotron/echno-core';
import {
  ingest,
  installMocks,
  page,
  pkg,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

const navigation = { ...actualNavigation };
const push = mock((_href: string) => {});
mock.module('next/navigation', () => ({
  ...navigation,
  useRouter: () => ({ push }),
}));
afterAll(() => {
  mock.module('next/navigation', () => navigation);
});
installMocks();

const { ProjectDocumentsTab } = await import('./ProjectDocumentsTab');

beforeEach(() => {
  resetMocks();
  push.mockReset();
  ingest.listPackages.mockImplementation(async () =>
    page([
      pkg,
      { ...pkg, id: 'pkg-2', name: 'Another site tender', projectId: 9 },
    ])
  );
  ingest.createPackage.mockImplementation(async () => ({
    ...pkg,
    id: 'pkg-new',
  }));
});
afterEach(cleanup);

describe('ProjectDocumentsTab', () => {
  test('lists the project packages only, and imports into a new one', async () => {
    const screen = renderWithClient(
      createElement(ProjectDocumentsTab, {
        projectId: 7,
        projectName: 'Riverside Block A',
      })
    );
    expect(
      await screen.findByText('Tower C civil works tender')
    ).toBeInTheDocument();
    expect(screen.queryByText('Another site tender')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Import from documents' })
    );
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(ingest.createPackage.mock.calls[0]).toEqual([
      { name: 'Riverside Block A documents', projectId: 7 },
    ]);
    expect(push.mock.calls[0]?.[0]).toContain('/document-ingestion/pkg-new');
    expect(ingest.provenance.mock.calls).toContainEqual(['PROJECT', '7']);
  });

  test('renders nothing while the module is closed to the organization', async () => {
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
    const screen = renderWithClient(
      createElement(ProjectDocumentsTab, { projectId: 7 })
    );
    await waitFor(() => expect(ingest.status).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Loading')).toBeNull());
    expect(screen.container.innerHTML).toBe('');
    expect(ingest.listPackages).not.toHaveBeenCalled();
  });
});
