import type { CustomerInvoiceListParams } from '@/services/customer-invoices-service';

/**
 * Cache keys for the accounts-receivable invoice listing.
 *
 * These are the app's own keys, held apart from the construction-invoice keys
 * in `@/hooks/invoices`, which key a different document on a different
 * endpoint. `echno-core` keys the AR invoice *detail* under its own
 * `financeKeys`, and the issue and cancel mutations seed it there; a caller
 * that changes an invoice therefore has to invalidate the list below as well,
 * because core knows nothing about it.
 */
export const customerInvoiceKeys = {
  all: ['customer-invoices'] as const,
  lists: () => [...customerInvoiceKeys.all, 'list'] as const,
  list: (params: CustomerInvoiceListParams) =>
    [...customerInvoiceKeys.lists(), params] as const,
};
