import type { ConstructionPaymentListParams } from '@tornotron/echno-core/finance-construction-payment/services';

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  /**
   * One filtered listing. The params are part of the key because the endpoint
   * narrows on the server: a filtered response cached under the bare `lists()`
   * key would be served back to the unfiltered screen as if it were the whole
   * page. Every variant still sits under `lists()`, so the mutations keep
   * invalidating all of them with one prefix.
   */
  list: (params: ConstructionPaymentListParams = {}) =>
    [...paymentKeys.lists(), params] as const,
  detail: (id: string) => [...paymentKeys.all, 'detail', id] as const,
};
