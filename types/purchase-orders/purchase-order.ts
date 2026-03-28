import type { PurchaseOrderStatus } from './enums';
import type {
  PurchaseOrderItem,
  InlinePurchaseOrderItemInput,
} from './purchase-order-item';
import { parsePurchaseOrderItem } from './purchase-order-item';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  vendorId: number;
  vendorName: string;
  indentId?: number;
  indentNumber?: string;
  projectId?: number;
  projectName?: string;
  status: PurchaseOrderStatus;
  createdAt: string;
  createdBy: { id: number; name: string };
  expectedDeliveryDate?: string;
  remarks?: string;
  totalAmount?: number;
  items: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderInput {
  poNumber: string;
  vendorId: number;
  projectId: number;
  indentId?: number;
  status: PurchaseOrderStatus;
  createdBy: number;
  expectedDeliveryDate?: string;
  remarks?: string;
  totalAmount?: number;
  items: InlinePurchaseOrderItemInput[];
}

export interface UpdatePurchaseOrderInput {
  id: number;
  projectId?: number;
  status?: PurchaseOrderStatus;
  expectedDeliveryDate?: string;
  remarks?: string;
  totalAmount?: number;
}

export function parsePurchaseOrder(raw: Raw): PurchaseOrder {
  return {
    id: raw.id,
    poNumber: raw.poNumber,
    vendorId: raw.vendorId,
    vendorName: raw.vendorName ?? '',
    indentId: raw.indentId ?? undefined,
    indentNumber: raw.indentNumber ?? undefined,
    projectId: raw.projectId ?? undefined,
    projectName: raw.projectName ?? undefined,
    status: raw.status as PurchaseOrderStatus,
    createdAt: raw.createdAt,
    createdBy:
      typeof raw.createdBy === 'string'
        ? { id: 0, name: raw.createdBy }
        : {
            id: raw.createdBy?.id ?? 0,
            name: raw.createdBy?.employeeName ?? raw.createdBy?.name ?? '',
          },
    expectedDeliveryDate: raw.expectedDeliveryDate ?? undefined,
    remarks: raw.remarks ?? undefined,
    totalAmount: raw.totalAmount ?? undefined,
    items: Array.isArray(raw.items)
      ? (raw.items as Raw[]).map((item) => parsePurchaseOrderItem(item))
      : [],
  };
}
