// types/finance/payment.ts
//
// Web-side presentation helpers for construction payments. The domain types and
// enums are owned by @tornotron/echno-core; this module re-exports them so the
// app has a single import point, and adds the label and colour maps used by the
// payment list and detail views.

import {
  ConstructionPaymentType,
  ConstructionPaymentVoucherStatus,
  ConstructionPaymentMethod,
  ConstructionPayeeType,
} from '@tornotron/echno-core/finance/types';

export type { ConstructionPayment } from '@tornotron/echno-core/finance/types';
export {
  ConstructionPaymentType,
  ConstructionPaymentVoucherStatus,
  ConstructionPaymentMethod,
  ConstructionPayeeType,
} from '@tornotron/echno-core/finance/types';

// Editable draft shape for the create / edit forms. Web-only view model; the
// create/update payloads sent to the backend are the
// Create/UpdateConstructionPaymentRequest types owned by echno-core.

export interface PaymentFormData {
  paymentNumber: string;
  type: ConstructionPaymentType;
  status: ConstructionPaymentVoucherStatus;
  method: ConstructionPaymentMethod;
  projectId: number;
  amount: number;
  currency: string;
  paymentDate: string;
  transactionId: string;
  referenceNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  description: string;
  notes: string;
  payeeType?: ConstructionPayeeType;
  payeeName: string;
  payeeDetails: string;
  vendorId?: number;
  employeeId?: number;
  subContractId?: number;
  labourId?: number;
}

export const paymentTypeLabels: Record<ConstructionPaymentType, string> = {
  [ConstructionPaymentType.INVOICE]: 'Invoice Payment',
  [ConstructionPaymentType.ADVANCE]: 'Advance Payment',
  [ConstructionPaymentType.REFUND]: 'Refund',
  [ConstructionPaymentType.EXPENSE]: 'Expense Payment',
  [ConstructionPaymentType.SALARY]: 'Salary Payment',
  [ConstructionPaymentType.OTHER]: 'Other Payment',
};

export const paymentStatusLabels: Record<
  ConstructionPaymentVoucherStatus,
  string
> = {
  [ConstructionPaymentVoucherStatus.PENDING]: 'Pending',
  [ConstructionPaymentVoucherStatus.PROCESSING]: 'Processing',
  [ConstructionPaymentVoucherStatus.COMPLETED]: 'Completed',
  [ConstructionPaymentVoucherStatus.FAILED]: 'Failed',
  [ConstructionPaymentVoucherStatus.CANCELLED]: 'Cancelled',
  [ConstructionPaymentVoucherStatus.REFUNDED]: 'Refunded',
};

export const paymentMethodLabels: Record<ConstructionPaymentMethod, string> = {
  [ConstructionPaymentMethod.CASH]: 'Cash',
  [ConstructionPaymentMethod.CHEQUE]: 'Cheque',
  [ConstructionPaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [ConstructionPaymentMethod.UPI]: 'UPI',
  [ConstructionPaymentMethod.CARD]: 'Card',
  [ConstructionPaymentMethod.NEFT]: 'NEFT',
  [ConstructionPaymentMethod.RTGS]: 'RTGS',
  [ConstructionPaymentMethod.IMPS]: 'IMPS',
  [ConstructionPaymentMethod.OTHER]: 'Other',
};

export const payeeTypeLabels: Record<ConstructionPayeeType, string> = {
  [ConstructionPayeeType.EMPLOYEE]: 'Employee',
  [ConstructionPayeeType.VENDOR]: 'Vendor',
  [ConstructionPayeeType.SUB_CONTRACTOR]: 'Sub-Contractor',
  [ConstructionPayeeType.LABOUR]: 'Labour',
  [ConstructionPayeeType.CONSULTANT]: 'Consultant',
  [ConstructionPayeeType.UTILITY]: 'Utility Provider',
  [ConstructionPayeeType.GOVERNMENT]: 'Government/Tax',
  [ConstructionPayeeType.INSURANCE]: 'Insurance',
  [ConstructionPayeeType.BANK]: 'Bank/Financial',
  [ConstructionPayeeType.LEGAL]: 'Legal Services',
  [ConstructionPayeeType.RENTAL]: 'Equipment Rental',
  [ConstructionPayeeType.OTHER]: 'Other',
};

const zinc = 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';

export const getPaymentStatusColor = (
  status: ConstructionPaymentVoucherStatus
): string => {
  switch (status) {
    case ConstructionPaymentVoucherStatus.COMPLETED: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case ConstructionPaymentVoucherStatus.PROCESSING: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case ConstructionPaymentVoucherStatus.PENDING: {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    case ConstructionPaymentVoucherStatus.FAILED: {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case ConstructionPaymentVoucherStatus.REFUNDED: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    default: {
      return zinc;
    }
  }
};

export const getPaymentTypeColor = (type: ConstructionPaymentType): string => {
  switch (type) {
    case ConstructionPaymentType.INVOICE: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case ConstructionPaymentType.SALARY: {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    }
    case ConstructionPaymentType.ADVANCE: {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
    }
    case ConstructionPaymentType.EXPENSE: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    case ConstructionPaymentType.REFUND: {
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
    }
    default: {
      return zinc;
    }
  }
};
