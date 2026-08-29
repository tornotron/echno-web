import { describe, expect, test } from 'bun:test';
import type { StockAdjustment } from '@/types/resource';
import { stockAdjustmentApprovalGate } from './approval-gate';

/**
 * A draft raised by user 7, with one line naming a material, against project 4.
 * Everything the backend requires before it will post, so each test can remove
 * exactly one thing.
 */
function draft(over: Partial<StockAdjustment> = {}): StockAdjustment {
  return {
    id: 1,
    adjustmentNumber: 'SA-2026-0001',
    status: 'draft',
    projectId: 4,
    submittedBy: 7,
    lineItems: [{ id: 1, materialId: 21 }],
    ...over,
  } as unknown as StockAdjustment;
}

const APPROVER = {
  currentUserId: 9,
  canApprove: true,
  isSystemAdmin: false,
};

describe('stockAdjustmentApprovalGate', () => {
  test('an approver who did not raise it may approve', () => {
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft(),
      ...APPROVER,
    });
    expect(gate.visible).toBe(true);
    expect(gate.enabled).toBe(true);
    expect(gate.selfApproval).toBe(false);
    expect(gate.reason).toBeUndefined();
  });

  test('a caller without an approval role is not offered the action', () => {
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft(),
      currentUserId: 9,
      canApprove: false,
      isSystemAdmin: false,
    });
    expect(gate.visible).toBe(false);
    expect(gate.enabled).toBe(false);
  });

  test('a posted document is past approving', () => {
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft({ status: 'processed', processedAt: new Date() }),
      ...APPROVER,
    });
    expect(gate.visible).toBe(false);
  });

  test('a rejected document cannot then be approved', () => {
    // requireNotRejected sits on approve as well, so an approval after a
    // rejection is a 400. The action goes rather than 400ing when pressed.
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft({ status: 'rejected', rejectedAt: new Date() }),
      ...APPROVER,
    });
    expect(gate.visible).toBe(false);
  });

  test('the rejected status alone is enough to withdraw the action', () => {
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft({ status: 'rejected' }),
      ...APPROVER,
    });
    expect(gate.visible).toBe(false);
  });

  test('the raiser is refused with the reason, not offered the button', () => {
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft({ submittedBy: 9 }),
      ...APPROVER,
    });
    expect(gate.visible).toBe(true);
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('You raised this adjustment');
  });

  test('a system administrator may approve their own, recorded as a self-approval', () => {
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft({ submittedBy: 9 }),
      currentUserId: 9,
      canApprove: true,
      isSystemAdmin: true,
    });
    expect(gate.enabled).toBe(true);
    expect(gate.selfApproval).toBe(true);
  });

  test('a document nobody is recorded as raising is not treated as self-raised', () => {
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft({ submittedBy: 0 }),
      ...APPROVER,
    });
    expect(gate.enabled).toBe(true);
    expect(gate.selfApproval).toBe(false);
  });

  test('a document with no project cannot be approved and says so', () => {
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft({ projectId: undefined }),
      ...APPROVER,
    });
    expect(gate.visible).toBe(true);
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('names no project');
  });

  test('a document with no lines has nothing to post', () => {
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft({ lineItems: [] }),
      ...APPROVER,
    });
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('no line items');
  });

  test('a line with no material blocks the approval', () => {
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft({
        lineItems: [
          { id: 1, materialId: 21 },
          { id: 2 },
        ] as StockAdjustment['lineItems'],
      }),
      ...APPROVER,
    });
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('names no material');
  });

  test('the refusal of the raiser wins over the missing project', () => {
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft({ submittedBy: 9, projectId: undefined }),
      ...APPROVER,
    });
    expect(gate.reason).toContain('You raised this adjustment');
  });

  test('the action waits while the caller identity is still loading', () => {
    const gate = stockAdjustmentApprovalGate({
      adjustment: draft(),
      currentUserId: undefined,
      canApprove: true,
      isSystemAdmin: false,
    });
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('Checking who raised');
  });
});
