import { describe, expect, test } from 'bun:test';
import { ReversibleDocumentType } from '@tornotron/echno-core/document-reversals/types';
import { documentHref, documentLabel } from './lib';

describe('a reversal links back to the document it names', () => {
  test('each kind resolves to its own detail route', () => {
    expect(
      documentHref({
        documentType: ReversibleDocumentType.siteTransfer,
        documentId: 3,
      })
    ).toContain('/resources/transfers/3');
    expect(
      documentHref({
        documentType: ReversibleDocumentType.purchaseOrder,
        documentId: 4,
      })
    ).toContain('/resources/purchase-orders/4');
    expect(
      documentHref({
        documentType: ReversibleDocumentType.goodsReceivedNote,
        documentId: 5,
      })
    ).toContain('/resources/goods-receipts/5');
  });

  test('the label names the kind and the number', () => {
    expect(
      documentLabel({
        documentType: ReversibleDocumentType.goodsReceivedNote,
        documentNumber: 'GRN-2026-0018',
      })
    ).toBe('Goods received note GRN-2026-0018');
  });
});
