'use client';

import { useEffect } from 'react';
import { logger } from '@tornotron/echno-core';
import { useEnabledModules } from '@tornotron/echno-core/module/hooks';
import type { ModuleId } from '@tornotron/echno-core/module/types';

export interface EnabledModuleIdsResult {
  /**
   * Enabled-and-entitled module ids, or `undefined` when not gating: the
   * query hasn't settled yet, or the fetch failed. `tornotron/echno-backend#747`
   * now serves `GET /api/v1/modules/web/enabled` for real, so a successful
   * response is trusted as-is, including an empty array — an org with no
   * subscription really does have nothing enabled, and that must gate every
   * module-tagged route and nav entry. Only a failed fetch falls back to "no
   * gating" — every module stays visible/reachable, exactly as before the
   * loader existed — and warns so the fallback is visible in development
   * rather than silently masking a real backend outage later.
   */
  moduleIds: Set<ModuleId> | undefined;
  /** True while the underlying query has not yet settled. */
  isLoading: boolean;
}

/** The slice of `useEnabledModules()`'s return value the fallback reduction needs. */
export interface EnabledModulesQueryState {
  data: { id: ModuleId }[] | undefined;
  isError: boolean;
  isLoading: boolean;
}

/**
 * Pure reduction of the enabled-modules query state to the loader's
 * fallback shape. Kept as a standalone function (rather than inlined in the
 * hook) so the fallback logic — the part that matters for #428 — has a
 * plain, deterministic unit test with no React rendering involved.
 */
export function computeEnabledModuleIds(
  state: EnabledModulesQueryState
): EnabledModuleIdsResult {
  const { data, isError, isLoading } = state;
  // A background refetch can fail while TanStack Query still holds the
  // previous successful `data` (it does not clear cached data on error).
  // Trusting that stale data here would keep gating on a set that might no
  // longer be accurate, so any current error state falls back to "no
  // gating" regardless of what data happens to still be cached.
  //
  // An empty array is a real, successful answer (an org with no enabled
  // modules) and must produce an empty `Set` that gates everything, not
  // `undefined` — only a missing/failed fetch falls open.
  const moduleIds =
    isError || !data ? undefined : new Set(data.map((m) => m.id));
  return { moduleIds, isLoading };
}

/**
 * Reads the enabled-module set from the TanStack Query cache (populated by
 * `useModulesPrefetch` at auth bootstrap, or fetched here directly if that
 * hasn't run yet) and reduces it to a `Set<ModuleId>` for nav filtering and
 * `ModuleGuard`.
 */
export function useEnabledModuleIds(): EnabledModuleIdsResult {
  const queryState = useEnabledModules();
  const { isError, isLoading } = queryState;

  useEffect(() => {
    if (isLoading) return;
    if (isError) {
      logger.warn(
        'Modules: failed to fetch the enabled-module set; falling back to no module gating (every module stays visible).'
      );
    }
  }, [isError, isLoading]);

  return computeEnabledModuleIds(queryState);
}
