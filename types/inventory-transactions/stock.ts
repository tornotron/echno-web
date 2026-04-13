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
  return {
    storageLocationId: raw.storageLocationId,
    storageLocationName: raw.storageLocationName ?? '',
    projectId: raw.projectId,
    materialStock: (raw.materialStock ?? []).map((ms: Raw) => ({
      materialId: ms.materialId,
      materialName: ms.materialName ?? '',
      unit: ms.unit ?? '',
      stock: ms.stock ?? 0,
      stockValue: ms.stockValue ?? 0,
    })),
    totalStock: raw.totalStock ?? 0,
    totalStockValue: raw.totalStockValue ?? 0,
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
