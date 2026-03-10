/**
 * hooks/vendors/use-vendors.ts
 *
 * React Query hooks for fetching vendors.
 */

import { useQuery } from '@tanstack/react-query';
import { vendorsService } from '@/services/vendors-service';
import { vendorKeys } from './vendor-keys';

export const useVendors = () =>
  useQuery({
    queryKey: vendorKeys.lists(),
    queryFn: () => vendorsService.getAll(),
  });

export const useVendorsPaginated = (pageNo = 0, pageSize = 10) =>
  useQuery({
    queryKey: vendorKeys.paginated(pageNo, pageSize),
    queryFn: () => vendorsService.getAllPaginated(pageNo, pageSize),
  });

export const useVendor = (id: number) =>
  useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: () => vendorsService.getById(id),
    enabled: !!id,
  });

export const useVendorSearch = (name: string) =>
  useQuery({
    queryKey: vendorKeys.search(name),
    queryFn: () => vendorsService.search(name),
    enabled: name.length > 0,
  });

export const useVendorSummary = (vendorId: number) =>
  useQuery({
    queryKey: vendorKeys.summary(vendorId),
    queryFn: () => vendorsService.getSummary(vendorId),
    enabled: !!vendorId,
  });

export const useVendorContacts = (vendorId: number) =>
  useQuery({
    queryKey: vendorKeys.contacts(vendorId),
    queryFn: () => vendorsService.getContacts(vendorId),
    enabled: !!vendorId,
  });

export const useVendorTaxIdentifiers = (vendorId: number) =>
  useQuery({
    queryKey: vendorKeys.taxIdentifiers(vendorId),
    queryFn: () => vendorsService.getTaxIdentifiers(vendorId),
    enabled: !!vendorId,
  });

export const useVendorBankAccounts = (vendorId: number) =>
  useQuery({
    queryKey: vendorKeys.bankAccounts(vendorId),
    queryFn: () => vendorsService.getBankAccounts(vendorId),
    enabled: !!vendorId,
  });

export const useVendorPaymentTerms = (vendorId: number) =>
  useQuery({
    queryKey: vendorKeys.paymentTerms(vendorId),
    queryFn: () => vendorsService.getPaymentTerms(vendorId),
    enabled: !!vendorId,
  });

export { vendorKeys as vendorsKeys } from './vendor-keys';
