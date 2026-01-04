// types/finance/receipt.ts

export enum ReceiptType {
  payment = 'payment', // Payment receipt
  advance = 'advance', // Advance receipt
  deposit = 'deposit', // Security deposit
  refund = 'refund', // Refund receipt
  other = 'other', // Other receipts
}

export enum ReceiptStatus {
  draft = 'draft',
  issued = 'issued',
  cancelled = 'cancelled',
}

export interface Receipt {
  id: number;
  receiptNumber: string; // e.g., "RCP-2024-001"
  type: ReceiptType;
  status: ReceiptStatus;

  // Relationships
  projectId: number; // Foreign key to Project (required for tracking)
  paymentId?: number; // Foreign key to Payment
  invoiceId?: number; // Foreign key to Invoice
  organizationId?: number; // Foreign key to Organization
  customerId?: number; // Foreign key to customer/client

  // Receipt Details
  amount: number;
  currency: string; // e.g., "INR", "USD"
  receiptDate: Date;
  paymentMethod: string; // e.g., "Cash", "Cheque", "Bank Transfer"

  // Transaction Details
  transactionId?: string;
  referenceNumber?: string;

  // Received From
  receivedFrom: string; // Name of person/company
  receivedFromAddress?: string;

  // Tax Information
  taxAmount?: number;
  taxRate?: number;
  taxType?: string; // e.g., "GST", "VAT"

  // Additional Information
  description?: string;
  notes?: string;
  attachments?: string[]; // Scanned receipts, documents

  // Issued By
  issuedBy: number; // Employee ID
  issuedAt: Date;

  // Audit
  createdBy: number; // Employee ID
  createdAt: Date;
  updatedAt: Date;
}

export const receiptTypeLabels: Record<ReceiptType, string> = {
  payment: 'Payment Receipt',
  advance: 'Advance Receipt',
  deposit: 'Deposit Receipt',
  refund: 'Refund Receipt',
  other: 'Other Receipt',
};

export const receiptStatusLabels: Record<ReceiptStatus, string> = {
  draft: 'Draft',
  issued: 'Issued',
  cancelled: 'Cancelled',
};
