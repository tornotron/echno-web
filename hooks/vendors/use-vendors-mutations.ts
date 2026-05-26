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
  CreateVendorRequest,
  UpdateVendorRequest,
  CreateVendorContactRequest,
  CreateVendorTaxIdentifierRequest,
  CreateVendorBankAccountRequest,
  SetVendorPaymentTermsRequest,
} from '@/types/vendor';

// ── Core CRUD ───────────────────────────────────────────────────────────────

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateVendorRequest) => vendorsService.create(dto),
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
    mutationFn: ({ id, data }: { id: number; data: UpdateVendorRequest }) =>
      vendorsService.update(id, data),
    onSuccess: (vendor) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendor.id) });
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
    mutationFn: (dto: CreateVendorContactRequest) =>
      vendorsService.addContact(vendorId, dto),
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
      contactInput: CreateVendorContactRequest;
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
    mutationFn: (dto: CreateVendorTaxIdentifierRequest) =>
      vendorsService.addTaxIdentifier(vendorId, dto),
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
      taxIdentifierInput: CreateVendorTaxIdentifierRequest;
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
    mutationFn: (dto: CreateVendorBankAccountRequest) =>
      vendorsService.addBankAccount(vendorId, dto),
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
      bankAccountInput: CreateVendorBankAccountRequest;
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
    mutationFn: (dto: SetVendorPaymentTermsRequest) =>
      vendorsService.setPaymentTerms(vendorId, dto),
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
