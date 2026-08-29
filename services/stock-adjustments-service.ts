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
    materialId: raw.materialId ?? undefined,
    materialName: raw.materialName ?? undefined,
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
    locationName: raw.locationName ?? undefined,
    projectId: raw.projectId ?? undefined,
    projectName: raw.projectName ?? undefined,
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
 * `StockAdjustmentCreationDto`. The form collects the type and reason as
 * display strings and per-line current/counted quantities; the line
 * adjustment is `counted - current`. `justification` is required by the
 * backend, so it falls back to the notes or a placeholder.
 *
 * The project, the storage location and each line's material are sent as ids,
 * because approval resolves the balance row from exactly those three. A
 * payload that omits the project produces a document that can be raised and
 * then never posted, which is how `SA-2026-4021` came to sit on staging with a
 * null `project_id`. The same applies on update: the backend replaces the
 * header wholesale, so a payload without `projectId` would clear the project
 * off a document that had one.
 */
export function toPayload(data: StockAdjustmentSubmitData): Record<string, unknown> {
  const { form, items } = data;
  const lineItems = items.map((item) => {
    const adjustmentQuantity = item.countedStock - item.currentStock;
    return {
      materialId: item.materialId || undefined,
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
    projectId: form.projectId || undefined,
    locationId: form.storageLocationId || undefined,
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

  /**
   * Approves the adjustment and posts its lines to the stock ledger.
   *
   * `POST /stock-adjustments/web/{id}/approve` takes no body: the approver is
   * read from the session, which is also what the backend compares against the
   * raiser to refuse a self-approval. It is the only path that moves a stock
   * balance from the product, and it runs once, so an approved document is
   * frozen afterwards and a mistake is corrected by raising another adjustment.
   *
   * The refusals it can return are 400s carrying the reason: the document is
   * already posted, the approver raised it and does not hold `system-admin`,
   * it names no project, it has no lines, or a line has no material, no reason
   * or a quantity that would take a balance below zero. `stockAdjustmentApprovalGate`
   * screens the ones the client can see before the request goes out; the server
   * stays the authority on the rest.
   *
   * There is deliberately no `reject` here. The document carries `rejectedBy`,
   * `rejectedAt` and `rejectionReason` and the detail screen shows them, but no
   * backend endpoint writes them, so there is nothing for a client to call.
   */
  async approve(id: number): Promise<StockAdjustment> {
    const raw = await api.post<Raw>(`${BASE}/${id}/approve`);
    return safeParseStockAdjustment(raw);
  },
};
