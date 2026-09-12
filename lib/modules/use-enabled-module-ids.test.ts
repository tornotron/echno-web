import { afterEach, describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';
import * as realHooks from '@tornotron/echno-core/module/hooks';

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

mock.module('@tornotron/echno-core/module/hooks', () => ({
  ...realHooks,
  useEnabledModules: () => queryState,
}));

const { useEnabledModuleIds } = await import('./use-enabled-module-ids');

afterEach(() => {
  queryState = { data: undefined, isError: false, isLoading: true };
});

describe('useEnabledModuleIds — the deliberate no-gating fallback', () => {
  test('reports loading with no module ids while the query is in flight', () => {
    queryState = { data: undefined, isError: false, isLoading: true };
    const { result } = renderHook(() => useEnabledModuleIds());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.moduleIds).toBeUndefined();
  });

  test('falls back to undefined (no gating) when the fetch fails', () => {
    queryState = { data: undefined, isError: true, isLoading: false };
    const { result } = renderHook(() => useEnabledModuleIds());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.moduleIds).toBeUndefined();
  });

  test('falls back to undefined (no gating) when the response is empty', () => {
    queryState = { data: [], isError: false, isLoading: false };
    const { result } = renderHook(() => useEnabledModuleIds());
    expect(result.current.moduleIds).toBeUndefined();
  });

  test('builds a real Set once the backend answers with modules', () => {
    queryState = {
      data: [{ id: 'inspections' }, { id: 'billing' }],
      isError: false,
      isLoading: false,
    };
    const { result } = renderHook(() => useEnabledModuleIds());
    expect(result.current.moduleIds).toEqual(
      new Set(['inspections', 'billing'])
    );
  });
});
