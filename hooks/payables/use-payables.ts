import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  payablesService,
  type PayableListParams,
} from '@/services/payables-service';
import { payableKeys } from './payable-keys';

/**
 * Payables in the current organization.
 *
 * The previous rows are kept while the next request resolves, so paging and
 * changing the filter swap the table in place instead of dropping it back to a
 * skeleton on every click.
 *
 * @param params - Page and filters, which also form the cache key.
 */
export const usePayables = (params: PayableListParams = {}) =>
  useQuery({
    queryKey: payableKeys.list(params),
    queryFn: () => payablesService.list(params),
    placeholderData: keepPreviousData,
  });
