import type { PayableListParams } from '@/services/payables-service';

/**
 * Cache keys for the payables listing.
 *
 * These are the app's own keys. `echno-core` carries no payable module, so
 * unlike the finance documents there is no second key factory in core seeding
 * a detail cache behind this one: everything a payable screen reads is keyed
 * here.
 */
export const payableKeys = {
  all: ['payables'] as const,
  lists: () => [...payableKeys.all, 'list'] as const,
  list: (params: PayableListParams) =>
    [...payableKeys.lists(), params] as const,
  details: () => [...payableKeys.all, 'detail'] as const,
  detail: (id: number) => [...payableKeys.details(), id] as const,
};
