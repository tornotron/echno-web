// types/finance/invoice.ts

export enum InvoiceType {
  purchase = 'purchase', // Invoice from vendor for purchases
  sales = 'sales', // Invoice to client for work done
  expense = 'expense', // General expense invoice
  service = 'service', // Service-related invoice
}

export enum InvoiceStatus {
  draft = 'draft',
  pending = 'pending',
  sent = 'sent',
  partiallyPaid = 'partially_paid',
  paid = 'paid',
  overdue = 'overdue',
  cancelled = 'cancelled',
  disputed = 'disputed',
}

export enum PaymentStatus {
  unpaid = 'unpaid',
  partiallyPaid = 'partially_paid',
  paid = 'paid',
  refunded = 'refunded',
  cancelled = 'cancelled',
}

export interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number; // Percentage (e.g., 18 for 18%)
  taxAmount: number;
  discountRate?: number; // Percentage
  discountAmount?: number;
  subtotal: number; // quantity * unitPrice
  total: number; // subtotal + tax - discount
  // Optional references
  inventoryItemId?: number; // If related to inventory
  assetId?: number; // If related to asset
  taskId?: number; // If related to specific task
}

export interface Invoice {
  id: number;
  invoiceNumber: string; // e.g., "INV-2024-001"
  type: InvoiceType;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;

  // Relationships
  projectId: number; // Foreign key to Project (required for tracking)
  vendorId?: number; // Foreign key to Vendor (for purchase invoices)
  organizationId?: number; // Foreign key to Organization
  purchaseOrderId?: number; // Foreign key to PurchaseOrder (if applicable)
  goodsReceiptId?: number; // Foreign key to GoodsReceipt (if applicable)

  // Invoice Details
  issueDate: Date;
  dueDate: Date;
  paymentDate?: Date;

  // Line Items
  lineItems: InvoiceLineItem[];

  // Calculations
  subtotal: number; // Sum of all line item subtotals
  taxAmount: number; // Sum of all line item taxes
  discountAmount: number; // Sum of all line item discounts
  totalAmount: number; // subtotal + tax - discount
  paidAmount: number; // Amount paid so far
  balanceAmount: number; // totalAmount - paidAmount

  // Payment Details
  paymentTerms?: string; // e.g., "Net 30"
  paymentMethod?: string; // e.g., "Bank Transfer", "Cheque"

  // Tax Information
  gstNumber?: string;
  taxType?: string; // e.g., "GST", "IGST", "VAT"

  // Additional Information
  notes?: string;
  termsAndConditions?: string;
  attachments?: string[]; // URLs or file paths

  // Approval
  approvedBy?: number; // Employee ID
  approvedAt?: Date;

  // Audit
  createdBy: number; // Employee ID
  createdAt: Date;
  updatedAt: Date;
}

export const invoiceTypeLabels: Record<InvoiceType, string> = {
  purchase: 'Purchase Invoice',
  sales: 'Sales Invoice',
  expense: 'Expense Invoice',
  service: 'Service Invoice',
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  sent: 'Sent',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};
