import type { StockAdjustmentSourceDocumentType } from '@/types/resource';

export const stockAdjustmentKeys = {
  all: ['stock-adjustments'] as const,
  lists: () => [...stockAdjustmentKeys.all, 'list'] as const,
  detail: (id: number) => [...stockAdjustmentKeys.all, 'detail', id] as const,
  /**
   * Every by-source-document lookup, as one namespace to invalidate.
   *
   * The mutations drop this alongside `lists()` rather than instead of it. An
   * adjustment that closes a transfer's variance is raised, approved and
   * rejected on the stock-adjustment screens, and the place it has to appear is
   * the transfer, which holds a different query.
   */
  bySourceDocuments: () =>
    [...stockAdjustmentKeys.all, 'by-source-document'] as const,
  /** The adjustments raised against one source document. */
  bySourceDocument: (type: StockAdjustmentSourceDocumentType, id: number) =>
    [...stockAdjustmentKeys.bySourceDocuments(), type, id] as const,
};
