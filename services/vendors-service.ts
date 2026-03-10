/**
 * services/vendors-service.ts
 *
 * Typed client for vendor backend endpoints.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  Vendor,
  VendorContact,
  VendorTaxIdentifier,
  VendorBankAccount,
  VendorPaymentTermsDetails,
  VendorSummary,
  CreateVendorInput,
  CreateVendorContactInput,
  CreateVendorTaxIdentifierInput,
  CreateVendorBankAccountInput,
  CreateVendorPaymentTermsInput,
  parseVendor,
} from '@/types/vendor';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeParseVendor(data: Raw): Vendor {
  try {
    return parseVendor(data);
  } catch (error) {
    logger.error('Failed to parse vendor:', error);
    throw new ApiError('Failed to process vendor data.', 422);
  }
}

function extractArray(data: Raw): Raw[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  logger.warn('Vendors API returned unexpected format:', {
    type: typeof data,
    keys: data ? Object.keys(data) : null,
  });
  return [];
}

function safeParseVendors(data: Raw): Vendor[] {
  const items = extractArray(data);
  if (items.length === 0) return [];
  try {
    return items.map((item) => parseVendor(item));
  } catch (error) {
    logger.error('Failed to parse vendors:', error);
    throw new ApiError('Failed to process vendors data.', 422);
  }
}

function parseVendorContact(c: Raw): VendorContact {
  return {
    id: c.id,
    contactPerson: c.contactPerson ?? undefined,
    email: c.email ?? undefined,
    phone: c.phone ?? undefined,
    alternatePhone: c.alternatePhone ?? undefined,
    primary: c.primary ?? false,
  };
}

function parseVendorBankAccount(b: Raw): VendorBankAccount {
  return {
    id: b.id,
    bankName: b.bankName ?? undefined,
    accountNumber: b.accountNumber ?? undefined,
    ifscCode: b.ifscCode ?? undefined,
    accountHolderName: b.accountHolderName ?? undefined,
    swift: b.swift ?? undefined,
    default: b.default ?? false,
  };
}

// Maps frontend DTO (name/address/email) to backend field names (vendorName/vendorAddress/vendorEmail)
function toApiPayload(vendor: CreateVendorInput): Raw {
  return {
    vendorName: vendor.name,
    vendorAddress: vendor.address,
    vendorEmail: vendor.email,
    website: vendor.website,
    city: vendor.city,
    state: vendor.state,
    pinCode: vendor.pincode,
    country: vendor.country,
    type: vendor.type,
    status: vendor.status,
    notes: vendor.notes,
  };
}

export const vendorsService = {
  // ── Core CRUD ─────────────────────────────────────────────────────────────

  async create(vendor: CreateVendorInput): Promise<Vendor> {
    const data = await api.post<Raw>('/vendors/web', toApiPayload(vendor));
    return safeParseVendor(data);
  },

  async getAll(): Promise<Vendor[]> {
    const data = await api.get<Raw[]>('/vendors/web');
    return safeParseVendors(data);
  },

  async getAllPaginated(pageNo = 0, pageSize = 10): Promise<Vendor[]> {
    const data = await api.get<Raw>('/vendors/web/all', { pageNo, pageSize });
    return safeParseVendors(data);
  },

  async search(name: string): Promise<Vendor[]> {
    const data = await api.get<Raw[]>('/vendors/web/search', { name });
    return safeParseVendors(data);
  },

  async getById(id: number): Promise<Vendor> {
    const data = await api.get<Raw>(`/vendors/web/${id}`);
    return safeParseVendor(data);
  },

  async update(id: number, vendor: CreateVendorInput): Promise<Vendor> {
    const data = await api.patch<Raw>(
      `/vendors/web/${id}`,
      toApiPayload(vendor)
    );
    return safeParseVendor(data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/vendors/web/${id}`);
  },

  // ── Summary ───────────────────────────────────────────────────────────────

  async getSummary(vendorId: number): Promise<VendorSummary> {
    const data = await api.get<Raw>(`/vendors/web/${vendorId}/summary`);
    return {
      vendorId: data.vendorId ?? vendorId,
      vendorName: data.vendorName ?? '',
      totalOrders: data.totalOrders ?? undefined,
      pendingOrders: data.pendingOrders ?? undefined,
      completedOrders: data.completedOrders ?? undefined,
      cancelledOrders: data.cancelledOrders ?? undefined,
      totalPurchaseValue: data.totalPurchaseValue ?? undefined,
      totalPaid: data.totalPaid ?? undefined,
      totalOutstanding: data.totalOutstanding ?? undefined,
      lastPaymentDate: data.lastPaymentDate
        ? new Date(data.lastPaymentDate)
        : undefined,
      lastPaymentAmount: data.lastPaymentAmount ?? undefined,
    };
  },

  // ── Contacts ──────────────────────────────────────────────────────────────

  async getContacts(vendorId: number): Promise<VendorContact[]> {
    const data = await api.get<Raw>(`/vendors/web/${vendorId}/contacts`);
    const items = extractArray(data);
    return items.map((c: Raw) => parseVendorContact(c));
  },

  async addContact(
    vendorId: number,
    vendor: CreateVendorContactInput
  ): Promise<VendorContact> {
    const data = await api.post<Raw>(
      `/vendors/web/${vendorId}/contacts`,
      vendor
    );
    return parseVendorContact(data);
  },

  async updateContact(
    vendorId: number,
    contactId: number,
    vendor: CreateVendorContactInput
  ): Promise<VendorContact> {
    const data = await api.patch<Raw>(
      `/vendors/web/${vendorId}/contacts/${contactId}`,
      vendor
    );
    return parseVendorContact(data);
  },

  async deleteContact(vendorId: number, contactId: number): Promise<void> {
    await api.delete(`/vendors/web/${vendorId}/contacts/${contactId}`);
  },

  // ── Tax Identifiers ───────────────────────────────────────────────────────

  async getTaxIdentifiers(vendorId: number): Promise<VendorTaxIdentifier[]> {
    const data = await api.get<Raw>(`/vendors/web/${vendorId}/tax-identifiers`);
    const items = extractArray(data);
    return items.map((t: Raw) => ({ id: t.id, type: t.type, value: t.value }));
  },

  async addTaxIdentifier(
    vendorId: number,
    vendor: CreateVendorTaxIdentifierInput
  ): Promise<VendorTaxIdentifier> {
    const data = await api.post<Raw>(
      `/vendors/web/${vendorId}/tax-identifiers`,
      vendor
    );
    return { id: data.id, type: data.type, value: data.value };
  },

  async updateTaxIdentifier(
    vendorId: number,
    taxIdId: number,
    vendor: CreateVendorTaxIdentifierInput
  ): Promise<VendorTaxIdentifier> {
    const data = await api.patch<Raw>(
      `/vendors/web/${vendorId}/tax-identifiers/${taxIdId}`,
      vendor
    );
    return { id: data.id, type: data.type, value: data.value };
  },

  async deleteTaxIdentifier(vendorId: number, taxIdId: number): Promise<void> {
    await api.delete(`/vendors/web/${vendorId}/tax-identifiers/${taxIdId}`);
  },

  // ── Bank Accounts ─────────────────────────────────────────────────────────

  async getBankAccounts(vendorId: number): Promise<VendorBankAccount[]> {
    const data = await api.get<Raw>(`/vendors/web/${vendorId}/bank-accounts`);
    const items = extractArray(data);
    return items.map((b: Raw) => parseVendorBankAccount(b));
  },

  async addBankAccount(
    vendorId: number,
    vendor: CreateVendorBankAccountInput
  ): Promise<VendorBankAccount> {
    const data = await api.post<Raw>(
      `/vendors/web/${vendorId}/bank-accounts`,
      vendor
    );
    return parseVendorBankAccount(data);
  },

  async updateBankAccount(
    vendorId: number,
    accountId: number,
    vendor: CreateVendorBankAccountInput
  ): Promise<VendorBankAccount> {
    const data = await api.patch<Raw>(
      `/vendors/web/${vendorId}/bank-accounts/${accountId}`,
      vendor
    );
    return parseVendorBankAccount(data);
  },

  async deleteBankAccount(vendorId: number, accountId: number): Promise<void> {
    await api.delete(`/vendors/web/${vendorId}/bank-accounts/${accountId}`);
  },

  // ── Payment Terms ─────────────────────────────────────────────────────────

  async getPaymentTerms(
    vendorId: number
  ): Promise<VendorPaymentTermsDetails | null> {
    try {
      const data = await api.get<Raw>(`/vendors/web/${vendorId}/payment-terms`);
      if (!data) return null;
      return {
        id: data.id,
        paymentTerms: data.paymentTerms,
        creditLimit: data.creditLimit ?? undefined,
        creditDays: data.creditDays ?? undefined,
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async setPaymentTerms(
    vendorId: number,
    vendor: CreateVendorPaymentTermsInput
  ): Promise<VendorPaymentTermsDetails> {
    const data = await api.put<Raw>(
      `/vendors/web/${vendorId}/payment-terms`,
      vendor
    );
    return {
      id: data.id,
      paymentTerms: data.paymentTerms,
      creditLimit: data.creditLimit ?? undefined,
      creditDays: data.creditDays ?? undefined,
    };
  },

  async deletePaymentTerms(vendorId: number): Promise<void> {
    await api.delete(`/vendors/web/${vendorId}/payment-terms`);
  },
};
