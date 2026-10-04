import { describe, expect, test } from 'bun:test';
import {
  BillStatus,
  BillingModel,
  type ContractBillingSummary,
} from '@tornotron/echno-core/contract-billing/types';
import {
  billActions,
  contractAction,
  newBillLabel,
  stepperSteps,
} from './actions';

const site = { prepare: true, sign: false };
const office = { prepare: true, sign: true };
const reader = { prepare: false, sign: false };

describe('billActions', () => {
  test('a draft is claimed and submitted by the preparer; the office may add adjustments', () => {
    expect([...billActions(BillStatus.DRAFT, site)].toSorted()).toEqual([
      'cancel',
      'documents',
      'saveClaim',
      'submit',
    ]);
    expect(billActions(BillStatus.DRAFT, office).has('editAdjustments')).toBe(
      true
    );
    expect(billActions(BillStatus.RETURNED, site).has('submit')).toBe(true);
  });

  test('a submitted bill is measured, verified or returned', () => {
    const actions = billActions(BillStatus.SUBMITTED, site);
    expect(actions.has('saveMeasurement')).toBe(true);
    expect(actions.has('verify')).toBe(true);
    expect(actions.has('return')).toBe(true);
    expect(actions.has('saveClaim')).toBe(false);
    expect(actions.has('certify')).toBe(false);
  });

  test('only the office certifies and approves, each in its own status', () => {
    expect(billActions(BillStatus.VERIFIED, site).has('certify')).toBe(false);
    expect(billActions(BillStatus.VERIFIED, office).has('certify')).toBe(true);
    expect(billActions(BillStatus.CERTIFIED, office).has('approve')).toBe(true);
    expect(
      billActions(BillStatus.CERTIFIED, office).has('editAdjustments')
    ).toBe(false);
    expect(billActions(BillStatus.CERTIFIED, site).has('return')).toBe(true);
    expect(billActions(BillStatus.VERIFIED, office).has('approve')).toBe(false);
  });

  test('a closed bill and a reader offer nothing', () => {
    expect(billActions(BillStatus.APPROVED, office).size).toBe(0);
    expect(billActions(BillStatus.CANCELLED, office).size).toBe(0);
    expect(billActions(BillStatus.DRAFT, reader).size).toBe(0);
  });
});

function contract(
  over: Partial<ContractBillingSummary>
): ContractBillingSummary {
  return {
    subContractId: 3,
    contractName: 'Civil works',
    contractorName: 'ABC Constructions',
    projectId: 7,
    billCount: 0,
    approvedBillCount: 0,
    certifiedToDate: 0,
    netApprovedToDate: 0,
    ...over,
  };
}

describe('contractAction', () => {
  test('a contract with no bills starts billing, where the model is chosen', () => {
    expect(contractAction(contract({}))).toEqual({ kind: 'start' });
  });

  test('a billed contract opens the next bill of its model', () => {
    expect(
      contractAction(contract({ billingModel: BillingModel.MILESTONE }))
    ).toEqual({
      kind: 'new',
      model: BillingModel.MILESTONE,
    });
    expect(newBillLabel(BillingModel.RUNNING_ACCOUNT)).toBe('New RA bill');
    expect(newBillLabel(BillingModel.MILESTONE)).toBe('New milestone bill');
    expect(newBillLabel()).toBe('Start billing');
  });

  test('an open bill or a missing project blocks it, with the reason', () => {
    const open = contractAction(
      contract({
        billingModel: BillingModel.RUNNING_ACCOUNT,
        openBill: {
          id: 'b1',
          subContractId: 3,
          contractName: 'Civil works',
          contractorName: 'ABC',
          projectId: 7,
          billNumber: 'RA-02',
          billingModel: BillingModel.RUNNING_ACCOUNT,
          status: BillStatus.SUBMITTED,
          grossClaimed: 0,
        },
      })
    );
    expect(open.kind).toBe('blocked');
    expect(open.kind === 'blocked' && open.reason).toContain(
      'RA-02 is still submitted'
    );
    const unlinked = contractAction(contract({ projectId: undefined }));
    expect(unlinked.kind === 'blocked' && unlinked.reason).toContain('project');
  });
});

describe('stepperSteps', () => {
  test('marks the steps passed, the current one and the rest', () => {
    const steps = stepperSteps({
      status: BillStatus.VERIFIED,
      createdAt: '2026-09-01',
      submittedAt: '2026-09-02',
      verifiedAt: '2026-09-03',
    });
    expect(steps.map((s) => s.state)).toEqual([
      'done',
      'done',
      'current',
      'upcoming',
      'upcoming',
    ]);
    expect(steps[1].at).toBe('2026-09-02');
  });

  test('a returned bill is back at draft and an approved one is done throughout', () => {
    expect(
      stepperSteps({ status: BillStatus.RETURNED }).map((s) => s.state)[0]
    ).toBe('current');
    expect(
      stepperSteps({ status: BillStatus.APPROVED }).every(
        (s) => s.state === 'done'
      )
    ).toBe(true);
    expect(
      stepperSteps({ status: BillStatus.CANCELLED }).every(
        (s) => s.state === 'upcoming'
      )
    ).toBe(true);
  });
});
