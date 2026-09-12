'use client';

import { useEffect, useMemo } from 'react';
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

/**
 * Reads the enabled-module set from the TanStack Query cache (populated by
 * `useModulesPrefetch` at auth bootstrap, or fetched here directly if that
 * hasn't run yet) and reduces it to a `Set<ModuleId>` for nav filtering and
 * `ModuleGuard`.
 */
export function useEnabledModuleIds(): EnabledModuleIdsResult {
  const { data, isError, isLoading } = useEnabledModules();

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

  const moduleIds = useMemo(() => {
    if (!data || data.length === 0) return;
    return new Set(data.map((m) => m.id));
  }, [data]);

  return { moduleIds, isLoading };
}
