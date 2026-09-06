// types/resource/stock-adjustment.ts

export enum StockAdjustmentType {
  increase = 'increase', // Add stock
  decrease = 'decrease', // Remove stock
  correction = 'correction', // Correct discrepancy
  write_off = 'write_off', // Write off damaged/obsolete
  return = 'return', // Vendor return
  recount = 'recount', // Physical count adjustment
}

export enum StockAdjustmentReason {
  physicalCount = 'physical_count', // Physical inventory count
  damaged = 'damaged', // Damaged items
  expired = 'expired', // Expired items
  lost = 'lost', // Lost/stolen items
  found = 'found', // Found items
  obsolete = 'obsolete', // Obsolete items
  vendorReturn = 'vendor_return', // Returned to vendor
  qualityIssue = 'quality_issue', // Quality issues
  dataError = 'data_error', // Data entry error
  theft = 'theft', // Theft
  donation = 'donation', // Donated items
  sample = 'sample', // Sample/testing
  other = 'other', // Other reasons
}

export enum StockAdjustmentStatus {
  draft = 'draft',
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
  processed = 'processed',
  cancelled = 'cancelled',
}

/**
 * The kind of document a stock adjustment was raised to answer.
 *
 * One value today, and the string the backend expects on the wire rather than a
 * lower-cased display form. A site transfer received short leaves a quantity
 * that is neither at the sending site nor recorded at the receiving one, and the
 * transfer writes no loss movement for it deliberately, so the only thing that
 * closes the variance is an adjustment naming that transfer.
 */
export type StockAdjustmentSourceDocumentType = 'SITE_TRANSFER';

/**
 * The document an adjustment was raised to answer.
 *
 * The two halves travel together or neither travels: the backend refuses a type
 * without an id, and an id without a type, with a 400. Holding them as one
 * object is what makes a half reference unrepresentable on the way out.
 */
export interface StockAdjustmentSourceReference {
  type: StockAdjustmentSourceDocumentType;
  id: number;
}

export interface StockAdjustmentLineItem {
  id: number;
  materialId?: number; // Foreign key to Material, required before the line can be posted
  materialName?: string; // Denormalised material name, read-only
  inventoryItemId?: number; // Foreign key to InventoryItem
  assetId?: number; // Foreign key to Asset
  description: string;

  // Quantities
  systemQuantity: number; // Quantity per system records
  physicalQuantity: number; // Actual physical quantity
  adjustmentQuantity: number; // Difference (physical - system)
  unit: string;

  // Values
  unitValue: number;
  totalAdjustmentValue: number; // adjustmentQuantity * unitValue

  // Reason
  reason: StockAdjustmentReason;
  reasonDetails?: string;

  // Location
  locationId: number; // Foreign key to Location
  binLocation?: string; // Specific bin/rack location

  notes?: string;
}

export interface StockAdjustment {
  id: number;
  adjustmentNumber: string; // e.g., "ADJ-2024-001"
  type: StockAdjustmentType;
  status: StockAdjustmentStatus;

  // Relationships
  locationId?: number; // Foreign key to StorageLocation (if applicable)
  locationName?: string; // Denormalised storage location name, read-only
  projectId?: number; // Foreign key to Project. Required before approval: the
  // balance an adjustment corrects is held per project, so a document naming
  // none has nothing to post against.
  projectName?: string; // Denormalised project name, read-only
  organizationId?: number; // Foreign key to Organization

  // Adjustment Details
  adjustmentDate: Date;
  effectiveDate: Date; // When adjustment takes effect

  // Line Items
  lineItems: StockAdjustmentLineItem[];

  // Value Impact
  totalAdjustmentValue: number; // Sum of all line item adjustment values

  // Reason & Justification
  primaryReason: StockAdjustmentReason;
  justification: string;

  // Physical Count Reference (if applicable)
  physicalCountDate?: Date;
  // Employee ID, taken from the creation payload rather than the session, so
  // it resolves through the employee lookup. It is the one *By field on this
  // document that must NOT be run through the user directory.
  physicalCountBy?: number;
  countMethod?: string; // e.g., "Full Count", "Cycle Count", "Spot Check"

  // Approval Workflow.
  //
  // Every id below is a USER id: the backend stamps them from the session with
  // UserContextService.getCurrentUserId(). Each carries the name the backend
  // resolved for it, which is set exactly when its id is. A name reading
  // `User #<id>` means the account was deleted, an email means the account
  // holds no name, and an absent name means the step never happened.
  submittedBy: number; // User ID
  submittedByName?: string;
  submittedAt: Date;
  approvedBy?: number; // User ID (typically manager/supervisor)
  approvedByName?: string;
  approvedAt?: Date;
  rejectedBy?: number; // User ID
  rejectedByName?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Processing
  processedBy?: number; // User ID
  processedByName?: string;
  processedAt?: Date;

  // Variance Analysis
  totalVarianceQuantity: number; // Total quantity variance
  totalVarianceValue: number; // Total value variance
  variancePercentage: number; // Percentage variance
  isSignificantVariance: boolean; // Flags if variance exceeds threshold

  // The document this adjustment was raised to answer. Set together or both
  // absent: the backend writes the pair as one and refuses a half of it.
  //
  // These replaced `originType`, `originId` and `transferId`, which were the
  // shape a mocked screen once needed and which no backend response has ever
  // carried. Keeping both vocabularies would have left two names for the same
  // idea, only one of which survives a round trip.
  sourceDocumentType?: StockAdjustmentSourceDocumentType;
  sourceDocumentId?: number;

  // Related Transactions
  purchaseOrderId?: number; // Foreign key to PurchaseOrder (if from PO)
  goodsReceiptId?: number; // Foreign key to GoodsReceipt (if from receipt)
  invoiceId?: number; // Foreign key to Invoice (if vendor return)
  expenseId?: number; // Foreign key to Expense (if write-off/damage)

  // Financial Impact
  isFinanciallyProcessed: boolean;
  costImpact: number; // Total cost impact (+ or -)
  affectsCogsImmediately: boolean; // Whether this affects Cost of Goods Sold

  // Documentation
  requiresPhotos: boolean;
  photos?: string[]; // Photos of damaged/expired items
  supportingDocuments?: string[]; // Reports, receipts, etc.

  // Financial Impact
  affectsFinancials: boolean;
  accountingEntryId?: number; // Reference to accounting entry

  // Additional Information
  notes?: string;
  internalNotes?: string; // For internal use only
  tags?: string[];

  // Audit Trail
  createdBy: number; // Employee ID
  createdAt: Date;
  updatedAt: Date;
}

export const stockAdjustmentTypeLabels: Record<StockAdjustmentType, string> = {
  increase: 'Increase Stock',
  decrease: 'Decrease Stock',
  correction: 'Correction',
  write_off: 'Write Off',
  return: 'Return',
  recount: 'Recount',
};

export const stockAdjustmentReasonLabels: Record<
  StockAdjustmentReason,
  string
> = {
  physical_count: 'Physical Inventory Count',
  damaged: 'Damaged Items',
  expired: 'Expired Items',
  lost: 'Lost/Stolen Items',
  found: 'Found Items',
  obsolete: 'Obsolete Items',
  vendor_return: 'Vendor Return',
  quality_issue: 'Quality Issue',
  data_error: 'Data Entry Error',
  theft: 'Theft',
  donation: 'Donation',
  sample: 'Sample/Testing',
  other: 'Other',
};

export const stockAdjustmentStatusLabels: Record<
  StockAdjustmentStatus,
  string
> = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  processed: 'Processed',
  cancelled: 'Cancelled',
};

// Helper function to determine if variance is significant
export function isSignificantVariance(
  variancePercentage: number,
  threshold: number = 5 // Default 5% threshold
): boolean {
  return Math.abs(variancePercentage) > threshold;
}

// Helper function to get adjustment type color
export function getAdjustmentTypeColor(type: StockAdjustmentType): string {
  const colors = {
    increase: 'green',
    decrease: 'orange',
    correction: 'blue',
    write_off: 'red',
    return: 'purple',
    recount: 'gray',
  };
  return colors[type];
}
