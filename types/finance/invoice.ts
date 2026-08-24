// types/finance/invoice.ts
//
// Web-side presentation helpers for construction invoices. The domain types
// and enums are owned by @tornotron/echno-core; this module re-exports them so
// the app has a single import point, and adds the label and colour maps used by
// the invoice list and detail views.

import {
  ConstructionInvoiceType,
  ConstructionInvoiceStatus,
} from '@tornotron/echno-core/finance/types';

export type {
  ConstructionInvoice,
  ConstructionInvoiceLine,
} from '@tornotron/echno-core/finance/types';
export {
  ConstructionInvoiceType,
  ConstructionInvoiceStatus,
  ConstructionInvoicePaymentStatus,
} from '@tornotron/echno-core/finance/types';

// Editable draft shapes for the create / edit forms. These are web-only view
// models; the create/update payloads sent to the backend are the
// Create/UpdateConstructionInvoiceRequest types owned by echno-core.

export interface InvoiceLineDraft {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  /** Optional cost category (budget head) tagged on the line. */
  costCategoryId?: string | null;
}

export interface InvoiceFormData {
  invoiceNumber: string;
  type: ConstructionInvoiceType;
  status: ConstructionInvoiceStatus;
  projectId: number;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentTerms: string;
  paymentMethod: string;
  gstNumber: string;
  taxType: string;
  notes: string;
}

export const invoiceTypeLabels: Record<ConstructionInvoiceType, string> = {
  [ConstructionInvoiceType.PURCHASE]: 'Purchase Invoice',
  [ConstructionInvoiceType.SALES]: 'Sales Invoice',
  [ConstructionInvoiceType.EXPENSE]: 'Expense Invoice',
  [ConstructionInvoiceType.SERVICE]: 'Service Invoice',
};

export const invoiceStatusLabels: Record<ConstructionInvoiceStatus, string> = {
  [ConstructionInvoiceStatus.DRAFT]: 'Draft',
  [ConstructionInvoiceStatus.PENDING]: 'Pending Approval',
  [ConstructionInvoiceStatus.APPROVED]: 'Approved',
  [ConstructionInvoiceStatus.SENT]: 'Sent',
  [ConstructionInvoiceStatus.PARTIALLY_PAID]: 'Partially Paid',
  [ConstructionInvoiceStatus.PAID]: 'Paid',
  [ConstructionInvoiceStatus.OVERDUE]: 'Overdue',
  [ConstructionInvoiceStatus.CANCELLED]: 'Cancelled',
  [ConstructionInvoiceStatus.DISPUTED]: 'Disputed',
};

const zinc = 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';

export const getInvoiceStatusColor = (
  status: ConstructionInvoiceStatus
): string => {
  switch (status) {
    case ConstructionInvoiceStatus.PAID: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case ConstructionInvoiceStatus.APPROVED: {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
    }
    case ConstructionInvoiceStatus.PARTIALLY_PAID: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case ConstructionInvoiceStatus.PENDING: {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    case ConstructionInvoiceStatus.SENT: {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    }
    case ConstructionInvoiceStatus.OVERDUE:
    case ConstructionInvoiceStatus.CANCELLED: {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case ConstructionInvoiceStatus.DISPUTED: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    default: {
      return zinc;
    }
  }
};

export const getInvoiceTypeColor = (type: ConstructionInvoiceType): string => {
  switch (type) {
    case ConstructionInvoiceType.PURCHASE: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case ConstructionInvoiceType.SALES: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case ConstructionInvoiceType.EXPENSE: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    case ConstructionInvoiceType.SERVICE: {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
    }
    default: {
      return zinc;
    }
  }
};
