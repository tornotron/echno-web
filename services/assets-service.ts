import { ApiError, api } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import type {
  Asset,
  AssetStatus,
  AssetCondition,
  AssetType,
} from '@/types/resource';
import type { AssetFormData } from '@/features/assets/components/asset-form';

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

export function parseAsset(raw: Raw): Asset {
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

const BASE = '/assets/web';

const text = (v: string): string | undefined => (v.trim() === '' ? undefined : v);
const number = (v: string): number | undefined =>
  v.trim() === '' ? undefined : Number(v);

/**
 * Maps the (all-string) asset form to the backend `AssetCreationDto` JSON.
 * Empty fields are dropped; `condition` is sent as-is (the backend accepts it
 * via `@JsonAlias` onto `assetCondition`); `currentValue` defaults to the
 * purchase price on create.
 */
export function formToPayload(form: AssetFormData): Record<string, unknown> {
  const purchasePrice = number(form.purchasePrice);
  return {
    name: form.name,
    description: text(form.description),
    type: text(form.type),
    category: text(form.category),
    status: form.status,
    condition: form.condition,
    locationId: number(form.locationId),
    assignedTo: text(form.assignedTo),
    assignedProject: text(form.assignedProject),
    purchaseDate: text(form.purchaseDate),
    purchasePrice,
    currentValue: purchasePrice,
    depreciationRate: number(form.depreciationRate),
    manufacturer: text(form.manufacturer),
    model: text(form.model),
    serialNumber: text(form.serialNumber),
    registrationNumber: text(form.registrationNumber),
    warrantyExpiry: text(form.warrantyExpiry),
    maintenanceSchedule: text(form.maintenanceSchedule),
    usageHours: number(form.usageHours),
    maxUsageHours: number(form.maxUsageHours),
    lastMaintenanceDate: text(form.lastMaintenanceDate),
    nextMaintenanceDate: text(form.nextMaintenanceDate),
    fuelType: text(form.fuelType),
    insuranceProvider: text(form.insuranceProvider),
    policyNumber: text(form.policyNumber),
    insuranceExpiry: text(form.insuranceExpiry),
    notes: text(form.notes),
  };
}

/** Backend-backed asset register (`/api/v1/assets/web`). */
export const assetsService = {
  async getAll(): Promise<Asset[]> {
    const data = await api.get<Raw>(BASE);
    const rows: Raw[] = Array.isArray(data) ? data : (data?.content ?? []);
    try {
      return rows.map((row) => parseAsset(row));
    } catch (error) {
      logger.error('Failed to parse assets:', error);
      throw new ApiError('Failed to process asset data. Please try again.', 422);
    }
  },

  async getById(id: number): Promise<Asset> {
    const data = await api.get<Raw>(`${BASE}/${id}`);
    return parseAsset(data);
  },

  async create(form: AssetFormData): Promise<Asset> {
    const data = await api.post<Raw>(BASE, formToPayload(form));
    return parseAsset(data);
  },

  async update(id: number, form: AssetFormData): Promise<Asset> {
    const data = await api.put<Raw>(`${BASE}/${id}`, formToPayload(form));
    return parseAsset(data);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },
};
