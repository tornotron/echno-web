import { ApiError, api } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import type {
  StockAdjustment,
  StockAdjustmentLineItem,
  StockAdjustmentType,
  StockAdjustmentStatus,
  StockAdjustmentReason,
} from '@/types/resource';
import type { StockAdjustmentSubmitData } from '@/features/stock-adjustments/components/stock-adjustment-form';

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

export function parseLineItem(raw: Raw): StockAdjustmentLineItem {
  return {
    id: raw.id ?? 0,
    inventoryItemId: raw.inventoryItemId ?? undefined,
    assetId: raw.assetId ?? undefined,
    description: raw.description ?? '',
    systemQuantity: raw.systemQuantity ?? 0,
    physicalQuantity: raw.physicalQuantity ?? 0,
    adjustmentQuantity: raw.adjustmentQuantity ?? 0,
    unit: raw.unit ?? '',
    unitValue: raw.unitValue ?? 0,
    totalAdjustmentValue: raw.totalAdjustmentValue ?? 0,
    reason: (raw.reason ?? 'other') as StockAdjustmentReason,
    reasonDetails: raw.reasonDetails ?? undefined,
    locationId: raw.locationId ?? 0,
    binLocation: raw.binLocation ?? undefined,
    notes: raw.notes ?? undefined,
  };
}

export function parseStockAdjustment(raw: Raw): StockAdjustment {
  if (!raw?.id) {
    throw new Error(`Invalid StockAdjustment data: missing id`);
  }
  return {
    id: raw.id,
    adjustmentNumber: raw.adjustmentNumber ?? String(raw.id),
    type: (raw.type ?? 'correction') as StockAdjustmentType,
    status: (raw.status ?? 'draft') as StockAdjustmentStatus,
    locationId: raw.locationId ?? undefined,
    projectId: raw.projectId ?? undefined,
    organizationId: raw.organizationId ?? undefined,
    adjustmentDate: parseDate(raw.adjustmentDate),
    effectiveDate: parseDate(raw.effectiveDate ?? raw.adjustmentDate),
    lineItems: Array.isArray(raw.lineItems)
      ? raw.lineItems.map((item: Raw) => parseLineItem(item))
      : [],
    totalAdjustmentValue: raw.totalAdjustmentValue ?? 0,
    primaryReason: (raw.primaryReason ?? 'other') as StockAdjustmentReason,
    justification: raw.justification ?? '',
    physicalCountDate: parseMaybeDate(raw.physicalCountDate),
    physicalCountBy: raw.physicalCountBy ?? undefined,
    countMethod: raw.countMethod ?? undefined,
    submittedBy: raw.submittedBy ?? 0,
    submittedAt: parseDate(raw.submittedAt ?? raw.createdAt),
    approvedBy: raw.approvedBy ?? undefined,
    approvedAt: parseMaybeDate(raw.approvedAt),
    rejectedBy: raw.rejectedBy ?? undefined,
    rejectedAt: parseMaybeDate(raw.rejectedAt),
    rejectionReason: raw.rejectionReason ?? undefined,
    processedBy: raw.processedBy ?? undefined,
    processedAt: parseMaybeDate(raw.processedAt),
    totalVarianceQuantity: raw.totalVarianceQuantity ?? 0,
    totalVarianceValue: raw.totalVarianceValue ?? 0,
    variancePercentage: raw.variancePercentage ?? 0,
    isSignificantVariance: raw.isSignificantVariance ?? false,
    originType: raw.originType ?? undefined,
    originId: raw.originId ?? undefined,
    transferId: raw.transferId ?? undefined,
    purchaseOrderId: raw.purchaseOrderId ?? undefined,
    goodsReceiptId: raw.goodsReceiptId ?? undefined,
    invoiceId: raw.invoiceId ?? undefined,
    expenseId: raw.expenseId ?? undefined,
    isFinanciallyProcessed: raw.isFinanciallyProcessed ?? false,
    costImpact: raw.costImpact ?? 0,
    affectsCogsImmediately: raw.affectsCogsImmediately ?? false,
    requiresPhotos: raw.requiresPhotos ?? false,
    photos: raw.photos ?? undefined,
    supportingDocuments: raw.supportingDocuments ?? undefined,
    affectsFinancials: raw.affectsFinancials ?? false,
    accountingEntryId: raw.accountingEntryId ?? undefined,
    notes: raw.notes ?? undefined,
    internalNotes: raw.internalNotes ?? undefined,
    tags: raw.tags ?? undefined,
    createdBy: raw.createdBy ?? 0,
    createdAt: parseDate(raw.createdAt),
    updatedAt: parseDate(raw.updatedAt),
  };
}

function safeParseStockAdjustment(raw: Raw): StockAdjustment {
  try {
    return parseStockAdjustment(raw);
  } catch (error) {
    logger.error('Failed to parse stock adjustment:', error);
    throw new ApiError('Failed to process stock adjustment data.', 422);
  }
}

const BASE = '/stock-adjustments/web';

/**
 * Maps the adjustment form (header + line items) to the backend
 * `StockAdjustmentCreationDto`. The form collects display strings for
 * type/reason/location and per-line current/counted quantities; the line
 * adjustment is `counted - current`. `justification` is required by the
 * backend, so it falls back to the notes or a placeholder.
 */
export function toPayload(data: StockAdjustmentSubmitData): Record<string, unknown> {
  const { form, items } = data;
  const lineItems = items.map((item) => {
    const adjustmentQuantity = item.countedStock - item.currentStock;
    return {
      description: item.description || undefined,
      systemQuantity: item.currentStock,
      physicalQuantity: item.countedStock,
      adjustmentQuantity,
      unit: item.unit || undefined,
      unitValue: item.unitCost,
      totalAdjustmentValue: adjustmentQuantity * item.unitCost,
      reason: item.reason || form.adjustmentReason || undefined,
    };
  });
  const totalAdjustmentValue = lineItems.reduce(
    (sum, li) => sum + (li.totalAdjustmentValue ?? 0),
    0
  );
  const totalVarianceQuantity = lineItems.reduce(
    (sum, li) => sum + (li.adjustmentQuantity ?? 0),
    0
  );
  return {
    adjustmentNumber: form.adjustmentNumber || undefined,
    type: form.adjustmentType || undefined,
    status: 'draft',
    adjustmentDate: form.adjustmentDate || undefined,
    effectiveDate: form.adjustmentDate || undefined,
    primaryReason: form.adjustmentReason || undefined,
    justification: form.notes || 'Stock adjustment',
    notes: form.notes || undefined,
    totalAdjustmentValue,
    totalVarianceQuantity,
    lineItems,
  };
}

/** Backend-backed stock adjustments (`/api/v1/stock-adjustments/web`). */
export const stockAdjustmentsService = {
  async getAll(): Promise<StockAdjustment[]> {
    const data = await api.get<Raw>(BASE);
    const rows: Raw[] = Array.isArray(data) ? data : (data?.content ?? []);
    return rows.map((raw) => safeParseStockAdjustment(raw));
  },

  async getById(id: number): Promise<StockAdjustment> {
    const raw = await api.get<Raw>(`${BASE}/${id}`);
    return safeParseStockAdjustment(raw);
  },

  async create(data: StockAdjustmentSubmitData): Promise<StockAdjustment> {
    const raw = await api.post<Raw>(BASE, toPayload(data));
    return safeParseStockAdjustment(raw);
  },

  async update(
    id: number,
    data: StockAdjustmentSubmitData
  ): Promise<StockAdjustment> {
    const raw = await api.put<Raw>(`${BASE}/${id}`, toPayload(data));
    return safeParseStockAdjustment(raw);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },
};
