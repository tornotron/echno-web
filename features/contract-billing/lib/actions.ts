import {
  BillStatus,
  BillingModel,
  type ContractBillingSummary,
} from '@tornotron/echno-core/contract-billing/types';
import { STATUS_LABELS } from './labels';

/** What the signed-in user may do on bills, from their org roles. */
export interface BillRoles {
  /** system-admin, project-manager or site-engineer: prepare, measure, verify, return. */
  prepare: boolean;
  /** system-admin or project-manager: adjustments, certify, approve. */
  sign: boolean;
}

export type BillAction =
  | 'saveClaim'
  | 'submit'
  | 'cancel'
  | 'saveMeasurement'
  | 'verify'
  | 'return'
  | 'editAdjustments'
  | 'certify'
  | 'approve'
  | 'documents';

/**
 * The actions a bill offers in its status to someone with these roles. It
 * mirrors the server's rules (docs/specs/2026-10-04-ra-milestone-billing.md
 * section 4); the server still refuses anything out of turn.
 */
export function billActions(
  status: BillStatus,
  roles: BillRoles
): Set<BillAction> {
  const actions = new Set<BillAction>();
  const editable =
    status === BillStatus.DRAFT || status === BillStatus.RETURNED;
  const open =
    status !== BillStatus.APPROVED && status !== BillStatus.CANCELLED;
  if (roles.prepare) {
    if (editable) {
      actions.add('saveClaim');
      actions.add('submit');
      actions.add('cancel');
    }
    if (status === BillStatus.SUBMITTED) {
      actions.add('saveMeasurement');
      actions.add('verify');
    }
    if (
      status === BillStatus.SUBMITTED ||
      status === BillStatus.VERIFIED ||
      status === BillStatus.CERTIFIED
    ) {
      actions.add('return');
    }
    if (open) actions.add('documents');
  }
  if (roles.sign) {
    if (open && status !== BillStatus.CERTIFIED) actions.add('editAdjustments');
    if (status === BillStatus.VERIFIED) actions.add('certify');
    if (status === BillStatus.CERTIFIED) actions.add('approve');
  }
  return actions;
}

export type ContractAction =
  | { kind: 'start' }
  | { kind: 'new'; model: BillingModel }
  | { kind: 'blocked'; model?: BillingModel; reason: string };

/**
 * What the billing home page offers for a contract: start billing (and pick
 * the model) when nothing has been billed, the next bill of its model
 * otherwise, or the reason neither is possible.
 */
export function contractAction(
  contract: ContractBillingSummary
): ContractAction {
  if (contract.projectId === undefined || contract.projectId === null) {
    return {
      kind: 'blocked',
      model: contract.billingModel,
      reason: 'Link this sub-contract to a project before billing it.',
    };
  }
  if (contract.openBill) {
    return {
      kind: 'blocked',
      model: contract.billingModel,
      reason: `Bill ${contract.openBill.billNumber} is still ${STATUS_LABELS[contract.openBill.status].toLowerCase()}. Approve or cancel it before opening the next.`,
    };
  }
  if (!contract.billingModel) return { kind: 'start' };
  return { kind: 'new', model: contract.billingModel };
}

export interface StepperStep {
  label: string;
  state: 'done' | 'current' | 'upcoming';
  at?: string;
}

const FLOW: BillStatus[] = [
  BillStatus.DRAFT,
  BillStatus.SUBMITTED,
  BillStatus.VERIFIED,
  BillStatus.CERTIFIED,
  BillStatus.APPROVED,
];

/**
 * The status stepper. A returned bill shows the steps it had passed as done
 * and Draft as current again, since it is back with the preparer; a
 * cancelled bill shows nothing current.
 */
export function stepperSteps(bill: {
  status: BillStatus;
  createdAt?: string;
  submittedAt?: string;
  verifiedAt?: string;
  certifiedAt?: string;
  approvedAt?: string;
}): StepperStep[] {
  const at: Record<string, string | undefined> = {
    [BillStatus.DRAFT]: bill.createdAt,
    [BillStatus.SUBMITTED]: bill.submittedAt,
    [BillStatus.VERIFIED]: bill.verifiedAt,
    [BillStatus.CERTIFIED]: bill.certifiedAt,
    [BillStatus.APPROVED]: bill.approvedAt,
  };
  if (bill.status === BillStatus.CANCELLED) {
    return FLOW.map((status) => ({
      label: STATUS_LABELS[status],
      state: 'upcoming',
    }));
  }
  const current =
    bill.status === BillStatus.RETURNED ? 0 : FLOW.indexOf(bill.status);
  return FLOW.map((status, index) => ({
    label: STATUS_LABELS[status],
    state:
      bill.status === BillStatus.APPROVED || index < current
        ? 'done'
        : index === current
          ? 'current'
          : 'upcoming',
    at:
      index <= current || bill.status === BillStatus.APPROVED
        ? at[status]
        : undefined,
  }));
}

/** The button that opens the next bill of a contract's model. */
export function newBillLabel(model?: BillingModel): string {
  if (!model) return 'Start billing';
  return model === BillingModel.MILESTONE
    ? 'New milestone bill'
    : 'New RA bill';
}
