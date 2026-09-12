import { describe, expect, test } from 'bun:test';
import { computeEnabledModuleIds } from './use-enabled-module-ids';

describe('computeEnabledModuleIds — the deliberate no-gating fallback', () => {
  test('reports loading with no module ids while the query is in flight', () => {
    const result = computeEnabledModuleIds({
      data: undefined,
      isError: false,
      isLoading: true,
    });
    expect(result.isLoading).toBe(true);
    expect(result.moduleIds).toBeUndefined();
  });

  test('falls back to undefined (no gating) when the fetch fails', () => {
    const result = computeEnabledModuleIds({
      data: undefined,
      isError: true,
      isLoading: false,
    });
    expect(result.isLoading).toBe(false);
    expect(result.moduleIds).toBeUndefined();
  });

  test('falls back to undefined (no gating) when the response is empty', () => {
    const result = computeEnabledModuleIds({
      data: [],
      isError: false,
      isLoading: false,
    });
    expect(result.moduleIds).toBeUndefined();
  });

  test('builds a real Set once the backend answers with modules', () => {
    const result = computeEnabledModuleIds({
      data: [{ id: 'inspections' }, { id: 'billing' }],
      isError: false,
      isLoading: false,
    });
    expect(result.moduleIds).toEqual(new Set(['inspections', 'billing']));
  });

  test('falls back to undefined even when a failed refetch left stale data cached', () => {
    // TanStack Query does not clear `data` when a background refetch fails,
    // so a query can report isError: true while still holding the previous
    // successful result. Trusting that stale set would gate on modules that
    // might no longer be accurate.
    const result = computeEnabledModuleIds({
      data: [{ id: 'inspections' }],
      isError: true,
      isLoading: false,
    });
    expect(result.moduleIds).toBeUndefined();
  });
});
