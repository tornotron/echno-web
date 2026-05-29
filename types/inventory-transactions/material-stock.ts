// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface LocationStock {
  storageLocationId: number;
  storageLocationName: string;
  projectId: number;
  projectName: string;
  stock: number;
  stockValue: number;
}

export interface MaterialStock {
  materialId: number;
  materialName: string;
  locationStock: LocationStock[];
  totalStock: number;
  totalStockValue: number;
}

export function parseMaterialStock(raw: Raw): MaterialStock {
  if (raw === null || typeof raw !== 'object') {
    throw new Error(`parseMaterialStock: expected object, got ${typeof raw}`);
  }
  return {
    materialId: Number(raw.materialId),
    materialName: raw.materialName ?? '',
    locationStock: Array.isArray(raw.locationStock)
      ? raw.locationStock.map((ls: Raw) => ({
          storageLocationId: Number(ls.storageLocationId),
          storageLocationName: ls.storageLocationName ?? '',
          projectId: Number(ls.projectId),
          projectName: ls.projectName ?? '',
          stock: Number(ls.stock ?? 0),
          stockValue: Number(ls.stockValue ?? 0),
        }))
      : [],
    totalStock: Number(raw.totalStock ?? 0),
    totalStockValue: Number(raw.totalStockValue ?? 0),
  };
}
