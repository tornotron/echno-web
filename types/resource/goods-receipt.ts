// types/resource/goods-receipt.ts

export enum GoodsReceiptStatus {
  draft = 'draft',
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
  processed = 'processed',
  cancelled = 'cancelled',
}

export enum DiscrepancyType {
  shortage = 'shortage',
  damage = 'damage',
  quality = 'quality',
  specification = 'specification',
  excess = 'excess',
}

export interface GoodsReceiptLineItem {
  id: number;
  poLineItemId: number; // Foreign key to PurchaseOrderLineItem
  inventoryItemId?: number; // Foreign key to InventoryItem
  assetId?: number; // Foreign key to Asset
  description: string;

  // Quantities
  orderedQuantity: number; // From PO
  receivedQuantity: number; // Actually received
  acceptedQuantity: number; // Accepted after QC
  rejectedQuantity: number; // Rejected/returned
  damageQuantity: number; // Damaged items
  shortageQuantity: number; // Short delivery
  excessQuantity: number; // Over delivery

  unit: string;

  // Storage
  binLocation?: string; // Specific storage location
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: Date;

  // Discrepancy
  hasDiscrepancy: boolean;
  discrepancyType?: DiscrepancyType;
  discrepancyNotes?: string;

  // Quality
  qualityCheckPassed?: boolean;
  qualityNotes?: string;

  notes?: string;
}

export interface GoodsReceipt {
  id: number;
  receiptNumber: string; // e.g., "GRN-2024-001"
  status: GoodsReceiptStatus;

  // Relationships
  purchaseOrderId: number; // Foreign key to PurchaseOrder
  invoiceId?: number; // Foreign key to Invoice (may not exist yet)
  vendorId: number; // Foreign key to Vendor
  projectId?: number; // Foreign key to Project
  organizationId?: number; // Foreign key to Organization

  // Receipt Details
  receivedDate: Date;
  scheduledReceiptDate?: Date;
  destinationLocationId: number; // Foreign key to Location

  // Receiver
  receivedBy: number; // Employee ID
  receivedByName?: string; // Cached name

  // Line Items
  lineItems: GoodsReceiptLineItem[];

  // Quality Control
  qualityCheckRequired: boolean;
  qualityCheckPassed?: boolean;
  qualityCheckStatus?: 'pending' | 'passed' | 'failed' | 'partial';
  inspectedBy?: number; // Employee ID
  inspectedAt?: Date;
  qualityNotes?: string;

  // Discrepancies
  hasDiscrepancies: boolean;
  totalShortage: number; // Total shortage quantity across all items
  totalDamage: number; // Total damaged quantity
  totalExcess: number; // Total excess quantity
  discrepancyValue: number; // Total value of discrepancies
  discrepancyNotes?: string;
  discrepancyReportedTo?: number; // Employee ID
  discrepancyReportedAt?: Date;

  // Vendor Communication
  vendorNotified: boolean;
  vendorNotifiedAt?: Date;
  vendorResponse?: string;
  vendorCreditNoteNumber?: string; // If vendor issues credit note

  // Stock Impact
  stockAdjustmentId?: number; // Foreign key to StockAdjustment (auto-created)
  inventoryUpdated: boolean;
  inventoryUpdatedAt?: Date;

  // Approval (if required for high-value items)
  requiresApproval: boolean;
  approvedBy?: number; // Employee ID
  approvedAt?: Date;
  rejectedBy?: number; // Employee ID
  rejectedAt?: Date;
  rejectionReason?: string;

  // Documentation
  photos?: string[]; // Photos of received goods
  documents?: string[]; // Delivery notes, packing lists, etc.
  deliveryNoteNumber?: string;

  // Transport Details
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  transportCompany?: string;

  // Value Tracking
  totalOrderValue: number; // From PO
  totalReceivedValue: number; // Actual received value
  valueVariance: number; // Difference

  // Additional Information
  notes?: string;
  internalNotes?: string;
  tags?: string[];

  // Audit Trail
  createdBy: number; // Employee ID
  createdAt: Date;
  updatedAt: Date;
}

export const goodsReceiptStatusLabels: Record<GoodsReceiptStatus, string> = {
  draft: 'Draft',
  pending: 'Pending QC',
  approved: 'Approved',
  rejected: 'Rejected',
  processed: 'Processed',
  cancelled: 'Cancelled',
};

export const goodsReceiptStatusColors: Record<GoodsReceiptStatus, string> = {
  draft: 'zinc',
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  processed: 'blue',
  cancelled: 'zinc',
};

export const discrepancyTypeLabels: Record<DiscrepancyType, string> = {
  shortage: 'Shortage',
  damage: 'Damaged',
  quality: 'Quality Issue',
  specification: 'Specification Mismatch',
  excess: 'Excess Delivery',
};

export const discrepancyTypeColors: Record<DiscrepancyType, string> = {
  shortage: 'red',
  damage: 'orange',
  quality: 'yellow',
  specification: 'purple',
  excess: 'blue',
};
