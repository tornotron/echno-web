import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';

// Mocks the core query hook rather than `@/hooks/use-enabled-module-ids`
// directly: bun's `mock.module` replaces a module for the whole test run by
// resolved path, and that file already has its own direct unit test
// (hooks/use-enabled-module-ids.test.ts) exercising `computeEnabledModuleIds`.
// This keeps each module mocked from exactly one test file.
type QueryState = {
  data: { id: string }[] | undefined;
  isError: boolean;
  isLoading: boolean;
};

let queryState: QueryState = {
  data: undefined,
  isError: false,
  isLoading: true,
};
let replaceCalls: string[] = [];
let refetchCalls = 0;

mock.module('next/navigation', () => ({
  useRouter: () => ({
    replace: (path: string) => replaceCalls.push(path),
  }),
}));

mock.module('@tornotron/echno-core/module/hooks', () => ({
  useEnabledModules: () => ({
    ...queryState,
    error: queryState.isError ? new Error('modules fetch failed') : null,
    refetch: async () => {
      refetchCalls += 1;
    },
  }),
}));

const { ModuleGuard } = await import('./module-guard');

afterEach(() => {
  cleanup();
  queryState = { data: undefined, isError: false, isLoading: true };
  replaceCalls = [];
  refetchCalls = 0;
});

describe('ModuleGuard', () => {
  test('renders children while the enabled set is still loading', () => {
    queryState = { data: undefined, isError: false, isLoading: true };
    const { getByText } = render(
      <ModuleGuard moduleId="inspections">
        <p>inspections page</p>
      </ModuleGuard>
    );
    expect(getByText('inspections page')).toBeInTheDocument();
    expect(replaceCalls).toEqual([]);
  });

  test('redirects to the 403 surface when the fetch succeeds with an empty set', async () => {
    queryState = { data: [], isError: false, isLoading: false };
    const { queryByText } = render(
      <ModuleGuard moduleId="inspections">
        <p>inspections page</p>
      </ModuleGuard>
    );
    expect(queryByText('inspections page')).not.toBeInTheDocument();
    await waitFor(() => expect(replaceCalls).toEqual(['/errors/403?reason=module&module=inspections']));
  });

  test('a failed fetch holds the page back behind a retry panel instead of falling open', () => {
    queryState = { data: undefined, isError: true, isLoading: false };
    const { queryByText, getByTestId } = render(
      <ModuleGuard moduleId="inspections">
        <p>inspections page</p>
      </ModuleGuard>
    );
    expect(queryByText('inspections page')).not.toBeInTheDocument();
    expect(getByTestId('module-guard-error').textContent).toContain('Could not confirm your plan');
    // Unknown is not denied: no redirect to the 403 surface.
    expect(replaceCalls).toEqual([]);
  });

  test('the retry button re-runs the enabled-modules fetch', () => {
    queryState = { data: undefined, isError: true, isLoading: false };
    const { getByRole } = render(
      <ModuleGuard moduleId="inspections">
        <p>inspections page</p>
      </ModuleGuard>
    );
    fireEvent.click(getByRole('button', { name: /retry/i }));
    expect(refetchCalls).toBe(1);
  });

  test('renders children when the module is in the enabled set', () => {
    queryState = {
      data: [{ id: 'inspections' }],
      isError: false,
      isLoading: false,
    };
    const { getByText } = render(
      <ModuleGuard moduleId="inspections">
        <p>inspections page</p>
      </ModuleGuard>
    );
    expect(getByText('inspections page')).toBeInTheDocument();
    expect(replaceCalls).toEqual([]);
  });

  test('redirects to the shared 403 surface and renders nothing when the module is disabled', async () => {
    queryState = {
      data: [{ id: 'billing' }],
      isError: false,
      isLoading: false,
    };
    const { queryByText } = render(
      <ModuleGuard moduleId="inspections">
        <p>inspections page</p>
      </ModuleGuard>
    );
    expect(queryByText('inspections page')).not.toBeInTheDocument();
    await waitFor(() => expect(replaceCalls).toEqual(['/errors/403?reason=module&module=inspections']));
  });
});
