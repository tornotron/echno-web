// types/finance/estimate.ts

export enum EstimateStatus {
  draft = 'draft',
  pending = 'pending',
  sent = 'sent',
  approved = 'approved',
  rejected = 'rejected',
  revised = 'revised',
  converted = 'converted',  // Converted to project/invoice
  expired = 'expired',
  cancelled = 'cancelled',
}

export enum EstimateCategory {
  construction = 'construction',
  renovation = 'renovation',
  maintenance = 'maintenance',
  consulting = 'consulting',
  design = 'design',
  mixed = 'mixed',
}

export interface EstimateLineItem {
  id: number;
  category: string;           // e.g., "Materials", "Labor", "Equipment", "Subcontractor"
  description: string;
  specifications?: string;
  quantity: number;
  unit: string;
  unitRate: number;
  laborCost?: number;
  materialCost?: number;
  equipmentCost?: number;
  overhead?: number;         // Percentage
  profit?: number;           // Percentage
  subtotal: number;          // quantity * unitRate
  total: number;             // subtotal + overhead + profit
  notes?: string;
  // Optional references
  inventoryItemId?: number;
  taskId?: number;
  workCategoryId?: number;
}

export interface Estimate {
  id: number;
  estimateNumber: string;      // e.g., "EST-2024-001"
  title: string;
  status: EstimateStatus;
  category: EstimateCategory;
  
  // Client/Project Information
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  projectId?: number;          // Foreign key to Project (if exists)
  organizationId?: number;     // Foreign key to Organization
  
  // Project Details
  projectLocation: string;
  projectDescription: string;
  scope: string;               // Detailed scope of work
  assumptions?: string;        // Assumptions made in estimate
  exclusions?: string;         // What's not included
  
  // Timeline
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  estimatedDuration?: number;  // In days
  validityPeriod: number;      // Days estimate is valid
  preparedDate: Date;
  expiryDate?: Date;
  
  // Line Items
  lineItems: EstimateLineItem[];
  
  // Cost Breakdown
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  subcontractorCost: number;
  overheadCost: number;
  profitMargin: number;
  subtotal: number;
  contingency: number;         // Percentage for unexpected costs
  contingencyAmount: number;
  taxRate: number;             // Percentage
  taxAmount: number;
  totalAmount: number;
  
  // Payment Terms
  paymentTerms?: string;
  advancePayment?: number;     // Percentage
  milestonePayments?: {
    milestone: string;
    percentage: number;
    amount: number;
  }[];
  
  // Documents & Attachments
  attachments?: string[];      // URLs or file paths
  drawingsAttached?: boolean;
  specificationsAttached?: boolean;
  
  // Terms & Conditions
  termsAndConditions?: string;
  warrantyTerms?: string;
  notes?: string;
  
  // Approval & Conversion
  preparedBy: number;          // Employee ID
  reviewedBy?: number;         // Employee ID
  approvedBy?: number;         // Employee ID
  approvedAt?: Date;
  sentAt?: Date;
  convertedToProjectId?: number;  // If converted to actual project
  convertedAt?: Date;
  
  // Audit
  createdBy: number;           // Employee ID
  createdAt: Date;
  updatedAt: Date;
  version: number;             // For tracking revisions
  previousVersionId?: number;  // Link to previous version
}

export const estimateStatusLabels: Record<EstimateStatus, string> = {
  draft: 'Draft',
  pending: 'Pending Review',
  sent: 'Sent to Client',
  approved: 'Approved',
  rejected: 'Rejected',
  revised: 'Revised',
  converted: 'Converted to Project',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export const estimateCategoryLabels: Record<EstimateCategory, string> = {
  construction: 'New Construction',
  renovation: 'Renovation',
  maintenance: 'Maintenance',
  consulting: 'Consulting',
  design: 'Design Services',
  mixed: 'Mixed Services',
};

// Helper function to calculate estimate total
export function calculateEstimateTotal(
  subtotal: number,
  contingencyPercentage: number,
  taxRate: number
): {
  contingencyAmount: number;
  taxAmount: number;
  total: number;
} {
  const contingencyAmount = (subtotal * contingencyPercentage) / 100;
  const amountBeforeTax = subtotal + contingencyAmount;
  const taxAmount = (amountBeforeTax * taxRate) / 100;
  const total = amountBeforeTax + taxAmount;
  
  return {
    contingencyAmount,
    taxAmount,
    total,
  };
}
