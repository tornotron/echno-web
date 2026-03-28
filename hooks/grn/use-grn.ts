/**
 * hooks/grn/use-grn.ts
 *
 * React Query hooks for fetching Goods Received Notes.
 */

import { useQuery } from '@tanstack/react-query';
import { grnService } from '@/services/grn-service';
import { grnKeys } from './grn-keys';

export const useGRNs = () =>
  useQuery({
    queryKey: grnKeys.lists(),
    queryFn: () => grnService.getAll(),
  });

export const useGRNsPaginated = (pageNo = 0, pageSize = 10) =>
  useQuery({
    queryKey: grnKeys.paginated(pageNo, pageSize),
    queryFn: () => grnService.getAllPaginated(pageNo, pageSize),
  });

export const useGRN = (id: number) =>
  useQuery({
    queryKey: grnKeys.detail(id),
    queryFn: () => grnService.getById(id),
    enabled: !!id,
  });

export const useGRNsByVendor = (vendorId: number) =>
  useQuery({
    queryKey: grnKeys.byVendor(vendorId),
    queryFn: () => grnService.getByVendor(vendorId),
    enabled: !!vendorId,
  });

export const useGRNsByDateRange = (startDate: string, endDate: string) =>
  useQuery({
    queryKey: grnKeys.byDateRange(startDate, endDate),
    queryFn: () => grnService.getByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });

export { grnKeys } from './grn-keys';
