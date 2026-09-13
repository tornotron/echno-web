/**
 * The BIM tab's list states (web #455): a failed model list is an error, kept
 * apart from the "No BIM model yet" empty state, and a 402 (the module is not
 * in the org's plan) links to the module-denied page rather than a retry.
 *
 * `bimService.listModels` is stubbed so the real `useBimModels` query runs
 * and settles into its error state through TanStack, the way it would in the
 * app. Assertions are on text and data attributes, never on a Radix node.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, waitFor } from '@testing-library/react';
import { ApiError } from '@tornotron/echno-core';
import * as realBimServices from '@tornotron/echno-core/bim/services';

const PROJECT = 7;

let listResult: () => Promise<unknown[]> = async () => [];
const listModels = mock(() => listResult());

mock.module('@tornotron/echno-core/bim/services', () => ({
  ...realBimServices,
  bimService: { ...realBimServices.bimService, listModels },
}));
mock.module('@/hooks/use-authorization', () => ({
  useAuthorization: () => ({ isManagerOrAbove: true, isLoading: false }),
}));
mock.module('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement('a', { href }, children),
}));

const { ProjectBimTab } = await import('./project-bim-tab');

function renderTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(ProjectBimTab, { projectId: PROJECT })
    )
  );
}

afterEach(() => {
  cleanup();
  listResult = async () => [];
});

describe('ProjectBimTab', () => {
  test('an empty list is the empty state', async () => {
    const view = renderTab();
    await waitFor(() => expect(view.getByTestId('project-bim-tab')).toBeTruthy());
    expect(view.getByTestId('project-bim-tab').textContent).toContain('No BIM model yet');
  });

  test('a failed list renders the error with a retry, not "No BIM model yet"', async () => {
    // A 4xx: the core query's own retry policy would hold a 5xx back for
    // several seconds of backoff before it settled.
    listResult = async () => {
      throw new ApiError('Project 7 is archived.', 409);
    };
    const view = renderTab();
    const card = await view.findByTestId('project-bim-tab-error');
    expect(card.textContent).toContain('The BIM models could not be loaded.');
    expect(card.textContent).toContain('Project 7 is archived.');
    expect(card.textContent).toContain('Retry');
    expect(view.queryByText(/No BIM model yet/)).toBeNull();
  });

  test('a 402 links to the module-denied page instead of offering a retry', async () => {
    listResult = async () => {
      throw new ApiError("This feature is not included in your organization's plan.", 402);
    };
    const view = renderTab();
    const card = await view.findByTestId('project-bim-tab-error');
    expect(card.dataset.status).toBe('402');
    const link = card.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/errors/403?reason=module&module=bim');
    expect(card.textContent).not.toContain('Retry');
    expect(view.queryByText(/No BIM model yet/)).toBeNull();
  });
});
