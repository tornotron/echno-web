import { MaterialStatus } from './enum';

export interface UpdateMaterialRequest {
  materialName?: string;
  unit?: string;
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
  category?: string;
  status?: MaterialStatus;
  trend?: number[];
  ltc?: number;
}

export function updateMaterialToJson(
  dto: UpdateMaterialRequest
): Record<string, unknown> {
  return {
    ...(dto.materialName !== undefined && { materialName: dto.materialName }),
    ...(dto.unit !== undefined && { unit: dto.unit }),
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
    ...(dto.category !== undefined && { category: dto.category }),
    ...(dto.status !== undefined && { status: dto.status }),
    ...(dto.trend !== undefined && { trend: dto.trend }),
    ...(dto.ltc !== undefined && { ltc: dto.ltc }),
  };
}
