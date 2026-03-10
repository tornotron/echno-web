/**
 * hooks/vendors/use-vendors-mutations.ts
 *
 * React Query mutation hooks for vendors.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsService } from '@/services/vendors-service';
import { vendorKeys } from './vendor-keys';
import {
  CreateVendorInput,
  CreateVendorContactInput,
  CreateVendorTaxIdentifierInput,
  CreateVendorBankAccountInput,
  CreateVendorPaymentTermsInput,
} from '@/types/vendor';

// ── Core CRUD ───────────────────────────────────────────────────────────────

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendor: CreateVendorInput) => vendorsService.create(vendor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vendor }: { id: number; vendor: CreateVendorInput }) =>
      vendorsService.update(id, vendor),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => vendorsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
};

// ── Contacts ────────────────────────────────────────────────────────────────

export const useAddVendorContact = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendor: CreateVendorContactInput) =>
      vendorsService.addContact(vendorId, vendor),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.contacts(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
    },
  });
};

export const useUpdateVendorContact = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contactId,
      vendor,
    }: {
      contactId: number;
      vendor: CreateVendorContactInput;
    }) => vendorsService.updateContact(vendorId, contactId, vendor),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.contacts(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
    },
  });
};

export const useDeleteVendorContact = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: number) =>
      vendorsService.deleteContact(vendorId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.contacts(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
    },
  });
};

// ── Tax Identifiers ──────────────────────────────────────────────────────────

export const useAddVendorTaxIdentifier = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendor: CreateVendorTaxIdentifierInput) =>
      vendorsService.addTaxIdentifier(vendorId, vendor),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.taxIdentifiers(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
    },
  });
};

export const useUpdateVendorTaxIdentifier = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taxIdId,
      vendor,
    }: {
      taxIdId: number;
      vendor: CreateVendorTaxIdentifierInput;
    }) => vendorsService.updateTaxIdentifier(vendorId, taxIdId, vendor),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.taxIdentifiers(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
    },
  });
};

export const useDeleteVendorTaxIdentifier = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taxIdId: number) =>
      vendorsService.deleteTaxIdentifier(vendorId, taxIdId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.taxIdentifiers(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
    },
  });
};

// ── Bank Accounts ────────────────────────────────────────────────────────────

export const useAddVendorBankAccount = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendor: CreateVendorBankAccountInput) =>
      vendorsService.addBankAccount(vendorId, vendor),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.bankAccounts(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
    },
  });
};

export const useUpdateVendorBankAccount = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      vendor,
    }: {
      accountId: number;
      vendor: CreateVendorBankAccountInput;
    }) => vendorsService.updateBankAccount(vendorId, accountId, vendor),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.bankAccounts(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
    },
  });
};

export const useDeleteVendorBankAccount = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number) =>
      vendorsService.deleteBankAccount(vendorId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.bankAccounts(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
    },
  });
};

// ── Payment Terms ────────────────────────────────────────────────────────────

export const useSetVendorPaymentTerms = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendor: CreateVendorPaymentTermsInput) =>
      vendorsService.setPaymentTerms(vendorId, vendor),
    onSuccess: (data) => {
      queryClient.setQueryData(vendorKeys.paymentTerms(vendorId), data);
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
    },
  });
};

export const useDeleteVendorPaymentTerms = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => vendorsService.deletePaymentTerms(vendorId),
    onSuccess: () => {
      queryClient.setQueryData(vendorKeys.paymentTerms(vendorId), null);
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
    },
  });
};
