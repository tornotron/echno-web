import { ConsumptionType } from './material-consumption';

export interface CreateMaterialConsumptionRequest {
  consumptionDate: string;
  materialId: number;
  quantity: number;
  consumptionType: ConsumptionType;
  createdBy: number;
  details?: string;
  projectId?: number;
  storageLocationId?: number;
  taskId?: number;
}

export function createMaterialConsumptionToJson(
  dto: CreateMaterialConsumptionRequest
): Record<string, unknown> {
  return {
    consumptionDate: dto.consumptionDate,
    materialId: dto.materialId,
    quantity: dto.quantity,
    consumptionType: dto.consumptionType,
    createdBy: dto.createdBy,
    ...(dto.details !== undefined && { details: dto.details }),
    ...(dto.projectId !== undefined && { projectId: dto.projectId }),
    ...(dto.storageLocationId !== undefined && {
      storageLocationId: dto.storageLocationId,
    }),
    ...(dto.taskId !== undefined && { taskId: dto.taskId }),
  };
}
