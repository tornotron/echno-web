/**
 * How a transfer's asset lines read once it exists: on the transfer page, and
 * in the receiving site's form (ClickUp 86d45vjd0).
 *
 * An asset line is one machine, so it is shown apart from the material lines
 * with a state rather than figures, and it is received by ticking it rather
 * than by typing a quantity. What each test pins:
 *
 * - the card tests fail if asset lines are folded into the material table,
 *   where an asset reads as a nameless material with a quantity of 1;
 * - the receipt tests fail if an asset row goes out as anything but 1 when
 *   ticked and 0 when not, which the server reads as an over-receipt or as the
 *   asset arriving when nobody said it had.
 *
 * Assertions are on text and booleans, never on a rendered Radix node: an
 * assertion that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import {
  SiteTransferLineType,
  SiteTransferStatus,
  type SiteTransfer,
  type SiteTransferItem,
} from '@tornotron/echno-core/site-transfers/types';

import { SiteTransferItemsCard } from './site-transfer-items-card';
import { ReceiveTransferDialog } from './receive-transfer-dialog';

afterEach(() => {
  cleanup();
});

function materialLine(
  overrides: Partial<SiteTransferItem> = {}
): SiteTransferItem {
  return {
    id: 84,
    lineType: SiteTransferLineType.material,
    materialId: 21,
    materialName: 'Cement',
    assetId: null,
    assetCode: null,
    assetName: null,
    sentQuantity: 10,
    receivedQuantity: null,
    inTransitQuantity: 10,
    ...overrides,
  };
}

function assetLine(
  overrides: Partial<SiteTransferItem> = {}
): SiteTransferItem {
  return {
    id: 85,
    lineType: SiteTransferLineType.asset,
    materialId: null,
    materialName: null,
    assetId: 12,
    assetCode: 'AST-0021',
    assetName: 'JCB Backhoe',
    sentQuantity: 1,
    receivedQuantity: null,
    inTransitQuantity: 1,
    ...overrides,
  };
}

function transfer(
  items: SiteTransferItem[],
  status = SiteTransferStatus.pending
): SiteTransfer {
  return {
    id: 7,
    transferNumber: 'TRF-2026-000007',
    issueDate: '2026-09-28',
    sendingProjectId: 2,
    sendingProjectName: 'Central Yard',
    receivingProjectId: 6,
    receivingProjectName: 'Silver Oak',
    status,
    items,
  } as unknown as SiteTransfer;
}

describe('the transfer page shows asset lines apart from materials', () => {
  test('an in-transit asset reads as in transit, under its own heading', () => {
    const { container } = render(
      <SiteTransferItemsCard
        transfer={transfer([materialLine(), assetLine()])}
      />
    );

    const assets = container.querySelector(
      '[data-testid="transfer-asset-lines"]'
    );
    expect(assets === null).toBe(false);
    expect(assets?.textContent).toContain('AST-0021 · JCB Backhoe');
    expect(assets?.textContent).toContain('In transit');
    expect(assets?.textContent).not.toContain('Cement');
    expect(container.textContent).toContain('Materials');
  });

  test('an asset that was received reads as arrived and links to the asset', () => {
    const { container } = render(
      <SiteTransferItemsCard
        transfer={transfer(
          [assetLine({ receivedQuantity: 1, inTransitQuantity: 0 })],
          SiteTransferStatus.completed
        )}
      />
    );

    expect(container.textContent).toContain('Arrived');
    const link = container.querySelector('a[href*="/assets/12"]');
    expect(link === null).toBe(false);
    // An asset-only transfer shows no empty material table.
    expect(container.textContent).not.toContain('No items');
  });
});

function recordDelivery() {
  const button = [...document.body.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Record delivery')
  ) as HTMLButtonElement;
  fireEvent.click(button);
}

describe('the receiving site ticks each asset that arrived', () => {
  function renderReceipt(items: SiteTransferItem[]) {
    const onFile = mock((..._args: unknown[]) => {});
    render(
      <ReceiveTransferDialog
        open
        onOpenChange={() => {}}
        transfer={transfer(items)}
        onFile={onFile}
        isPending={false}
      />
    );
    return onFile;
  }

  test('an asset in transit is ticked by default and goes out as 1', () => {
    const onFile = renderReceipt([materialLine(), assetLine()]);
    const box = document.body.querySelector('#received-85') as HTMLInputElement;
    expect(box.type).toBe('checkbox');
    expect(box.checked).toBe(true);

    recordDelivery();

    const receipt = onFile.mock.calls[0][0] as {
      items: Array<{ itemId: number; receivedQuantity: number }>;
    };
    expect(receipt.items).toEqual([
      { itemId: 84, receivedQuantity: 10 },
      { itemId: 85, receivedQuantity: 1 },
    ]);
  });

  test('an asset left unticked goes out as 0 and stays in transit', () => {
    const onFile = renderReceipt([assetLine()]);
    fireEvent.click(
      document.body.querySelector('#received-85') as HTMLInputElement
    );

    recordDelivery();

    const receipt = onFile.mock.calls[0][0] as {
      items: Array<{ itemId: number; receivedQuantity: number }>;
    };
    expect(receipt.items).toEqual([{ itemId: 85, receivedQuantity: 0 }]);
  });

  test('an asset already received cannot be ticked again', () => {
    renderReceipt([assetLine({ receivedQuantity: 1, inTransitQuantity: 0 })]);
    const box = document.body.querySelector('#received-85') as HTMLInputElement;
    expect(box.checked).toBe(false);
    expect(box.disabled).toBe(true);
  });
});
