import type {
  BoqField,
  BoqSheetStatus,
  CandidateStatus,
  ClassMethod,
  DecisionOutcome,
  DocClass,
  ExtractJobStatus,
  IngestDocument,
  LlmCallOutcome,
  SegmentStatus,
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
  QUOTE_NOT_FOUND: 'Quote not found on the page',
  OCR_PAGE: 'Scanned page',
  PERCENT_TOTAL: 'Percentages do not add up to 100',
  DATE_ORDER: 'Date out of order',
  RELATIVE_TIME: 'Time counted from the start',
  UNMATCHED: 'Matches no earlier value',
  OLD_VALUE_DIFFERS: 'Old value differs',
  TENDER_IMPACT: 'May affect bids',
  ITEM_ADDED: 'Item added',
  ITEM_REMOVED: 'Item removed',
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

export const docClassLabels: Record<DocClass, string> = {
  NIT: 'Notice inviting tender',
  ITB: 'Instructions to bidders',
  ELIGIBILITY: 'Eligibility',
  GCC: 'General conditions',
  SCC: 'Special conditions',
  CONTRACT_DATA: 'Contract data',
  SCOPE: 'Scope of work',
  BOQ: 'Bill of quantities',
  SPECIFICATION: 'Specification',
  DRAWING: 'Drawing',
  MILESTONE_SCHEDULE: 'Milestone schedule',
  CORRIGENDUM: 'Corrigendum',
  OTHER: 'Other',
};

export function docClassLabel(value: string | undefined): string {
  if (!value) return 'Not classified';
  return docClassLabels[value as DocClass] ?? value;
}

export const classMethodLabels: Record<ClassMethod, string> = {
  DETERMINISTIC: 'by a rule',
  LLM: 'by the AI service',
  PERSON: 'by a person',
};

export const segmentStatusLabels: Record<SegmentStatus, string> = {
  PROPOSED: 'Proposed',
  CONFIRMED: 'Confirmed',
  EXTRACTING: 'Being read',
  EXTRACTED: 'Read',
  PARTIAL: 'Partly read',
  FAILED: 'Could not be read',
};

export const extractJobStatusLabels: Record<ExtractJobStatus, string> = {
  QUEUED: 'Waiting',
  RUNNING: 'Reading',
  WAITING_LLM: 'Waiting for AI reading',
  PAUSED_BUDGET: 'Paused at the spending limit',
  PARTIAL: 'Partly read',
  DONE: 'Done',
  FAILED: 'Failed',
};

export const llmOutcomeLabels: Record<LlmCallOutcome, string> = {
  OK: 'Read',
  INVALID_ANSWER: 'Answer not usable',
  TRUNCATED: 'Answer cut short',
  RATE_LIMITED: 'Service busy',
  SERVER_ERROR: 'Service error',
  TIMEOUT: 'Timed out',
  UNREACHABLE: 'Service not reachable',
  CLIENT_ERROR: 'Request refused',
  MALFORMED_ENVELOPE: 'Reply not readable',
};

/** Field names for a project field candidate's natural key; an unknown key shows as itself. */
export const projectFieldLabels: Record<string, string> = {
  project_name: 'Project name',
  location: 'Location',
  client: 'Client',
  estimated_value: 'Estimated value',
  emd: 'EMD',
  tender_fee: 'Tender fee',
  bid_due_date: 'Bid due date',
  bid_validity: 'Bid validity',
  duration: 'Duration',
  consultant: 'Consultant',
  engineer: 'Engineer',
  scope: 'Scope',
};

export function projectFieldLabel(key: string | undefined): string {
  if (!key) return 'Unknown field';
  return projectFieldLabels[key] ?? key;
}

/** `pages 3, 4 and 9`, or `page 3`. */
export function pagesLabel(pages: number[]): string {
  const sorted = [...new Set(pages)].toSorted((a, b) => a - b);
  if (sorted.length === 0) return 'no pages';
  if (sorted.length === 1) return `page ${sorted[0]}`;
  const head = sorted.slice(0, -1).join(', ');
  return `pages ${head} and ${sorted.at(-1)}`;
}

/** Names for the project and tender profile fields provenance records; an unknown field shows as itself. */
const projectTargetFields: Record<string, string> = {
  projectName: 'Project name',
  projectAddress: 'Location',
  client: 'Client',
  estimatedValue: 'Estimated value',
  emdAmount: 'EMD',
  tenderFeeAmount: 'Tender fee',
  bidDueAt: 'Bid due',
  bidValidityDays: 'Bid validity',
  durationText: 'Duration',
  consultant: 'Consultant',
  engineer: 'Engineer',
  scope: 'Scope',
};

export function projectTargetFieldLabel(field: string): string {
  return projectTargetFields[field] ?? field;
}
