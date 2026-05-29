import { parsePositiveInt } from '@/types/parse-id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export enum ConsumptionType {
  usedFromStock = 'USED_FROM_STOCK',
  transferred = 'TRANSFERRED',
}

export const consumptionTypeLabels: Record<ConsumptionType, string> = {
  [ConsumptionType.usedFromStock]: 'Used from Stock',
  [ConsumptionType.transferred]: 'Transferred',
};

export interface MaterialConsumption {
  id: number;
  consumptionDate: string;
  materialId: number;
  materialName: string;
  quantity: number;
  consumptionType: ConsumptionType;
  details?: string;
  projectId?: number;
  projectName?: string;
  storageLocationId?: number;
  storageLocationName?: string;
  taskId?: number;
  taskTitle?: string;
  createdBy: { id: number; name: string };
}

export function parseMaterialConsumption(raw: Raw): MaterialConsumption {
  return {
    id: parsePositiveInt(raw.id, 'parseMaterialConsumption.id'),
    consumptionDate: raw.consumptionDate,
    materialId: raw.materialId,
    materialName: raw.materialName,
    quantity: raw.quantity,
    consumptionType: Object.values(ConsumptionType).includes(
      raw.consumptionType
    )
      ? (raw.consumptionType as ConsumptionType)
      : ConsumptionType.usedFromStock,
    details: raw.details ?? undefined,
    projectId: raw.projectId ?? undefined,
    projectName: raw.projectName ?? undefined,
    storageLocationId: raw.storageLocationId ?? undefined,
    storageLocationName: raw.storageLocationName ?? undefined,
    taskId: raw.taskId ?? undefined,
    taskTitle: raw.taskTitle ?? undefined,
    createdBy: {
      id: raw.createdBy?.id ?? 0,
      name: raw.createdBy?.employeeName ?? raw.createdBy?.name ?? '',
    },
  };
}
