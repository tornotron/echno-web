'use client';

import { useEffect } from 'react';
import { logger } from '@tornotron/echno-core';
import { useEnabledModules } from '@tornotron/echno-core/module/hooks';
import type { ModuleId } from '@tornotron/echno-core/module/types';

export interface EnabledModuleIdsResult {
  /**
   * Enabled-and-entitled module ids, or `undefined` when not gating: the
   * query hasn't settled yet, the fetch failed, or the backend answered
   * with an empty set. Deliberate: until `tornotron/echno-backend#747`
   * ships, `GET /api/v1/modules/web/enabled` either 404s or returns `[]`
   * against a live backend, and treating either as "hide every module"
   * would go dark before the backend is even there to enforce anything.
   * Fail open instead — every module stays visible/reachable, exactly as
   * before the loader existed — and warn so the fallback is visible in
   * development rather than silently masking a real backend outage later.
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
  const moduleIds =
    isError || !data || data.length === 0
      ? undefined
      : new Set(data.map((m) => m.id));
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
  const { data, isError, isLoading } = queryState;

  useEffect(() => {
    if (isLoading) return;
    if (isError) {
      logger.warn(
        'Modules: failed to fetch the enabled-module set; falling back to no module gating (every module stays visible).'
      );
    } else if (data && data.length === 0) {
      logger.warn(
        'Modules: enabled-module set came back empty; falling back to no module gating (every module stays visible) instead of hiding everything.'
      );
    }
  }, [isError, isLoading, data]);

  return computeEnabledModuleIds(queryState);
}
