// types/materials/index.ts

import { Employee, parseEmployee } from '@/types/employee';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface Material {
  id: number;
  sku?: string;
  materialName: string;
  unit: string;
  description?: string;
  hsn?: string;
  currentStock?: number;
  stockValue?: number;
  openingStock?: number;
  storageLocationId?: number;
  projectId?: number;
  moq?: number;
  minStock?: number;
  maxStock?: number;
  safetyStock?: number;
  reorderLevel?: number;
  createdBy?: Employee;
}

export interface MaterialStock extends Material {
  currentStock: number;
}

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

export interface CreateMaterialInput {
  sku?: string;
  materialName: string;
  unit: string;
  createdBy: number;
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

export interface CreateMaterialConsumptionInput {
  consumptionDate: string;
  materialId: number;
  quantity: number;
  consumptionType: ConsumptionType;
  details?: string;
  projectId?: number;
  storageLocationId?: number;
  taskId?: number;
  createdBy: number;
}

export function parseMaterial(raw: Raw): Material {
  return {
    id: raw.id,
    sku: raw.sku ?? undefined,
    materialName: raw.materialName,
    unit: raw.unit,
    description: raw.description ?? undefined,
    hsn: raw.hsn ?? undefined,
    currentStock: raw.currentStock ?? undefined,
    stockValue: raw.stockValue ?? undefined,
    openingStock: raw.openingStock ?? undefined,
    storageLocationId: raw.storageLocationId ?? undefined,
    projectId: raw.projectId ?? undefined,
    moq: raw.moq ?? undefined,
    minStock: raw.minStock ?? undefined,
    maxStock: raw.maxStock ?? undefined,
    safetyStock: raw.safetyStock ?? undefined,
    reorderLevel: raw.reorderLevel ?? undefined,
    createdBy: raw.createdBy ? parseEmployee(raw.createdBy) : undefined,
  };
}

export function parseMaterialWithStock(raw: Raw): MaterialStock {
  return {
    ...parseMaterial(raw),
    currentStock: raw.currentStock ?? 0,
  };
}

export function parseMaterialConsumption(raw: Raw): MaterialConsumption {
  return {
    id: raw.id,
    consumptionDate: raw.consumptionDate,
    materialId: raw.materialId,
    materialName: raw.materialName,
    quantity: raw.quantity,
    consumptionType: raw.consumptionType as ConsumptionType,
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
