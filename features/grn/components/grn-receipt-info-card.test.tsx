/**
 * The one thing a goods receipt cannot say for itself.
 *
 * Since echno-backend#659 a receipt that exceeds its order is refused unless
 * somebody looks at the figures and files it again on purpose, and the note
 * that comes back carries `overReceiptAcknowledged`. Nothing else on the
 * document records that decision: the quantities look like any other receipt's
 * unless you go and read the order they were judged against.
 *
 * Assertions are on strings and booleans, never on a rendered node: an
 * assertion that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import type { GoodsReceivedNote } from '@tornotron/echno-core/grn/types';
import { GRNReceiptInfoCard } from './grn-receipt-info-card';

function note(overReceiptAcknowledged: boolean): GoodsReceivedNote {
  return {
    id: 12,
    grnNumber: 'GRN-2026-000006',
    receivedOn: '2026-08-31',
    receivedBy: { id: 3, name: 'Asha' },
    vendorId: 9,
    vendorName: 'Acme Supplies',
    overReceiptAcknowledged,
    items: [],
  };
}

describe('a receipt that exceeded its order says so', () => {
  afterEach(() => {
    cleanup();
  });

  test('an acknowledged over-receipt is drawn on the document', () => {
    const { container } = render(
      createElement(GRNReceiptInfoCard, { grn: note(true) })
    );

    expect(container.textContent).toContain('Accepted over the order');
  });

  test('an ordinary receipt is not', () => {
    const { container } = render(
      createElement(GRNReceiptInfoCard, { grn: note(false) })
    );

    expect(container.textContent).not.toContain('Accepted over the order');
  });
});
