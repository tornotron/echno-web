import { describe, expect, test } from 'bun:test';
import type { StockAdjustmentSubmitData } from '@/features/stock-adjustments/components/stock-adjustment-form';
import {
  parseLineItem,
  parseStockAdjustment,
  toPayload,
} from './stock-adjustments-service';

function submitData(over: {
  form?: Record<string, unknown>;
  items?: Array<Record<string, unknown>>;
}): StockAdjustmentSubmitData {
  return {
    form: { adjustmentReason: '', notes: '', ...over.form },
    items: over.items ?? [],
  } as unknown as StockAdjustmentSubmitData;
}

describe('toPayload carries what approval needs', () => {
  test('the project and the storage location are sent as ids', () => {
    const payload = toPayload(
      submitData({ form: { projectId: 4, storageLocationId: 7 } })
    );
    expect(payload.projectId).toBe(4);
    expect(payload.locationId).toBe(7);
  });

  test('an unset project and location collapse to undefined rather than 0', () => {
    const payload = toPayload(
      submitData({ form: { projectId: 0, storageLocationId: 0 } })
    );
    expect(payload.projectId).toBeUndefined();
    expect(payload.locationId).toBeUndefined();
  });

  test('each line names the material it adjusts', () => {
    const payload = toPayload(
      submitData({
        items: [
          { materialId: 21, currentStock: 10, countedStock: 8, unitCost: 5 },
        ],
      })
    );
    const line = (payload.lineItems as Array<Record<string, unknown>>)[0];
    expect(line.materialId).toBe(21);
  });
});

describe('toPayload (INVENTORY / MONEY variance)', () => {
  test('adjustmentQuantity is counted - current and value is qty * unit cost', () => {
    const payload = toPayload(
      submitData({
        items: [
          {
            description: 'Cement',
            currentStock: 100,
            countedStock: 120,
            unit: 'bag',
            unitCost: 50,
            reason: 'recount',
          },
        ],
      })
    );
    const line = (payload.lineItems as Array<Record<string, unknown>>)[0];
    expect(line.adjustmentQuantity).toBe(20);
    expect(line.systemQuantity).toBe(100);
    expect(line.physicalQuantity).toBe(120);
    expect(line.totalAdjustmentValue).toBe(1000);
  });

  test('a reduction yields a negative quantity and value', () => {
    const payload = toPayload(
      submitData({
        items: [
          { currentStock: 100, countedStock: 80, unitCost: 10, reason: 'loss' },
        ],
      })
    );
    const line = (payload.lineItems as Array<Record<string, unknown>>)[0];
    expect(line.adjustmentQuantity).toBe(-20);
    expect(line.totalAdjustmentValue).toBe(-200);
    expect(payload.totalAdjustmentValue).toBe(-200);
    expect(payload.totalVarianceQuantity).toBe(-20);
  });

  test('justification falls back to a placeholder when notes are blank', () => {
    const payload = toPayload(submitData({ form: { notes: '' } }));
    expect(payload.justification).toBe('Stock adjustment');
    expect(payload.notes).toBeUndefined();
  });

  test('notes flow into both justification and notes when present', () => {
    const payload = toPayload(submitData({ form: { notes: 'Audit' } }));
    expect(payload.justification).toBe('Audit');
    expect(payload.notes).toBe('Audit');
  });

  test('blank description and unit collapse to undefined; line reason falls back to the form reason', () => {
    const payload = toPayload(
      submitData({
        form: { adjustmentReason: 'audit' },
        items: [
          {
            description: '',
            currentStock: 5,
            countedStock: 5,
            unit: '',
            unitCost: 1,
            reason: '',
          },
        ],
      })
    );
    const line = (payload.lineItems as Array<Record<string, unknown>>)[0];
    expect(line.description).toBeUndefined();
    expect(line.unit).toBeUndefined();
    expect(line.reason).toBe('audit');
  });

  test('status is always draft', () => {
    expect(toPayload(submitData({})).status).toBe('draft');
  });
});

describe('parseStockAdjustment / parseLineItem', () => {
  test('throws when the id is missing', () => {
    expect(() => parseStockAdjustment({})).toThrow('missing id');
  });

  test('adjustmentNumber falls back to the id and defaults apply', () => {
    const sa = parseStockAdjustment({ id: 7 });
    expect(sa.adjustmentNumber).toBe('7');
    expect(sa.type).toBe('correction');
    expect(sa.status).toBe('draft');
    expect(sa.justification).toBe('');
  });

  test('effectiveDate falls back to the adjustment date', () => {
    const sa = parseStockAdjustment({
      id: 1,
      adjustmentDate: '2026-03-01',
    });
    expect(sa.effectiveDate.getTime()).toBe(sa.adjustmentDate.getTime());
  });

  test('line items are parsed with defaults', () => {
    const item = parseLineItem({ id: 2 });
    expect(item.id).toBe(2);
    expect(item.systemQuantity).toBe(0);
    expect(item.reason).toBe('other');
    expect(item.unit).toBe('');
  });

  test('parses nested line items on an adjustment', () => {
    const sa = parseStockAdjustment({
      id: 1,
      lineItems: [{ id: 5, description: 'Steel' }],
    });
    expect(sa.lineItems).toHaveLength(1);
    expect(sa.lineItems[0].description).toBe('Steel');
  });
});
