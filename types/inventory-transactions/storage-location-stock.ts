// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface LocationMaterialStock {
  materialId: number;
  materialName: string;
  unit: string;
  stock: number;
  stockValue: number;
}

export interface StorageLocationStock {
  storageLocationId: number;
  storageLocationName: string;
  projectId: number;
  materialStock: LocationMaterialStock[];
  totalStock: number;
  totalStockValue: number;
}

export function parseStorageLocationStock(raw: Raw): StorageLocationStock {
  const safeRaw = raw != null && typeof raw === 'object' ? raw : {};
  return {
    storageLocationId: safeRaw.storageLocationId ?? 0,
    storageLocationName: safeRaw.storageLocationName ?? '',
    projectId: safeRaw.projectId ?? 0,
    materialStock: Array.isArray(safeRaw.materialStock)
      ? safeRaw.materialStock.map((ms: Raw) => {
          const safeMs = ms != null && typeof ms === 'object' ? ms : {};
          return {
            materialId: safeMs.materialId ?? 0,
            materialName: safeMs.materialName ?? '',
            unit: safeMs.unit ?? '',
            stock: safeMs.stock ?? 0,
            stockValue: safeMs.stockValue ?? 0,
          };
        })
      : [],
    totalStock: safeRaw.totalStock ?? 0,
    totalStockValue: safeRaw.totalStockValue ?? 0,
  };
}
