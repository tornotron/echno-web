import { describe, expect, test } from 'bun:test';
import {
  BillLineStatus,
  BillStatus,
  BillingModel,
  type Bill,
  type BillLine,
} from '@tornotron/echno-core/contract-billing/types';
import {
  buildClaimRequest,
  buildMeasurementRequest,
  claimHeaderOf,
  measurementFormOf,
} from './requests';

function line(
  id: string,
  claimed: number,
  over: Partial<BillLine> = {}
): BillLine {
  return {
    id,
    boqItemId: `boq-${id}`,
    itemCode: id.toUpperCase(),
    description: '',
    unit: 'm3',
    contractQuantity: 500,
    rate: 100,
    previousQuantity: 0,
    claimedQuantity: claimed,
    cumulativeQuantity: claimed,
    balanceQuantity: 500 - claimed,
    percentComplete: 0,
    thisAmount: 0,
    cumulativeAmount: 0,
    status:
      claimed > 0 ? BillLineStatus.UNDER_REVIEW : BillLineStatus.NOT_CLAIMED,
    ...over,
  };
}

function bill(over: Partial<Bill> = {}): Bill {
  return {
    id: 'b1',
    projectId: 7,
    subContractId: 3,
    contractName: 'Civil',
    contractorName: 'ABC',
    billingModel: BillingModel.RUNNING_ACCOUNT,
    billNumber: 'RA-01',
    status: BillStatus.DRAFT,
    periodFrom: '2026-08-01',
    periodTo: '2026-08-31',
    location: 'Tower B',
    lines: [line('cp1', 0), line('br1', 20)],
    requirements: [],
    adjustments: [],
    grossClaimed: 0,
    grossAmount: 0,
    additionsTotal: 0,
    deductionsTotal: 0,
    netPayable: 0,
    previousCertified: 0,
    cumulativeCertified: 0,
    amountsFinal: false,
    selfApproved: false,
    ...over,
  };
}

describe('buildClaimRequest', () => {
  test('sends the whole header back and only the lines that changed', () => {
    const b = bill();
    const built = buildClaimRequest(b, claimHeaderOf(b), {
      cp1: '120.255',
      br1: '20',
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.request).toEqual({
      periodFrom: '2026-08-01',
      periodTo: '2026-08-31',
      contractorReference: undefined,
      location: 'Tower B',
      remarks: undefined,
      lines: [{ lineId: 'cp1', claimedQuantity: 120.255, remarks: undefined }],
    });
  });

  test('a blank claim is zero and junk is refused with the item named', () => {
    const b = bill();
    const blank = buildClaimRequest(b, claimHeaderOf(b), { br1: '' });
    expect(blank.ok && blank.request.lines).toEqual([
      { lineId: 'br1', claimedQuantity: 0, remarks: undefined },
    ]);
    const junk = buildClaimRequest(b, claimHeaderOf(b), { br1: 'ten' });
    expect(!junk.ok && junk.error).toContain('BR1');
  });

  test('a milestone claim sends its percent and no lines', () => {
    const b = bill({
      billingModel: BillingModel.MILESTONE,
      lines: [],
      periodFrom: undefined,
      periodTo: undefined,
    });
    const built = buildClaimRequest(
      b,
      { ...claimHeaderOf(b), claimedPercent: '85' },
      {}
    );
    expect(built.ok && built.request).toEqual({
      contractorReference: undefined,
      location: 'Tower B',
      remarks: undefined,
      claimedPercent: 85,
    });
    expect(
      buildClaimRequest(b, { ...claimHeaderOf(b), claimedPercent: '120' }, {})
        .ok
    ).toBe(false);
  });
});

describe('buildMeasurementRequest', () => {
  test('sends every claimed line, blank meaning not measured yet', () => {
    const b = bill({ status: BillStatus.SUBMITTED });
    const form = measurementFormOf(b);
    form.measurementDate = '2026-09-19';
    form.lines.br1 = { measured: '19', accepted: '' };
    const built = buildMeasurementRequest(b, form);
    expect(built.ok && built.request).toEqual({
      measurementDate: '2026-09-19',
      measuredBy: undefined,
      clientRepresentative: undefined,
      lines: [
        {
          lineId: 'br1',
          measuredQuantity: 19,
          acceptedQuantity: undefined,
          remarks: undefined,
        },
      ],
    });
  });

  test('more accepted than claimed is caught before the server', () => {
    const b = bill({ status: BillStatus.SUBMITTED });
    const form = measurementFormOf(b);
    form.lines.br1 = { measured: '25', accepted: '21' };
    const built = buildMeasurementRequest(b, form);
    expect(!built.ok && built.error).toContain('20 claimed');
  });

  test('a milestone measurement is a percent within the claim', () => {
    const b = bill({
      billingModel: BillingModel.MILESTONE,
      lines: [],
      claimedPercent: 85,
      status: BillStatus.SUBMITTED,
    });
    const form = { ...measurementFormOf(b), certifiedPercent: '80' };
    expect(
      buildMeasurementRequest(b, form).ok && buildMeasurementRequest(b, form)
    ).toMatchObject({
      request: { certifiedPercent: 80 },
    });
    expect(
      buildMeasurementRequest(b, { ...form, certifiedPercent: '90' }).ok
    ).toBe(false);
  });
});
