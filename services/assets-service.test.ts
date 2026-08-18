import { describe, expect, test } from 'bun:test';
import type { AssetFormData } from '@/features/assets/components/asset-form';
import { formToPayload, parseAsset } from './assets-service';

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
    const payload = formToPayload(form({ locationId: '', depreciationRate: '5' }));
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
