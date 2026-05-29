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
  return {
    materialId: raw.materialId,
    materialName: raw.materialName ?? '',
    locationStock: (raw.locationStock ?? []).map((ls: Raw) => ({
      storageLocationId: ls.storageLocationId,
      storageLocationName: ls.storageLocationName ?? '',
      projectId: ls.projectId,
      projectName: ls.projectName ?? '',
      stock: ls.stock ?? 0,
      stockValue: ls.stockValue ?? 0,
    })),
    totalStock: raw.totalStock ?? 0,
    totalStockValue: raw.totalStockValue ?? 0,
  };
}
