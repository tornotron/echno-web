// types/resource/transfer.ts

export enum TransferType {
  locationToLocation = 'location_to_location', // Between storage locations
  projectToProject = 'project_to_project', // Between projects
  returnToStock = 'return_to_stock', // Return unused items
  disposal = 'disposal', // Transfer to disposal
  temporary = 'temporary', // Temporary transfer (loan)
}

export enum TransferStatus {
  draft = 'draft',
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
  inTransit = 'in_transit',
  completed = 'completed',
  cancelled = 'cancelled',
  failed = 'failed',
}

export enum TransferPriority {
  low = 'low',
  medium = 'medium',
  high = 'high',
  urgent = 'urgent',
}

export interface TransferLineItem {
  id: number;
  inventoryItemId?: number; // Foreign key to InventoryItem
  assetId?: number; // Foreign key to Asset
  description: string;
  quantityRequested: number;
  quantityApproved: number;
  quantityTransferred: number;
  unit: string;

  // Condition tracking
  conditionBefore?: string; // e.g., "Good", "Fair", "Damaged"
  conditionAfter?: string;

  // Value tracking
  unitValue: number;
  totalValue: number;

  notes?: string;
}

export interface Transfer {
  id: number;
  transferNumber: string; // e.g., "TRF-2024-001"
  type: TransferType;
  status: TransferStatus;
  priority: TransferPriority;

  // Source & Destination
  sourceLocationId: number; // Foreign key to Location
  destinationLocationId: number; // Foreign key to Location
  sourceProjectId?: number; // Foreign key to Project
  destinationProjectId?: number; // Foreign key to Project

  // Relationships
  materialRequestId?: number; // Foreign key to MaterialRequest (if originated)
  organizationId?: number; // Foreign key to Organization

  // Transfer Details
  requestDate: Date;
  scheduledDate?: Date;
  actualTransferDate?: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;

  // Line Items
  lineItems: TransferLineItem[];

  // Value tracking
  totalValue: number; // Sum of all line item values

  // Transport Details
  transportMethod?: string; // e.g., "Truck", "Van", "Internal"
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  transportCost?: number;

  // Temporary Transfer (if applicable)
  isTemporary: boolean;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;

  // Requestor
  requestedBy: number; // Employee ID
  requestedByDepartment?: string;

  // Approval
  approvedBy?: number; // Employee ID
  approvedAt?: Date;
  rejectedBy?: number; // Employee ID
  rejectedAt?: Date;
  rejectionReason?: string;

  // Handover & Receipt
  issuedBy?: number; // Employee ID (who releases items)
  issuedAt?: Date;
  receivedBy?: number; // Employee ID (who receives items)
  receivedAt?: Date;

  // Quality Check
  qualityCheckRequired: boolean;
  qualityCheckPassed?: boolean;
  inspectedBy?: number; // Employee ID
  inspectedAt?: Date;
  qualityNotes?: string;

  // Discrepancies
  hasDiscrepancies: boolean;
  discrepancyNotes?: string;
  discrepancyResolvedBy?: number; // Employee ID
  discrepancyResolvedAt?: Date;

  // Stock Impact Tracking
  stockAdjustmentIds: number[]; // All adjustments created by this transfer
  sourceStockAdjustmentId?: number; // Decrease adjustment at source
  destStockAdjustmentId?: number; // Increase adjustment at destination
  inventoryUpdated: boolean; // Whether inventory was automatically updated
  inventoryUpdatedAt?: Date;

  // Financial Impact
  totalCostTransferred: number; // Total value moved
  transportExpenseId?: number; // Foreign key to Expense (transport cost)
  totalTransportCost: number; // Cost of transport
  costPerUnit?: number; // Average cost per unit transferred

  // Additional Information
  purpose: string;
  notes?: string;
  attachments?: string[]; // Transfer documents, photos

  // Audit
  createdBy: number; // Employee ID
  createdAt: Date;
  updatedAt: Date;
}

export const transferTypeLabels: Record<TransferType, string> = {
  location_to_location: 'Location to Location',
  project_to_project: 'Project to Project',
  return_to_stock: 'Return to Stock',
  disposal: 'Disposal',
  temporary: 'Temporary Transfer',
};

export const transferStatusLabels: Record<TransferStatus, string> = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  in_transit: 'In Transit',
  completed: 'Completed',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

export const transferPriorityLabels: Record<TransferPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Helper function to get priority color
export function getTransferPriorityColor(priority: TransferPriority): string {
  const colors = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red',
  };
  return colors[priority];
}
