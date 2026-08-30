import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { financeInvoiceService } from '@tornotron/echno-core/finance-invoice/services';
import type { InvoiceListParams } from '@tornotron/echno-core/finance-invoice/services';
import { financeKeys } from '@tornotron/echno-core/finance/hooks/keys';
import { standardQueryOptions } from '@/lib/query/options';

/**
 * One page of accounts-receivable invoices.
 *
 * The client and the cache key are core's, from `financeInvoiceService.list`
 * and `financeKeys.invoicesList`. Core ships a `useFinanceInvoices` over both,
 * and this hook exists only to add what it does not carry: the previous page is
 * kept while the next one loads, so paging and changing a filter swap the rows
 * in place instead of dropping the table back to a skeleton on every click.
 * Everything else, the key included, is core's, so a mutation that invalidates
 * `financeKeys.invoices()` reaches this listing as it reaches core's.
 *
 * @param params - Page and filters, which also form the cache key.
 * @returns A TanStack query over the `PagedInvoice` the listing returns.
 */
export const useCustomerInvoices = (params: InvoiceListParams = {}) =>
  useQuery({
    queryKey: financeKeys.invoicesList(params),
    queryFn: () => financeInvoiceService.list(params),
    ...standardQueryOptions,
    placeholderData: keepPreviousData,
  });
