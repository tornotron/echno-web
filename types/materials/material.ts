import { parsePositiveInt } from '@/types/parse-id';
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

export function parseMaterial(raw: Raw): Material {
  return {
    id: parsePositiveInt(raw.id, 'parseMaterial.id'),
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
