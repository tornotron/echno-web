// types/finance/payment.ts

export enum PaymentType {
  invoice = 'invoice', // Payment against invoice
  advance = 'advance', // Advance payment
  refund = 'refund', // Refund payment
  expense = 'expense', // Direct expense payment
  salary = 'salary', // Salary payment
  other = 'other', // Other payments
}

export enum PaymentMethod {
  cash = 'cash',
  cheque = 'cheque',
  bankTransfer = 'bank_transfer',
  upi = 'upi',
  card = 'card',
  neft = 'neft',
  rtgs = 'rtgs',
  imps = 'imps',
  other = 'other',
}

export enum PaymentStatus {
  pending = 'pending',
  processing = 'processing',
  completed = 'completed',
  failed = 'failed',
  cancelled = 'cancelled',
  refunded = 'refunded',
}

export interface Payment {
  id: number;
  paymentNumber: string; // e.g., "PAY-2024-001"
  type: PaymentType;
  status: PaymentStatus;
  method: PaymentMethod;

  // Relationships
  projectId: number; // Foreign key to Project (required for tracking)
  invoiceId?: number; // Foreign key to Invoice
  purchaseOrderId?: number; // Foreign key to PurchaseOrder (direct PO payment)
  vendorId?: number; // Foreign key to Vendor (payment to vendor)
  employeeId?: number; // Foreign key to Employee (payment to employee)
  subContractId?: number; // Foreign key to SubContract (payment to contractor)
  labourId?: number; // Foreign key to Labour (wage payment)
  organizationId?: number; // Foreign key to Organization

  // Payment Details
  amount: number;
  currency: string; // e.g., "INR", "USD"
  paymentDate: Date;

  // Transaction Details
  transactionId?: string; // Bank transaction ID
  referenceNumber?: string; // Cheque number, UPI ref, etc.
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;

  // Verification
  verifiedBy?: number; // Employee ID
  verifiedAt?: Date;

  // Additional Information
  description?: string;
  notes?: string;
  attachments?: string[]; // Receipt, proof of payment

  // Audit
  createdBy: number; // Employee ID
  createdAt: Date;
  updatedAt: Date;
}

export const paymentTypeLabels: Record<PaymentType, string> = {
  invoice: 'Invoice Payment',
  advance: 'Advance Payment',
  refund: 'Refund',
  expense: 'Expense Payment',
  salary: 'Salary Payment',
  other: 'Other Payment',
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  cheque: 'Cheque',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  card: 'Card',
  neft: 'NEFT',
  rtgs: 'RTGS',
  imps: 'IMPS',
  other: 'Other',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};
