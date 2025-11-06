// types/finance/expense.ts

export enum ExpenseCategory {
  materials = 'materials',
  labour = 'labour',
  equipment = 'equipment',
  transport = 'transport',
  utilities = 'utilities',
  rent = 'rent',
  salaries = 'salaries',
  maintenance = 'maintenance',
  insurance = 'insurance',
  legal = 'legal',
  marketing = 'marketing',
  office = 'office',
  travel = 'travel',
  miscellaneous = 'miscellaneous',
  other = 'other',
}

export enum ExpenseStatus {
  draft = 'draft',
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
  paid = 'paid',
  reimbursed = 'reimbursed',
  cancelled = 'cancelled',
}

export enum ExpenseType {
  direct = 'direct',         // Direct project expense
  indirect = 'indirect',     // Overhead/indirect expense
  capital = 'capital',       // Capital expenditure
  operational = 'operational', // Operational expense
}

export interface Expense {
  id: number;
  expenseNumber: string;     // e.g., "EXP-2024-001"
  type: ExpenseType;
  category: ExpenseCategory;
  status: ExpenseStatus;
  
  // Relationships
  projectId?: number;        // Foreign key to Project (for direct expenses)
  organizationId?: number;   // Foreign key to Organization
  vendorId?: number;         // Foreign key to Vendor
  employeeId?: number;       // Foreign key to Employee (who incurred expense)
  invoiceId?: number;        // Foreign key to Invoice
  paymentId?: number;        // Foreign key to Payment
  budgetId?: number;         // Foreign key to Budget
  
  // Expense Details
  description: string;
  amount: number;
  currency: string;          // e.g., "INR", "USD"
  expenseDate: Date;
  
  // Tax Information
  taxAmount?: number;
  taxRate?: number;
  taxType?: string;          // e.g., "GST", "VAT"
  totalAmount: number;       // amount + taxAmount
  
  // Payment Information
  paymentMethod?: string;    // e.g., "Cash", "Card", "Bank Transfer"
  paymentStatus: 'unpaid' | 'paid' | 'partially_paid' | 'reimbursed';
  paidAmount: number;
  balanceAmount: number;
  
  // Receipt/Bill Information
  billNumber?: string;
  billDate?: Date;
  receiptAttachment?: string; // Scanned receipt/bill
  
  // Approval Workflow
  submittedBy: number;       // Employee ID who submitted
  submittedAt: Date;
  approvedBy?: number;       // Employee ID who approved
  approvedAt?: Date;
  rejectedBy?: number;       // Employee ID who rejected
  rejectedAt?: Date;
  rejectionReason?: string;
  
  // Additional Information
  notes?: string;
  attachments?: string[];    // Additional documents
  tags?: string[];           // For categorization
  
  // Reimbursement (for employee expenses)
  isReimbursable: boolean;
  reimbursedTo?: number;     // Employee ID
  reimbursedAt?: Date;
  reimbursementAmount?: number;
  
  // Audit
  createdBy: number;         // Employee ID
  createdAt: Date;
  updatedAt: Date;
}

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  materials: 'Materials',
  labour: 'Labour',
  equipment: 'Equipment',
  transport: 'Transport',
  utilities: 'Utilities',
  rent: 'Rent',
  salaries: 'Salaries',
  maintenance: 'Maintenance',
  insurance: 'Insurance',
  legal: 'Legal & Compliance',
  marketing: 'Marketing',
  office: 'Office Supplies',
  travel: 'Travel',
  miscellaneous: 'Miscellaneous',
  other: 'Other',
};

export const expenseStatusLabels: Record<ExpenseStatus, string> = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
  reimbursed: 'Reimbursed',
  cancelled: 'Cancelled',
};

export const expenseTypeLabels: Record<ExpenseType, string> = {
  direct: 'Direct Expense',
  indirect: 'Indirect Expense',
  capital: 'Capital Expenditure',
  operational: 'Operational Expense',
};
