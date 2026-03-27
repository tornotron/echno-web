/**
 * hooks/vendors/use-vendors-mutations.ts
 *
 * React Query mutation hooks for vendors.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsService } from '@/services/vendors-service';
import { vendorKeys } from './vendor-keys';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
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
      toast.success('Vendor Created', {
        description: 'The vendor has been created successfully.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Create Vendor'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to create vendor:', error);
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
      toast.success('Vendor Updated', {
        description: 'The vendor has been updated successfully.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Update Vendor'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to update vendor:', error);
    },
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => vendorsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      toast.success('Vendor Deleted', {
        description: 'The vendor has been deleted.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Delete Vendor'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to delete vendor:', error);
    },
  });
};

// ── Contacts ────────────────────────────────────────────────────────────────

export const useAddVendorContact = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactInput: CreateVendorContactInput) =>
      vendorsService.addContact(vendorId, contactInput),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.contacts(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
      toast.success('Contact Added', {
        description: 'The contact has been added to this vendor.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Add Contact'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to add vendor contact:', error);
    },
  });
};

export const useUpdateVendorContact = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contactId,
      contactInput,
    }: {
      contactId: number;
      contactInput: CreateVendorContactInput;
    }) => vendorsService.updateContact(vendorId, contactId, contactInput),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.contacts(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
      toast.success('Contact Updated', {
        description: 'The contact has been updated.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Update Contact'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to update vendor contact:', error);
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
      toast.success('Contact Removed', {
        description: 'The contact has been removed.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Delete Contact'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to delete vendor contact:', error);
    },
  });
};

// ── Tax Identifiers ──────────────────────────────────────────────────────────

export const useAddVendorTaxIdentifier = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taxIdentifierInput: CreateVendorTaxIdentifierInput) =>
      vendorsService.addTaxIdentifier(vendorId, taxIdentifierInput),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.taxIdentifiers(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
      toast.success('Tax Identifier Added', {
        description: 'The tax identifier has been added.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Add Tax Identifier'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to add vendor tax identifier:', error);
    },
  });
};

export const useUpdateVendorTaxIdentifier = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taxIdId,
      taxIdentifierInput,
    }: {
      taxIdId: number;
      taxIdentifierInput: CreateVendorTaxIdentifierInput;
    }) =>
      vendorsService.updateTaxIdentifier(vendorId, taxIdId, taxIdentifierInput),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.taxIdentifiers(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
      toast.success('Tax Identifier Updated', {
        description: 'The tax identifier has been updated.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Update Tax Identifier'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to update vendor tax identifier:', error);
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
      toast.success('Tax Identifier Removed', {
        description: 'The tax identifier has been removed.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Delete Tax Identifier'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to delete vendor tax identifier:', error);
    },
  });
};

// ── Bank Accounts ────────────────────────────────────────────────────────────

export const useAddVendorBankAccount = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bankAccountInput: CreateVendorBankAccountInput) =>
      vendorsService.addBankAccount(vendorId, bankAccountInput),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.bankAccounts(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
      toast.success('Bank Account Added', {
        description: 'The bank account has been added.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Add Bank Account'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to add vendor bank account:', error);
    },
  });
};

export const useUpdateVendorBankAccount = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      bankAccountInput,
    }: {
      accountId: number;
      bankAccountInput: CreateVendorBankAccountInput;
    }) =>
      vendorsService.updateBankAccount(vendorId, accountId, bankAccountInput),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.bankAccounts(vendorId),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
      toast.success('Bank Account Updated', {
        description: 'The bank account has been updated.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Update Bank Account'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to update vendor bank account:', error);
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
      toast.success('Bank Account Removed', {
        description: 'The bank account has been removed.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Delete Bank Account'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to delete vendor bank account:', error);
    },
  });
};

// ── Payment Terms ────────────────────────────────────────────────────────────

export const useSetVendorPaymentTerms = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentTermsInput: CreateVendorPaymentTermsInput) =>
      vendorsService.setPaymentTerms(vendorId, paymentTermsInput),
    onSuccess: (data) => {
      queryClient.setQueryData(vendorKeys.paymentTerms(vendorId), data);
      toast.success('Payment Terms Saved', {
        description: 'The payment terms have been saved.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Save Payment Terms'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to set vendor payment terms:', error);
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
      toast.success('Payment Terms Removed', {
        description: 'The payment terms have been removed.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Remove Payment Terms'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to delete vendor payment terms:', error);
    },
  });
};
