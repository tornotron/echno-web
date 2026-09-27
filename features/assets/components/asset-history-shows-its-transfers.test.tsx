/**
 * The asset page's view of site transfers (ClickUp 86d45vjd0): the movement
 * history read from the asset's ledger, with each move made on a transfer
 * linked to it, and a notice while the asset is in transit.
 *
 * What each test pins:
 *
 * - the history tests fail if the card reads anything but the ledger, or drops
 *   the link from a move to the transfer it was made on;
 * - the empty and error tests fail if a failed read is shown as an asset that
 *   has never moved;
 * - the notice tests fail if an in-transit asset is shown as simply sitting at
 *   its sending site.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import type { Asset, AssetMovement } from '@/types/resource';

let movementsResult: {
  data?: { movements: AssetMovement[]; total: number };
  isLoading: boolean;
  isError: boolean;
} = { isLoading: false, isError: false };

mock.module('@/hooks/assets', () => ({
  useAssetMovements: () => movementsResult,
}));

const { AssetMovementHistory } = await import('./asset-movement-history');
const { AssetInTransitNotice } = await import('./asset-in-transit-notice');

afterEach(() => {
  cleanup();
});

const moved: AssetMovement = {
  id: 9,
  movementType: 'TRANSFER',
  fromProjectName: 'Central Yard',
  fromLocationName: 'Yard Store',
  toProjectName: 'Silver Oak',
  toLocationName: 'Site Store',
  movedAt: new Date('2026-09-20T10:00:00'),
  reason: 'Received on site transfer TRF-2026-000007 from Central Yard',
  referenceNumber: 'TRF-2026-000007',
  siteTransferId: 7,
};

const registered: AssetMovement = {
  id: 1,
  movementType: 'REGISTRATION',
  toProjectName: 'Central Yard',
  toLocationName: 'Yard Store',
  movedAt: new Date('2026-06-01T09:00:00'),
  reason: 'Asset registered',
};

describe('the movement history', () => {
  test('lists the ledger newest first and links a move to its transfer', () => {
    movementsResult = {
      data: { movements: [moved, registered], total: 2 },
      isLoading: false,
      isError: false,
    };
    const { container } = render(<AssetMovementHistory assetId={12} />);

    const entries = container.querySelectorAll(
      '[data-testid="asset-movement"]'
    );
    expect(entries.length).toBe(2);
    expect(entries[0].textContent).toContain('Central Yard, Yard Store');
    expect(entries[0].textContent).toContain('Silver Oak, Site Store');
    const link = entries[0].querySelector('a[href*="/transfers/7"]');
    expect(link?.textContent).toBe('TRF-2026-000007');
    expect(entries[1].textContent).toContain('Registered');
  });

  test('an asset with no entries says so', () => {
    movementsResult = {
      data: { movements: [], total: 0 },
      isLoading: false,
      isError: false,
    };
    const { container } = render(<AssetMovementHistory assetId={12} />);
    expect(container.textContent).toContain('No movements recorded yet.');
  });

  test('a failed read is an error, not an empty history', () => {
    movementsResult = { isLoading: false, isError: true };
    const { container } = render(<AssetMovementHistory assetId={12} />);
    expect(container.textContent).toContain('Could not load');
    expect(container.textContent).not.toContain('No movements recorded yet.');
  });
});

describe('the in-transit notice', () => {
  const asset = { id: 12, name: 'JCB Backhoe' } as Asset;

  test('names and links the transfer the asset is on', () => {
    const { container } = render(
      <AssetInTransitNotice
        asset={{
          ...asset,
          inTransitSiteTransferId: 7,
          inTransitSiteTransferNumber: 'TRF-2026-000007',
        }}
      />
    );
    expect(container.textContent).toContain('In transit on site transfer');
    expect(container.querySelector('a[href*="/transfers/7"]') === null).toBe(
      false
    );
  });

  test('shows nothing when the asset is not in transit', () => {
    const { container } = render(<AssetInTransitNotice asset={asset} />);
    expect(container.textContent).toBe('');
  });
});
