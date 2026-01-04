// types/finance/budget.ts

export enum BudgetType {
  project = 'project', // Project-specific budget
  department = 'department', // Department budget
  category = 'category', // Category-specific budget
  organization = 'organization', // Overall organization budget
  annual = 'annual', // Annual budget
  quarterly = 'quarterly', // Quarterly budget
  monthly = 'monthly', // Monthly budget
}

export enum BudgetStatus {
  draft = 'draft',
  active = 'active',
  underReview = 'under_review',
  approved = 'approved',
  exceeded = 'exceeded',
  closed = 'closed',
  cancelled = 'cancelled',
}

export enum BudgetLineItemType {
  material = 'material',
  labor = 'labor',
  equipment = 'equipment',
  other = 'other',
}

export interface BudgetLineItem {
  id: number;
  itemType: BudgetLineItemType; // Type of line item
  category: string; // e.g., "Materials", "Labour", "Equipment"
  subcategory?: string; // e.g., "Cement", "Steel"
  description: string;

  // Task linkage
  taskId?: number; // Link to specific project task

  // Quantity and pricing (for materials/equipment)
  quantity?: number; // Quantity needed
  unit?: string; // Unit of measurement (e.g., "m3", "kg", "hours")
  unitRate?: number; // Cost per unit

  // Cost breakdown
  materialCost?: number; // For material items
  equipmentCost?: number; // For equipment items
  laborCost?: number; // For labor items (hours * rate)

  // Budget tracking
  allocatedAmount: number; // Planned/budgeted amount
  spentAmount: number; // Actual amount spent (from payments/receipts)
  committedAmount: number; // Amount committed but not yet spent (from material requests/POs)
  remainingAmount: number; // allocatedAmount - spentAmount - committedAmount
  percentageUsed: number; // (spentAmount / allocatedAmount) * 100

  notes?: string;
}

export enum PaymentMilestoneStatus {
  pending = 'pending',
  due = 'due',
  paid = 'paid',
  overdue = 'overdue',
  cancelled = 'cancelled',
}

export interface BudgetPaymentMilestone {
  id: number;
  name: string; // e.g., "Initial Payment", "50% Completion"
  description?: string;
  dueDate: Date;
  amount: number;
  percentage: number; // Percentage of total budget
  status: PaymentMilestoneStatus;
  linkedInvoiceId?: number; // Link to actual invoice
  linkedPaymentId?: number; // Link to actual payment
  paidDate?: Date;
  notes?: string;
}

export interface Budget {
  id: number;
  budgetNumber: string; // e.g., "BUD-2024-001"
  name: string;
  type: BudgetType;
  status: BudgetStatus;

  // Relationships
  projectId?: number; // Foreign key to Project
  organizationId?: number; // Foreign key to Organization
  departmentId?: number; // Foreign key to Department (if exists)

  // Budget Period
  startDate: Date;
  endDate: Date;
  fiscalYear?: string; // e.g., "2024-2025"
  quarter?: number; // 1, 2, 3, or 4
  month?: number; // 1-12

  // Budget Amounts
  totalAllocated: number;
  totalSpent: number;
  totalCommitted: number; // Purchase orders, contracts not yet invoiced
  totalRemaining: number; // totalAllocated - totalSpent - totalCommitted
  percentageUsed: number; // (totalSpent / totalAllocated) * 100

  // Line Items
  lineItems: BudgetLineItem[];

  // Thresholds & Alerts
  warningThreshold: number; // Percentage (e.g., 80%)
  criticalThreshold: number; // Percentage (e.g., 95%)
  isOverBudget: boolean;
  overBudgetAmount?: number; // Amount exceeded
  // Linked Transactions (track budget consumption)
  linkedExpenseIds: number[]; // Foreign keys to Expense[] (expenses against this budget)
  linkedPurchaseOrderIds: number[]; // Foreign keys to PurchaseOrder[] (POs against budget)
  actualSpent: number; // Sum of all linked expenses/POs
  remainingBudget: number; // totalAmount - actualSpent
  // Approval
  preparedBy: number; // Employee ID
  preparedAt: Date;
  approvedBy?: number; // Employee ID
  approvedAt?: Date;

  // Review
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  reviewNotes?: string;

  // Adjustments
  adjustments: BudgetAdjustment[];

  // Project Details (from estimates)
  projectScope?: string; // Detailed scope of work
  assumptions?: string; // Budget assumptions
  exclusions?: string; // Items excluded from budget

  // Payment Planning
  paymentMilestones: BudgetPaymentMilestone[];
  termsAndConditions?: string;

  // Additional Information
  description?: string;
  notes?: string;
  attachments?: string[]; // Supporting documents
  tags?: string[];

  // Audit
  createdBy: number; // Employee ID
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAdjustment {
  id: number;
  budgetId: number;
  adjustmentDate: Date;
  category: string;
  previousAmount: number;
  adjustmentAmount: number; // Positive for increase, negative for decrease
  newAmount: number;
  reason: string;
  approvedBy: number; // Employee ID
  approvedAt: Date;
  notes?: string;
}

export const budgetTypeLabels: Record<BudgetType, string> = {
  project: 'Project Budget',
  department: 'Department Budget',
  category: 'Category Budget',
  organization: 'Organization Budget',
  annual: 'Annual Budget',
  quarterly: 'Quarterly Budget',
  monthly: 'Monthly Budget',
};

export const budgetStatusLabels: Record<BudgetStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  under_review: 'Under Review',
  approved: 'Approved',
  exceeded: 'Exceeded',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export const budgetLineItemTypeLabels: Record<BudgetLineItemType, string> = {
  material: 'Material',
  labor: 'Labor',
  equipment: 'Equipment',
  other: 'Other',
};

export const paymentMilestoneStatusLabels: Record<
  PaymentMilestoneStatus,
  string
> = {
  pending: 'Pending',
  due: 'Due',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

// Helper function to calculate budget health
export function getBudgetHealth(percentageUsed: number): {
  status: 'healthy' | 'warning' | 'critical' | 'exceeded';
  color: string;
  label: string;
} {
  if (percentageUsed > 100) {
    return { status: 'exceeded', color: 'red', label: 'Over Budget' };
  } else if (percentageUsed >= 95) {
    return { status: 'critical', color: 'red', label: 'Critical' };
  } else if (percentageUsed >= 80) {
    return { status: 'warning', color: 'yellow', label: 'Warning' };
  } else {
    return { status: 'healthy', color: 'green', label: 'Healthy' };
  }
}

// Helper function to calculate line item total
export function calculateLineItemTotal(item: BudgetLineItem): number {
  const baseAmount = (item.quantity || 0) * (item.unitRate || 0);
  const materialCost = item.materialCost || 0;
  const equipmentCost = item.equipmentCost || 0;
  const laborCost = item.laborCost || 0;

  return baseAmount + materialCost + equipmentCost + laborCost;
}
