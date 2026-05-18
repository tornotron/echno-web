import { ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import type {
  Asset,
  AssetStatus,
  AssetCondition,
  AssetType,
} from '@/types/resource';
import { mockAssets } from '@/components/shared/mock-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function parseDate(val: unknown): Date {
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return new Date();
}

function parseMaybeDate(val: unknown): Date | undefined {
  if (val == null) return undefined;
  return parseDate(val);
}

function parseLocation(raw: Raw): Asset['location'] {
  return {
    id: raw?.id ?? 0,
    name: raw?.name ?? raw?.locationName ?? '',
    type: raw?.type ?? raw?.locationType ?? 'other',
    address: raw?.address ?? undefined,
    capacity: raw?.capacity ?? undefined,
    organizationId: raw?.organizationId ?? 0,
    projectId: raw?.projectId ?? undefined,
    isActive: raw?.isActive ?? raw?.active ?? true,
  };
}

function parseAsset(raw: Raw): Asset {
  if (!raw?.id) {
    throw new Error(`Invalid Asset data: missing id`);
  }
  return {
    id: raw.id,
    assetId: raw.assetId ?? String(raw.id),
    name: raw.name ?? '',
    description: raw.description ?? '',
    type: (raw.type ?? 'other') as AssetType,
    category: raw.category ?? '',
    status: (raw.status ?? 'available') as AssetStatus,
    condition: (raw.condition ?? 'good') as AssetCondition,
    locationId: raw.locationId ?? 0,
    location: raw.location
      ? parseLocation(raw.location)
      : {
          id: raw.locationId ?? 0,
          name: '',
          type: 'other',
          organizationId: 0,
          isActive: true,
        },
    assignedTo: raw.assignedTo ?? undefined,
    assignedProject: raw.assignedProject ?? undefined,
    purchaseDate: parseDate(raw.purchaseDate),
    purchasePrice: raw.purchasePrice ?? 0,
    currentValue: raw.currentValue ?? 0,
    depreciationRate: raw.depreciationRate ?? 0,
    vendorId: raw.vendorId ?? undefined,
    manufacturer: raw.manufacturer ?? undefined,
    model: raw.model ?? undefined,
    serialNumber: raw.serialNumber ?? undefined,
    registrationNumber: raw.registrationNumber ?? undefined,
    warrantyExpiry: parseMaybeDate(raw.warrantyExpiry),
    lastMaintenanceDate: parseMaybeDate(raw.lastMaintenanceDate),
    nextMaintenanceDate: parseMaybeDate(raw.nextMaintenanceDate),
    maintenanceSchedule: raw.maintenanceSchedule ?? undefined,
    usageHours: raw.usageHours ?? undefined,
    maxUsageHours: raw.maxUsageHours ?? undefined,
    fuelType: raw.fuelType ?? undefined,
    insuranceExpiry: parseMaybeDate(raw.insuranceExpiry),
    insuranceProvider: raw.insuranceProvider ?? undefined,
    policyNumber: raw.policyNumber ?? undefined,
    specifications: raw.specifications ?? undefined,
    documents: raw.documents ?? undefined,
    notes: raw.notes ?? undefined,
    purchaseOrderId: raw.purchaseOrderId ?? undefined,
    invoiceId: raw.invoiceId ?? undefined,
    maintenanceExpenseIds: raw.maintenanceExpenseIds ?? [],
    createdAt: parseDate(raw.createdAt),
    updatedAt: parseDate(raw.updatedAt),
  };
}

// TODO: Replace mock data with real API calls once the assets backend is available.
//   getAll:  api.get<Raw[]>('/assets/web')
//   getById: api.get<Raw>(`/assets/web/${id}`)
export const assetsService = {
  async getAll(): Promise<Asset[]> {
    return mockAssets;
  },

  async getById(id: number): Promise<Asset> {
    const asset = mockAssets.find((a) => a.id === id);
    if (!asset) throw new ApiError(`Asset ${id} not found.`, 404);
    return asset;
  },
};
