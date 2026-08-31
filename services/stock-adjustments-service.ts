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
    submittedByName: raw.submittedByName ?? undefined,
    submittedAt: parseDate(raw.submittedAt ?? raw.createdAt),
    approvedBy: raw.approvedBy ?? undefined,
    approvedByName: raw.approvedByName ?? undefined,
    approvedAt: parseMaybeDate(raw.approvedAt),
    rejectedBy: raw.rejectedBy ?? undefined,
    rejectedByName: raw.rejectedByName ?? undefined,
    rejectedAt: parseMaybeDate(raw.rejectedAt),
    rejectionReason: raw.rejectionReason ?? undefined,
    processedBy: raw.processedBy ?? undefined,
    processedByName: raw.processedByName ?? undefined,
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
 * display strings and a counted quantity per line. `justification` is required
 * by the backend, so it falls back to the notes or a placeholder.
 *
 * The project, the storage location and each line's material are sent as ids,
 * because approval resolves the balance row from exactly those three. A
 * payload that omits the project produces a document that can be raised and
 * then never posted, which is how `SA-2026-4021` came to sit on staging with a
 * null `project_id`. The same applies on update: the backend replaces the
 * header wholesale, so a payload without `projectId` would clear the project
 * off a document that had one.
 *
 * `systemQuantity` and `adjustmentQuantity` are deliberately not sent.
 * echno-backend#658 made them the server's: `stampOpeningBalance` reads the
 * opening balance off the stock and recomputes the variance from it on every
 * write, and anything sent for them is discarded. Every line this form can
 * submit names a material and sits on a document naming a project, both being
 * required by `validateForm`, so there is no line here the server would leave
 * to the client. Sending a figure the receiver overwrites is how the form came
 * to carry a "Current Stock" box that did nothing.
 *
 * The money is still the client's, because nothing on the server derives it
 * (echno-backend#665). It is computed from `openingBalance`, the balance the
 * form read and displayed, and is omitted rather than guessed when that read
 * was not available: a missing figure is worth more than one built on an
 * assumed empty shelf.
 */
export function toPayload(
  data: StockAdjustmentSubmitData
): Record<string, unknown> {
  const { form, items } = data;
  const variances = items.map((item) =>
    item.openingBalance === undefined
      ? undefined
      : item.countedStock - item.openingBalance
  );
  const lineItems = items.map((item, index) => {
    const variance = variances[index];
    return {
      materialId: item.materialId || undefined,
      description: item.description || undefined,
      physicalQuantity: item.countedStock,
      unit: item.unit || undefined,
      unitValue: item.unitCost,
      totalAdjustmentValue:
        variance === undefined ? undefined : variance * item.unitCost,
      reason: item.reason || form.adjustmentReason || undefined,
    };
  });
  // A total over lines whose variance is unknown would be the total of a
  // different document, so both totals stand down entirely rather than sum the
  // part they happen to know.
  const varianceKnown = variances.every((v) => v !== undefined);
  const totalAdjustmentValue = varianceKnown
    ? lineItems.reduce((sum, li) => sum + (li.totalAdjustmentValue ?? 0), 0)
    : undefined;
  const totalVarianceQuantity = varianceKnown
    ? variances.reduce((sum: number, v) => sum + (v ?? 0), 0)
    : undefined;
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
   * The other way off a draft is `reject`, which posts nothing.
   */
  async approve(id: number): Promise<StockAdjustment> {
    const raw = await api.post<Raw>(`${BASE}/${id}/approve`);
    return safeParseStockAdjustment(raw);
  },

  /**
   * Rejects the adjustment, recording who refused it, when and why.
   *
   * `POST /stock-adjustments/web/{id}/reject` takes `{ reason }` and nothing
   * else: the rejecter is read from the session, never the request. The reason
   * is `@NotBlank @Size(max = 500)`, so a blank or over-long one is a 400
   * before the service is reached; `rejectionReasonError` applies both rules in
   * the form so the user is not told by a failed request.
   *
   * Nothing reaches the stock ledger. That is why the rules differ from
   * `approve` in one way worth naming: **self-rejection is allowed**. The
   * segregation-of-duties rule is a second pair of eyes on the entry an
   * approval posts, and a rejection posts no entry, so the raiser may refuse
   * their own document. They can already delete it, which keeps no record at
   * all.
   *
   * The rejection is terminal: the document carries one `rejectedBy`, one
   * `rejectedAt` and one `rejectionReason`, so anything that reopened it would
   * overwrite the refusal that is the reason to reject rather than delete.
   * `requireNotRejected` sits on `update`, `delete`, `approve` and `reject`
   * itself, and `stockAdjustmentAmendmentGate` mirrors it on the screen.
   * Resubmission is a fresh draft.
   *
   * @param id - The adjustment to refuse.
   * @param reason - Why it is being refused. Sent as given, so trim it first.
   */
  async reject(id: number, reason: string): Promise<StockAdjustment> {
    const raw = await api.post<Raw>(`${BASE}/${id}/reject`, { reason });
    return safeParseStockAdjustment(raw);
  },
};
