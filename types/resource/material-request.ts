// types/resource/material-request.ts

export enum MaterialRequestType {
  project = 'project',           // For project use
  maintenance = 'maintenance',   // For maintenance
  emergency = 'emergency',       // Emergency request
  replenishment = 'replenishment', // Stock replenishment
  other = 'other',               // Other purposes
}

export enum MaterialRequestStatus {
  draft = 'draft',
  submitted = 'submitted',
  underReview = 'under_review',
  approved = 'approved',
  rejected = 'rejected',
  partiallyFulfilled = 'partially_fulfilled',
  fulfilled = 'fulfilled',
  cancelled = 'cancelled',
}

export enum MaterialRequestPriority {
  low = 'low',
  medium = 'medium',
  high = 'high',
  urgent = 'urgent',
  critical = 'critical',
}

export enum FulfillmentMethod {
  fromStock = 'from_stock',      // Fulfill from existing stock
  purchase = 'purchase',         // Need to purchase
  transfer = 'transfer',         // Transfer from another location
  rental = 'rental',             // Rent equipment
  mixed = 'mixed',               // Combination of methods
}

export interface MaterialRequestLineItem {
  id: number;
  inventoryItemId?: number;      // Foreign key to InventoryItem (if existing)
  assetId?: number;              // Foreign key to Asset (if existing)
  description: string;
  specifications?: string;
  quantityRequested: number;
  quantityApproved: number;
  quantityFulfilled: number;
  quantityPending: number;       // quantityApproved - quantityFulfilled
  unit: string;
  
  // Fulfillment details
  fulfillmentMethod?: FulfillmentMethod;
  sourceLocationId?: number;     // Foreign key to Location (if transferring)
  estimatedCost?: number;
  actualCost?: number;
  
  // Dates
  requiredByDate?: Date;
  fulfilledDate?: Date;
  
  // Purpose
  taskId?: number;               // Foreign key to Task
  purpose?: string;
  
  notes?: string;
}

export interface MaterialRequest {
  id: number;
  requestNumber: string;         // e.g., "MR-2024-001"
  type: MaterialRequestType;
  status: MaterialRequestStatus;
  priority: MaterialRequestPriority;
  
  // Relationships
  projectId?: number;            // Foreign key to Project
  taskId?: number;               // Foreign key to Task
  locationId?: number;           // Foreign key to Location (destination)
  organizationId?: number;       // Foreign key to Organization
  
  // Request Details
  requestDate: Date;
  requiredByDate: Date;
  
  // Line Items
  lineItems: MaterialRequestLineItem[];
  
  // Costs (estimated)
  estimatedTotalCost: number;
  actualTotalCost: number;
  
  // Fulfillment
  fulfillmentMethod?: FulfillmentMethod;
  partialFulfillmentAllowed: boolean;
  
  // Related Documents
  purchaseOrderIds: number[];    // Foreign keys to PurchaseOrder (if created)
  transferIds: number[];         // Foreign keys to Transfer (if created)
  
  // Requestor
  requestedBy: number;           // Employee ID
  requestedByDepartment?: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // Approval Workflow
  reviewedBy?: number;           // Employee ID
  reviewedAt?: Date;
  approvedBy?: number;           // Employee ID
  approvedAt?: Date;
  rejectedBy?: number;           // Employee ID
  rejectedAt?: Date;
  rejectionReason?: string;
  
  // Fulfillment Tracking
  fulfilledBy?: number;          // Employee ID
  fulfilledAt?: Date;
  
  // Additional Information
  purpose: string;
  justification?: string;
  notes?: string;
  attachments?: string[];        // Supporting documents
  tags?: string[];
  
  // Audit
  createdBy: number;             // Employee ID
  createdAt: Date;
  updatedAt: Date;
}

export const materialRequestTypeLabels: Record<MaterialRequestType, string> = {
  project: 'Project Use',
  maintenance: 'Maintenance',
  emergency: 'Emergency',
  replenishment: 'Stock Replenishment',
  other: 'Other',
};

export const materialRequestStatusLabels: Record<MaterialRequestStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  partially_fulfilled: 'Partially Fulfilled',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

export const materialRequestPriorityLabels: Record<MaterialRequestPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
  critical: 'Critical',
};

export const fulfillmentMethodLabels: Record<FulfillmentMethod, string> = {
  from_stock: 'From Stock',
  purchase: 'Purchase',
  transfer: 'Transfer',
  rental: 'Rental',
  mixed: 'Mixed',
};

// Helper function to get priority color
export function getPriorityColor(priority: MaterialRequestPriority): string {
  const colors = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red',
    critical: 'red',
  };
  return colors[priority];
}
