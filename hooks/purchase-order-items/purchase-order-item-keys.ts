export const poItemKeys = {
  all: ['purchase-order-items'] as const,
  detail: (id: number) => [...poItemKeys.all, 'detail', id] as const,
  byPO: (purchaseOrderId: number) =>
    [...poItemKeys.all, 'purchase-order', purchaseOrderId] as const,
  byMaterial: (materialId: number) =>
    [...poItemKeys.all, 'material', materialId] as const,
};
