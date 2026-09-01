/**
 * Which actions a transfer offers, and why a within-project one offers none.
 *
 * echno-backend#660 made the two-step document conditional on crossing a site
 * boundary. A transfer between two stores on one project has both legs written
 * at creation, arrives `COMPLETED`, and is refused by both the receive and the
 * cancel endpoints. A screen that offered either would offer a button whose
 * only outcome is a 400.
 *
 * The cancel guard is the one worth reading twice: a `PARTIALLY_TRANSFERRED`
 * transfer is plainly unfinished, and offering to cancel it is the intuitive
 * thing to do. The server refuses, because part of the material is standing at
 * the far site and reversing the whole outbound leg would claim it came back.
 *
 * Delete `crossesProjectBoundary`'s comparison and every "one project" test
 * below fails. Delete the `PENDING`-only condition in `canCancel` and the
 * partially-received test fails.
 */
import { describe, expect, test } from 'bun:test';

import {
  canCancel,
  canReceive,
  crossesProjectBoundary,
  totalInTransit,
} from './site-transfer-legs';
import { SiteTransferStatus } from '@tornotron/echno-core/site-transfers/types';
import type { SiteTransfer } from '@tornotron/echno-core/site-transfers/types';

/** A transfer with the fields these predicates read. */
function transfer(over: Partial<SiteTransfer> = {}): SiteTransfer {
  return {
    id: 7,
    transferNumber: 'TRF-2026-000001',
    issueDate: '2026-01-17',
    sendingPerson: { id: 3, name: 'Hrishi' },
    sendingProjectId: 2,
    receivingProjectId: 6,
    status: SiteTransferStatus.pending,
    items: [
      {
        id: 84,
        materialId: 21,
        materialName: 'TNT Steel',
        sentQuantity: 10,
        receivedQuantity: null,
        inTransitQuantity: 10,
      },
    ],
    ...over,
  };
}

describe('whether the transfer left the site at all', () => {
  test('two different projects means a lorry, a road and a gap', () => {
    expect(crossesProjectBoundary(transfer())).toBe(true);
  });

  test('two stores on one project never leaves that site custody', () => {
    expect(
      crossesProjectBoundary(
        transfer({ sendingProjectId: 2, receivingProjectId: 2 })
      )
    ).toBe(false);
  });

  test('a missing project id is treated as not crossing, so nothing is offered', () => {
    expect(
      crossesProjectBoundary(transfer({ receivingProjectId: undefined }))
    ).toBe(false);
  });
});

describe('when a delivery can still be recorded', () => {
  test('a pending cross-project transfer is waiting for one', () => {
    expect(canReceive(transfer())).toBe(true);
  });

  test('a partly received one can take a second delivery', () => {
    expect(
      canReceive(
        transfer({ status: SiteTransferStatus.partiallyTransferred })
      )
    ).toBe(true);
  });

  test('a completed one has nothing left to confirm', () => {
    expect(canReceive(transfer({ status: SiteTransferStatus.completed }))).toBe(
      false
    );
  });

  test('a cancelled one was never delivered', () => {
    expect(canReceive(transfer({ status: SiteTransferStatus.cancelled }))).toBe(
      false
    );
  });

  test('a within-project transfer arrived as it was created', () => {
    // Offering to receive this would offer an act with nothing to confirm.
    expect(
      canReceive(
        transfer({
          sendingProjectId: 2,
          receivingProjectId: 2,
          status: SiteTransferStatus.completed,
        })
      )
    ).toBe(false);
  });
});

describe('when a transfer can still be abandoned', () => {
  test('a pending one can be cancelled and the stock returned', () => {
    expect(canCancel(transfer())).toBe(true);
  });

  test('a partly received one cannot, even though it is unfinished', () => {
    // Part of the material is standing at the far site. Reversing the whole
    // outbound leg would claim it came back.
    expect(
      canCancel(transfer({ status: SiteTransferStatus.partiallyTransferred }))
    ).toBe(false);
  });

  test('a completed one cannot', () => {
    expect(canCancel(transfer({ status: SiteTransferStatus.completed }))).toBe(
      false
    );
  });

  test('a within-project transfer cannot', () => {
    expect(
      canCancel(transfer({ sendingProjectId: 2, receivingProjectId: 2 }))
    ).toBe(false);
  });
});

describe('what is unaccounted for', () => {
  test('a line nobody has confirmed has all of it in transit', () => {
    expect(totalInTransit(transfer())).toBe(10);
  });

  test('a short delivery leaves the difference, and only the difference', () => {
    const short = transfer({
      status: SiteTransferStatus.completed,
      items: [
        {
          id: 84,
          materialId: 21,
          materialName: 'TNT Steel',
          sentQuantity: 10,
          receivedQuantity: 8,
          inTransitQuantity: 2,
        },
      ],
    });

    expect(totalInTransit(short)).toBe(2);
  });
});
