export interface CreateMaterialRequest {
  materialName: string;
  unit: string;
  createdBy: number;
  sku?: string;
  description?: string;
  hsn?: string;
  openingStock?: number | null;
  storageLocationId?: number | null;
  projectId?: number | null;
  moq?: number;
  minStock?: number;
  maxStock?: number;
  safetyStock?: number;
  reorderLevel?: number;
  unitCost?: number;
}

export function createMaterialToJson(
  dto: CreateMaterialRequest
): Record<string, unknown> {
  return {
    materialName: dto.materialName,
    unit: dto.unit,
    createdBy: dto.createdBy,
    ...(dto.sku !== undefined && { sku: dto.sku }),
    ...(dto.description !== undefined && { description: dto.description }),
    ...(dto.hsn !== undefined && { hsn: dto.hsn }),
    ...(dto.openingStock !== undefined && { openingStock: dto.openingStock }),
    ...(dto.storageLocationId !== undefined && {
      storageLocationId: dto.storageLocationId,
    }),
    ...(dto.projectId !== undefined && { projectId: dto.projectId }),
    ...(dto.moq !== undefined && { moq: dto.moq }),
    ...(dto.minStock !== undefined && { minStock: dto.minStock }),
    ...(dto.maxStock !== undefined && { maxStock: dto.maxStock }),
    ...(dto.safetyStock !== undefined && { safetyStock: dto.safetyStock }),
    ...(dto.reorderLevel !== undefined && { reorderLevel: dto.reorderLevel }),
    ...(dto.unitCost !== undefined && { unitCost: dto.unitCost }),
  };
}
