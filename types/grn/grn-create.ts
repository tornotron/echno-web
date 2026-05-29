import { CreateGrnItemRequest } from './grn-item-create';

export interface CreateGrnRequest {
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
  items: CreateGrnItemRequest[];
}

export function createGrnToJson(
  dto: CreateGrnRequest
): Record<string, unknown> {
  return {
    grnNumber: dto.grnNumber,
    receivedOn: dto.receivedOn,
    receivedByEmployeeId: dto.receivedByEmployeeId,
    vendorId: dto.vendorId,
    ...(dto.purchaseOrderId !== undefined && {
      purchaseOrderId: dto.purchaseOrderId,
    }),
    ...(dto.projectId !== undefined && { projectId: dto.projectId }),
    ...(dto.storageLocationId !== undefined && {
      storageLocationId: dto.storageLocationId,
    }),
    ...(dto.deliveryChallanNumber !== undefined && {
      deliveryChallanNumber: dto.deliveryChallanNumber,
    }),
    ...(dto.invoiceNumber !== undefined && {
      invoiceNumber: dto.invoiceNumber,
    }),
    ...(dto.invoiceAmount !== undefined && {
      invoiceAmount: dto.invoiceAmount,
    }),
    items: dto.items.map((item: CreateGrnItemRequest) => ({
      materialId: item.materialId,
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity,
      ...(item.unitCost !== undefined && { unitCost: item.unitCost }),
    })),
  };
}

export { type CreateGrnItemRequest } from './grn-item-create';
