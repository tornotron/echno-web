// types/resource/purchase-order.ts

export enum PurchaseOrderType {
  materials = 'materials', // Materials purchase
  equipment = 'equipment', // Equipment purchase
  services = 'services', // Services procurement
  rental = 'rental', // Equipment rental
  mixed = 'mixed', // Mixed items
}

export enum PurchaseOrderStatus {
  draft = 'draft',
  pending = 'pending',
  approved = 'approved',
  sent = 'sent',
  acknowledged = 'acknowledged',
  partiallyReceived = 'partially_received',
  received = 'received',
  partiallyInvoiced = 'partially_invoiced',
  invoiced = 'invoiced',
  completed = 'completed',
  cancelled = 'cancelled',
  rejected = 'rejected',
}

export enum DeliveryStatus {
  pending = 'pending',
  scheduled = 'scheduled',
  inTransit = 'in_transit',
  partiallyDelivered = 'partially_delivered',
  delivered = 'delivered',
  delayed = 'delayed',
  failed = 'failed',
}

export interface PurchaseOrderLineItem {
  id: number;
  inventoryItemId?: number; // Foreign key to InventoryItem (if existing item)
  assetId?: number; // Foreign key to Asset (if existing asset)
  description: string;
  specifications?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number; // Percentage
  taxAmount: number;
  discountRate?: number; // Percentage
  discountAmount?: number;
  subtotal: number; // quantity * unitPrice
  total: number; // subtotal + tax - discount

  // Delivery tracking
  quantityReceived: number;
  quantityPending: number; // quantity - quantityReceived
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;

  // Inventory destination
  destinationLocationId?: number; // Foreign key to Location

  notes?: string;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string; // e.g., "PO-2024-001"
  type: PurchaseOrderType;
  status: PurchaseOrderStatus;
  deliveryStatus: DeliveryStatus;

  // Relationships
  vendorId: number; // Foreign key to Vendor
  projectId?: number; // Foreign key to Project
  organizationId?: number; // Foreign key to Organization
  materialRequestId?: number; // Foreign key to MaterialRequest (if originated from MR)

  // PO Details
  poDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  deliveryAddress: string;
  deliveryLocationId?: number; // Foreign key to Location

  // Line Items
  lineItems: PurchaseOrderLineItem[];

  // Calculations
  subtotal: number; // Sum of all line item subtotals
  taxAmount: number; // Sum of all line item taxes
  discountAmount: number; // Sum of all line item discounts
  shippingCost: number;
  otherCharges: number;
  totalAmount: number; // subtotal + tax - discount + shipping + other

  // Payment Terms
  paymentTerms?: string; // e.g., "Net 30", "50% Advance"
  paymentMethod?: string;
  advancePaymentRequired: boolean;
  advancePaymentPercentage?: number;
  advancePaymentAmount?: number;

  // Vendor Information (cached)
  vendorName: string;
  vendorContactPerson: string;
  vendorPhone: string;
  vendorEmail: string;
  vendorAddress: string;
  vendorGstNumber?: string;

  // Tax Information
  taxType?: string; // e.g., "GST", "IGST", "VAT"
  placeOfSupply?: string;

  // Approval Workflow
  requestedBy: number; // Employee ID
  requestedAt: Date;
  approvedBy?: number; // Employee ID
  approvedAt?: Date;
  rejectedBy?: number; // Employee ID
  rejectedAt?: Date;
  rejectionReason?: string;

  // Acknowledgment
  acknowledgedAt?: Date;
  vendorPoNumber?: string; // Vendor's PO number

  // Additional Information
  description?: string;
  notes?: string;
  termsAndConditions?: string;
  attachments?: string[]; // PO documents, quotations

  // Receiving & Quality Check
  qualityCheckRequired: boolean;
  qualityCheckStatus?: 'pending' | 'passed' | 'failed';
  inspectedBy?: number; // Employee ID
  inspectedAt?: Date;
  qualityNotes?: string;

  // Invoice Tracking
  invoiceIds: number[]; // Foreign keys to Invoice

  // Payment Tracking
  paymentIds: number[]; // Foreign keys to Payment
  totalPaid: number; // Sum of all payments
  balanceAmount: number; // totalAmount - totalPaid
  paymentStatus: 'unpaid' | 'partially_paid' | 'fully_paid';

  // Goods Receipt Tracking
  goodsReceiptIds: number[]; // Foreign keys to GoodsReceipt
  receiptStatus: 'not_received' | 'partially_received' | 'fully_received';
  firstReceiptDate?: Date; // Date of first goods receipt
  lastReceiptDate?: Date; // Date of last goods receipt

  // Stock Impact
  stockAdjustmentIds: number[]; // Stock adjustments created from receipts

  // Audit
  createdBy: number; // Employee ID
  createdAt: Date;
  updatedAt: Date;
}

export const purchaseOrderTypeLabels: Record<PurchaseOrderType, string> = {
  materials: 'Materials',
  equipment: 'Equipment',
  services: 'Services',
  rental: 'Equipment Rental',
  mixed: 'Mixed Items',
};

export const purchaseOrderStatusLabels: Record<PurchaseOrderStatus, string> = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  sent: 'Sent to Vendor',
  acknowledged: 'Acknowledged',
  partially_received: 'Partially Received',
  received: 'Received',
  partially_invoiced: 'Partially Invoiced',
  invoiced: 'Invoiced',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  pending: 'Pending',
  scheduled: 'Scheduled',
  in_transit: 'In Transit',
  partially_delivered: 'Partially Delivered',
  delivered: 'Delivered',
  delayed: 'Delayed',
  failed: 'Failed',
};
