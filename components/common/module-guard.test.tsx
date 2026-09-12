import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render, waitFor } from '@testing-library/react';

type GuardState = {
  moduleIds: Set<string> | undefined;
  isLoading: boolean;
};

let guardState: GuardState = { moduleIds: undefined, isLoading: true };
let replaceCalls: string[] = [];

mock.module('next/navigation', () => ({
  useRouter: () => ({
    replace: (path: string) => replaceCalls.push(path),
  }),
}));

mock.module('@/lib/modules/use-enabled-module-ids', () => ({
  useEnabledModuleIds: () => guardState,
}));

const { ModuleGuard } = await import('./module-guard');

afterEach(() => {
  cleanup();
  guardState = { moduleIds: undefined, isLoading: true };
  replaceCalls = [];
});

describe('ModuleGuard', () => {
  test('renders children while the enabled set is still loading', () => {
    guardState = { moduleIds: undefined, isLoading: true };
    const { getByText } = render(
      <ModuleGuard moduleId="inspections">
        <p>inspections page</p>
      </ModuleGuard>
    );
    expect(getByText('inspections page')).toBeInTheDocument();
    expect(replaceCalls).toEqual([]);
  });

  test('renders children when gating fell back to "no gating"', () => {
    guardState = { moduleIds: undefined, isLoading: false };
    const { getByText } = render(
      <ModuleGuard moduleId="inspections">
        <p>inspections page</p>
      </ModuleGuard>
    );
    expect(getByText('inspections page')).toBeInTheDocument();
    expect(replaceCalls).toEqual([]);
  });

  test('renders children when the module is in the enabled set', () => {
    guardState = { moduleIds: new Set(['inspections']), isLoading: false };
    const { getByText } = render(
      <ModuleGuard moduleId="inspections">
        <p>inspections page</p>
      </ModuleGuard>
    );
    expect(getByText('inspections page')).toBeInTheDocument();
    expect(replaceCalls).toEqual([]);
  });

  test('redirects to the shared 403 surface and renders nothing when the module is disabled', async () => {
    guardState = { moduleIds: new Set(['billing']), isLoading: false };
    const { queryByText } = render(
      <ModuleGuard moduleId="inspections">
        <p>inspections page</p>
      </ModuleGuard>
    );
    expect(queryByText('inspections page')).not.toBeInTheDocument();
    await waitFor(() => expect(replaceCalls).toEqual(['/errors/403']));
  });
});
