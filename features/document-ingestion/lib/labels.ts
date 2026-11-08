import type {
  BoqField,
  BoqSheetStatus,
  CandidateStatus,
  DecisionOutcome,
  IngestDocument,
} from '@tornotron/echno-core/document-ingestion/types';

export const boqFieldLabels: Record<BoqField, string> = {
  itemCode: 'Item code',
  description: 'Description',
  unit: 'Unit',
  quantity: 'Quantity',
  rate: 'Rate',
  amount: 'Amount',
};

export const candidateStatusLabels: Record<CandidateStatus, string> = {
  PROPOSED: 'To review',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  APPLIED: 'Applied',
  APPLY_FAILED: 'Not applied',
  SUPERSEDED: 'Replaced',
};

/** The statuses a reviewer filters by, in the order they meet them. */
export const REVIEW_STATUSES: CandidateStatus[] = [
  'PROPOSED',
  'ACCEPTED',
  'REJECTED',
  'APPLIED',
  'APPLY_FAILED',
];

export const sheetStatusLabels: Record<BoqSheetStatus, string> = {
  DETECTED: 'Header found',
  NEEDS_MAPPING: 'Needs mapping',
  EXTRACTED: 'Read',
};

export const decisionOutcomeLabels: Record<DecisionOutcome, string> = {
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  SKIPPED_FLAGGED: 'Skipped, a flag is not ticked',
  REFUSED_NO_SOURCE: 'Refused, no source cell',
  REFUSED_STATE: 'Refused, already decided or applied',
  REFUSED_ROLE: 'Refused, your role cannot review',
  NOT_FOUND: 'Not found',
};

/** Short names for the flag codes the BOQ reader raises; an unknown code shows as itself. */
export const flagLabels: Record<string, string> = {
  AMOUNT_MISMATCH: 'Amount mismatch',
  NUMBER_AS_TEXT: 'Number stored as text',
  FORMULA_NOT_CACHED: 'Formula without a value',
  CELL_ERROR: 'Cell error',
  HIDDEN_ROW: 'Hidden row',
  HIDDEN_SHEET: 'Hidden sheet',
  LUMP_SUM: 'Lump sum',
  PROVISIONAL_SUM: 'Provisional sum',
  UNPRICED: 'Unpriced',
  QUANTITY_MISSING: 'No quantity',
  UNIT_MISSING: 'No unit',
  CODE_MISSING: 'No item code',
  DUPLICATE_CODE: 'Duplicate code',
  MERGED_CELL: 'Merged cell',
  TOO_LONG: 'Too long',
  PRECISION: 'Too many decimals',
  NOT_A_NUMBER: 'Not a number',
};

export function flagLabel(code: string): string {
  return flagLabels[code] ?? code;
}

const documentStatusLabels: Record<IngestDocument['status'], string> = {
  AWAITING_UPLOAD: 'Waiting for upload',
  QUEUED: 'Waiting to be read',
  PARSED: 'Read',
  FAILED: 'Could not be read',
  STORED_ONLY: 'Stored only',
};

/** What a person reads about a file's reading state. */
export function documentStatusLabel(doc: IngestDocument): string {
  if (doc.latestJob?.status === 'RUNNING') return 'Being read';
  return documentStatusLabels[doc.status] ?? doc.status;
}
