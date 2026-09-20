/**
 * Small helpers shared by the reversal screens.
 */
import { routes } from '@/nav';
import {
  ReversibleDocumentType,
  reversibleDocumentTypeLabels,
  type DocumentReversal,
} from '@tornotron/echno-core/document-reversals/types';

/** Where the document a reversal names lives. */
export function documentHref(
  reversal: Pick<DocumentReversal, 'documentType' | 'documentId'>
): string {
  switch (reversal.documentType) {
    case ReversibleDocumentType.siteTransfer: {
      return routes.resources.transfers.detail(reversal.documentId).href;
    }
    case ReversibleDocumentType.purchaseOrder: {
      return routes.resources.purchaseOrders.detail(reversal.documentId).href;
    }
    case ReversibleDocumentType.goodsReceivedNote: {
      return routes.resources.goodsReceipts.detail(reversal.documentId).href;
    }
  }
}

/** "Site transfer ST-0031" and the like. */
export function documentLabel(
  reversal: Pick<DocumentReversal, 'documentType' | 'documentNumber'>
): string {
  return `${reversibleDocumentTypeLabels[reversal.documentType]} ${reversal.documentNumber}`;
}
