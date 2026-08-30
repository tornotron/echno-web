import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  customerInvoicesService,
  type CustomerInvoiceListParams,
} from '@/services/customer-invoices-service';
import { customerInvoiceKeys } from './customer-invoice-keys';

/**
 * One page of accounts-receivable invoices.
 *
 * The previous page is kept while the next one loads, so paging and changing a
 * filter swap the rows in place instead of dropping the table back to a
 * skeleton on every click.
 *
 * @param params - Page and filters, which also form the cache key.
 */
export const useCustomerInvoices = (params: CustomerInvoiceListParams = {}) =>
  useQuery({
    queryKey: customerInvoiceKeys.list(params),
    queryFn: () => customerInvoicesService.list(params),
    placeholderData: keepPreviousData,
  });
