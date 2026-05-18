import { ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { mockStockAdjustments } from '@/components/shared/mock-data';
import type {
  StockAdjustment,
  StockAdjustmentLineItem,
  StockAdjustmentType,
  StockAdjustmentStatus,
  StockAdjustmentReason,
} from '@/types/resource';

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

function parseLineItem(raw: Raw): StockAdjustmentLineItem {
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

function parseStockAdjustment(raw: Raw): StockAdjustment {
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

// TODO: Replace mock data with real API calls once the stock-adjustments backend is available.
//   getAll:  api.get<Raw[]>('/stock-adjustments/web')
//   getById: api.get<Raw>(`/stock-adjustments/web/${id}`)
export const stockAdjustmentsService = {
  async getAll(): Promise<StockAdjustment[]> {
    return mockStockAdjustments.map((raw) => safeParseStockAdjustment(raw));
  },

  async getById(id: number): Promise<StockAdjustment> {
    const raw = mockStockAdjustments.find((a) => a.id === id);
    if (!raw) throw new ApiError(`Stock adjustment ${id} not found.`, 404);
    return safeParseStockAdjustment(raw);
  },
};
