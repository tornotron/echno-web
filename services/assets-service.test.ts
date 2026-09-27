import { describe, expect, test } from 'bun:test';
import type { AssetFormData } from '@/features/assets/components/asset-form';
import {
  formToPayload,
  parseAsset,
  parseAssetMovement,
} from './assets-service';

function form(over: Record<string, unknown>): AssetFormData {
  return {
    name: 'Excavator',
    description: '',
    type: '',
    category: '',
    status: 'available',
    condition: 'good',
    locationId: '',
    assignedTo: '',
    assignedProject: '',
    purchaseDate: '',
    purchasePrice: '',
    depreciationRate: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    registrationNumber: '',
    warrantyExpiry: '',
    maintenanceSchedule: '',
    usageHours: '',
    maxUsageHours: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    fuelType: '',
    insuranceProvider: '',
    policyNumber: '',
    insuranceExpiry: '',
    notes: '',
    ...over,
  } as unknown as AssetFormData;
}

describe('formToPayload', () => {
  test('blank text fields become undefined', () => {
    const payload = formToPayload(form({}));
    expect(payload.description).toBeUndefined();
    expect(payload.type).toBeUndefined();
    expect(payload.manufacturer).toBeUndefined();
  });

  test('blank numeric fields become undefined; filled ones are numbers', () => {
    const payload = formToPayload(
      form({ locationId: '', depreciationRate: '5' })
    );
    expect(payload.locationId).toBeUndefined();
    expect(payload.depreciationRate).toBe(5);
  });

  test('currentValue defaults to the purchase price on create (MONEY)', () => {
    const payload = formToPayload(form({ purchasePrice: '25000' }));
    expect(payload.purchasePrice).toBe(25_000);
    expect(payload.currentValue).toBe(25_000);
  });

  test('an empty purchase price leaves both undefined', () => {
    const payload = formToPayload(form({ purchasePrice: '' }));
    expect(payload.purchasePrice).toBeUndefined();
    expect(payload.currentValue).toBeUndefined();
  });

  test('status and condition pass through unchanged', () => {
    const payload = formToPayload(form({ status: 'inUse', condition: 'fair' }));
    expect(payload.status).toBe('inUse');
    expect(payload.condition).toBe('fair');
  });
});

describe('parseAsset', () => {
  test('throws when the id is missing', () => {
    expect(() => parseAsset({})).toThrow('missing id');
  });

  test('assetId falls back to the id and defaults apply', () => {
    const asset = parseAsset({ id: 3 });
    expect(asset.assetId).toBe('3');
    expect(asset.type).toBe('other');
    expect(asset.status).toBe('available');
    expect(asset.condition).toBe('good');
  });

  test('a missing location falls back to a placeholder location object', () => {
    const asset = parseAsset({ id: 3, locationId: 9 });
    expect(asset.location.id).toBe(9);
    expect(asset.location.name).toBe('');
    expect(asset.location.type).toBe('other');
  });

  test('a nested location is parsed', () => {
    const asset = parseAsset({
      id: 3,
      location: { id: 5, name: 'Warehouse', type: 'warehouse' },
    });
    expect(asset.location.id).toBe(5);
    expect(asset.location.name).toBe('Warehouse');
  });

  test('dates default to a Date instance', () => {
    const asset = parseAsset({ id: 3 });
    expect(asset.purchaseDate).toBeInstanceOf(Date);
    expect(asset.warrantyExpiry).toBeUndefined();
  });
});

describe('what the asset register says about site transfers', () => {
  test('an asset in transit carries the transfer it is on', () => {
    const asset = parseAsset({
      id: 12,
      name: 'JCB Backhoe',
      assignedProjectId: 3,
      locationId: 7,
      locationName: 'Yard Store',
      inTransitSiteTransferId: 31,
      inTransitSiteTransferNumber: 'TRF-2026-000031',
    });
    expect(asset.assignedProjectId).toBe(3);
    expect(asset.location.name).toBe('Yard Store');
    expect(asset.inTransitSiteTransferId).toBe(31);
    expect(asset.inTransitSiteTransferNumber).toBe('TRF-2026-000031');
  });

  test('an asset not in transit carries no transfer', () => {
    const asset = parseAsset({ id: 12, name: 'JCB Backhoe' });
    expect(asset.inTransitSiteTransferId).toBeUndefined();
  });

  test('a ledger entry keeps the transfer it came from', () => {
    const movement = parseAssetMovement({
      id: 9,
      movementType: 'TRANSFER',
      toProjectName: 'Silver Oak',
      movedAt: '2026-09-20T10:00:00',
      reason: 'Received on site transfer TRF-2026-000007',
      referenceNumber: 'TRF-2026-000007',
      siteTransferId: 7,
    });
    expect(movement.siteTransferId).toBe(7);
    expect(movement.referenceNumber).toBe('TRF-2026-000007');
    expect(movement.movedAt.getFullYear()).toBe(2026);
  });
});
