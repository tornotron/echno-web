import {
  BillEventType,
  BillLineStatus,
  BillStatus,
  BillingModel,
  DeductionKind,
  RequirementStatus,
  RequirementType,
  type BillDocumentType,
} from '@tornotron/echno-core/contract-billing/types';

export const MODEL_LABELS: Record<BillingModel, string> = {
  [BillingModel.RUNNING_ACCOUNT]: 'Running Account',
  [BillingModel.MILESTONE]: 'Milestone',
};

export const STATUS_LABELS: Record<BillStatus, string> = {
  [BillStatus.DRAFT]: 'Draft',
  [BillStatus.SUBMITTED]: 'Submitted',
  [BillStatus.VERIFIED]: 'Verified',
  [BillStatus.CERTIFIED]: 'Certified',
  [BillStatus.APPROVED]: 'Approved',
  [BillStatus.RETURNED]: 'Returned',
  [BillStatus.CANCELLED]: 'Cancelled',
};

/** Tailwind classes for a bill status chip. */
export const STATUS_CLASSES: Record<BillStatus, string> = {
  [BillStatus.DRAFT]:
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  [BillStatus.SUBMITTED]:
    'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  [BillStatus.VERIFIED]:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200',
  [BillStatus.CERTIFIED]:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  [BillStatus.APPROVED]:
    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  [BillStatus.RETURNED]:
    'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  [BillStatus.CANCELLED]:
    'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

export const LINE_STATUS_LABELS: Record<BillLineStatus, string> = {
  [BillLineStatus.NOT_CLAIMED]: 'Not claimed',
  [BillLineStatus.UNDER_REVIEW]: 'Under review',
  [BillLineStatus.VERIFIED]: 'Verified',
  [BillLineStatus.PART_ACCEPTED]: 'Part accepted',
  [BillLineStatus.REJECTED]: 'Rejected',
};

export const LINE_STATUS_CLASSES: Record<BillLineStatus, string> = {
  [BillLineStatus.NOT_CLAIMED]:
    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  [BillLineStatus.UNDER_REVIEW]:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  [BillLineStatus.VERIFIED]:
    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  [BillLineStatus.PART_ACCEPTED]:
    'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  [BillLineStatus.REJECTED]:
    'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};

export const KIND_LABELS: Record<DeductionKind, string> = {
  [DeductionKind.RETENTION]: 'Retention',
  [DeductionKind.ADVANCE_RECOVERY]: 'Advance recovery',
  [DeductionKind.PENALTY_LD]: 'Penalty / LD',
  [DeductionKind.TDS]: 'TDS',
  [DeductionKind.GST]: 'GST',
  [DeductionKind.VARIATION]: 'Approved variation',
  [DeductionKind.EXTRA_ITEM]: 'Extra item',
  [DeductionKind.ESCALATION]: 'Price escalation',
  [DeductionKind.OTHER]: 'Other',
};

/** The kinds that add to a bill unless stated otherwise, as the server defaults them. */
export const ADDING_KINDS: ReadonlySet<DeductionKind> = new Set([
  DeductionKind.GST,
  DeductionKind.VARIATION,
  DeductionKind.EXTRA_ITEM,
  DeductionKind.ESCALATION,
]);

export const REQUIREMENT_TYPE_LABELS: Record<RequirementType, string> = {
  [RequirementType.SCOPE]: 'Scope',
  [RequirementType.QUALITY_TEST]: 'Quality & tests',
  [RequirementType.QA_QC]: 'QA/QC',
  [RequirementType.DOCUMENT]: 'Documents',
  [RequirementType.INSPECTION]: 'Inspection',
};

export const REQUIREMENT_STATUS_LABELS: Record<RequirementStatus, string> = {
  [RequirementStatus.PENDING]: 'Pending',
  [RequirementStatus.UNDER_REVIEW]: 'Under review',
  [RequirementStatus.COMPLETED]: 'Completed',
  [RequirementStatus.NOT_APPLICABLE]: 'Not applicable',
};

export const REQUIREMENT_STATUS_CLASSES: Record<RequirementStatus, string> = {
  [RequirementStatus.PENDING]:
    'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  [RequirementStatus.UNDER_REVIEW]:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  [RequirementStatus.COMPLETED]:
    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  [RequirementStatus.NOT_APPLICABLE]:
    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

export const DOCUMENT_TYPE_LABELS: Record<BillDocumentType, string> = {
  photo: 'Photos',
  'test-report': 'Test reports',
  'delivery-challan': 'Delivery challans',
  measurement: 'Measurements',
  other: 'Others',
};

export const EVENT_LABELS: Record<BillEventType, string> = {
  [BillEventType.CREATED]: 'Bill opened',
  [BillEventType.CLAIM_UPDATED]: 'Claim updated',
  [BillEventType.SUBMITTED]: 'Bill submitted',
  [BillEventType.MEASUREMENT_SAVED]: 'Joint measurement saved',
  [BillEventType.VERIFIED]: 'Measurement verified',
  [BillEventType.ADJUSTMENTS_UPDATED]: 'Adjustments updated',
  [BillEventType.CERTIFIED]: 'Bill certified',
  [BillEventType.APPROVED]: 'Final approval',
  [BillEventType.RETURNED]: 'Returned for correction',
  [BillEventType.CANCELLED]: 'Bill cancelled',
  [BillEventType.DOCUMENT_ADDED]: 'Documents added',
  [BillEventType.DOCUMENT_REMOVED]: 'Document removed',
  [BillEventType.NOTE]: 'Note',
};

/** The bill's title as the mockups write it. */
export function billTitle(bill: {
  billingModel: BillingModel;
  billNumber: string;
  milestoneName?: string;
}): string {
  if (bill.billingModel === BillingModel.MILESTONE) {
    return bill.milestoneName
      ? `Milestone Bill ${bill.billNumber} - ${bill.milestoneName}`
      : `Milestone Bill ${bill.billNumber}`;
  }
  return `Running Account Bill ${bill.billNumber}`;
}
