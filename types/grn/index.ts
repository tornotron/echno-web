// types/grn/index.ts

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface GrnItem {
  id: number;
  materialId: number;
  materialName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost?: number;
}

export interface GoodsReceivedNote {
  id: number;
  grnNumber: string;
  receivedOn: string;
  receivedBy: { id: number; name: string };
  vendorId: number;
  vendorName: string;
  purchaseOrderId?: number;
  purchaseOrderNumber?: string;
  projectId?: number;
  projectName?: string;
  storageLocationId?: number;
  storageLocationName?: string;
  deliveryChallanNumber?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  items: GrnItem[];
}

export interface GrnItemCreateDto {
  materialId: number;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost?: number;
}

export interface CreateGrnInput {
  grnNumber: string;
  receivedOn: string;
  receivedByEmployeeId: number;
  vendorId: number;
  purchaseOrderId?: number;
  projectId?: number;
  storageLocationId?: number;
  deliveryChallanNumber?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  items: GrnItemCreateDto[];
}

export function parseGrnItem(raw: Raw): GrnItem {
  return {
    id: raw.id,
    materialId: raw.materialId,
    materialName: raw.materialName ?? '',
    orderedQuantity: raw.orderedQuantity,
    receivedQuantity: raw.receivedQuantity,
    unitCost: raw.unitCost ?? undefined,
  };
}

export function parseGoodsReceivedNote(raw: Raw): GoodsReceivedNote {
  return {
    id: raw.id,
    grnNumber: raw.grnNumber,
    receivedOn: raw.receivedOn,
    receivedBy: {
      id: raw.receivedBy?.id ?? 0,
      name: raw.receivedBy?.employeeName ?? raw.receivedBy?.name ?? '',
    },
    vendorId: raw.vendorId,
    vendorName: raw.vendorName ?? '',
    purchaseOrderId: raw.purchaseOrderId ?? undefined,
    purchaseOrderNumber: raw.purchaseOrderNumber ?? undefined,
    projectId: raw.projectId ?? undefined,
    projectName: raw.projectName ?? undefined,
    storageLocationId: raw.storageLocationId ?? undefined,
    storageLocationName: raw.storageLocationName ?? undefined,
    deliveryChallanNumber: raw.deliveryChallanNumber ?? undefined,
    invoiceNumber: raw.invoiceNumber ?? undefined,
    invoiceAmount: raw.invoiceAmount ?? undefined,
    items: Array.isArray(raw.items)
      ? (raw.items as Raw[]).map((item) => parseGrnItem(item))
      : [],
  };
}
