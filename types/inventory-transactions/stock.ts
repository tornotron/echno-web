// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

// ---------------------------------------------------------------------------
// StorageLocationStock — returned by GET /inventory-transactions/web/storage-location/{id}/stock
// Inverted view of MaterialStock: "what materials are at this location?"
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// LocationStock — used by MaterialStock (material-centric view)
// ---------------------------------------------------------------------------

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
