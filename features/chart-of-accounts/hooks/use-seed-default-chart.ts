'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@tornotron/echno-core';
import { financeKeys } from '@tornotron/echno-core/finance/hooks';

/**
 * Result of seeding the default chart of accounts: the number of accounts
 * created (0 when the tenant already had a chart, since the backend seed is
 * idempotent).
 */
export interface SeedDefaultsResult {
  created: number;
}

/**
 * Seeds the default chart of accounts for the current tenant.
 *
 * `POST /finance/accounts/web/seed-defaults`, restricted to system
 * administrators, idempotent (a tenant that already has a chart is left
 * untouched). Not part of the shared finance hooks in echno-core, so it is
 * wired here against the shared api client and invalidates the account caches
 * on success so the tree refetches.
 */
export function useSeedDefaultChart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<SeedDefaultsResult>('/finance/accounts/web/seed-defaults'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
  });
}
