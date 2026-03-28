export enum PurchaseOrderStatus {
  draft = 'DRAFT',
  approved = 'APPROVED',
  sentToVendor = 'SENT_TO_VENDOR',
  partiallyReceived = 'PARTIALLY_RECEIVED',
  fullyReceived = 'FULLY_RECEIVED',
  cancelled = 'CANCELLED',
}

export const purchaseOrderStatusLabels: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.draft]: 'Draft',
  [PurchaseOrderStatus.approved]: 'Approved',
  [PurchaseOrderStatus.sentToVendor]: 'Sent to Vendor',
  [PurchaseOrderStatus.partiallyReceived]: 'Partially Received',
  [PurchaseOrderStatus.fullyReceived]: 'Fully Received',
  [PurchaseOrderStatus.cancelled]: 'Cancelled',
};

export const purchaseOrderStatusBadgeColors: Record<
  PurchaseOrderStatus,
  string
> = {
  [PurchaseOrderStatus.draft]: 'bg-zinc-100 text-zinc-700',
  [PurchaseOrderStatus.approved]: 'bg-blue-100 text-blue-700',
  [PurchaseOrderStatus.sentToVendor]: 'bg-purple-100 text-purple-700',
  [PurchaseOrderStatus.partiallyReceived]: 'bg-orange-100 text-orange-700',
  [PurchaseOrderStatus.fullyReceived]: 'bg-green-100 text-green-700',
  [PurchaseOrderStatus.cancelled]: 'bg-red-100 text-red-700',
};
