// types/inspection/ncr.ts
//
// The non-conformance report (NCR) raised against an inspection, matching the
// backend `NcrDto` served from `/api/v1/ncrs/web`.
//
// The NCR is a first-class entity there, keyed by UUID like the inspection
// itself, with its own number series and a lifecycle driven by six dedicated
// transition endpoints rather than a settable status field. Nothing here
// invents shape: every field below is one the backend actually sends.
//
// These types are web-side only because @tornotron/echno-core does not model
// the NCR domain yet. They belong in core alongside the inspection contract,
// and should move there once it grows an `ncr` module.

import { parseUuid } from '@tornotron/echno-core';

// ---------------------------------------------------------------------------
// Enums
//
// Wire values are the hyphenated lowercase strings the backend emits via
// @JsonValue. They must match exactly; renaming one is a backend change.
// ---------------------------------------------------------------------------

/** Which discipline raised the NCR. Derived server-side from the inspection. */
export enum NcrType {
  QUALITY = 'quality',
  SAFETY = 'safety',
}

/**
 * NCR lifecycle.
 *
 * Not a free progression: the backend exposes one endpoint per transition and
 * rejects anything else, so the UI offers actions rather than a status picker.
 * `REJECTED` and `REOPENED` send the report back for more work, which is why
 * this cannot be modelled as a straight line.
 */
export enum NcrStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  CORRECTIVE_ACTION_COMPLETE = 'corrective-action-complete',
  VERIFIED = 'verified',
  CLOSED = 'closed',
  REJECTED = 'rejected',
  REOPENED = 'reopened',
}

/** Severity of the underlying defect. */
export enum DefectSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
}

/** Status of a defect row on an inspection. */
export enum DefectStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
  VERIFIED = 'verified',
}

// ---------------------------------------------------------------------------
// Labels and badge variants
// ---------------------------------------------------------------------------

export const ncrTypeLabels: Record<NcrType, string> = {
  [NcrType.QUALITY]: 'Quality',
  [NcrType.SAFETY]: 'Safety',
};

export const ncrStatusLabels: Record<NcrStatus, string> = {
  [NcrStatus.OPEN]: 'Open',
  [NcrStatus.ASSIGNED]: 'Assigned',
  [NcrStatus.CORRECTIVE_ACTION_COMPLETE]: 'Corrective Action Complete',
  [NcrStatus.VERIFIED]: 'Verified',
  [NcrStatus.CLOSED]: 'Closed',
  [NcrStatus.REJECTED]: 'Rejected',
  [NcrStatus.REOPENED]: 'Reopened',
};

export const defectSeverityLabels: Record<DefectSeverity, string> = {
  [DefectSeverity.CRITICAL]: 'Critical',
  [DefectSeverity.MAJOR]: 'Major',
  [DefectSeverity.MINOR]: 'Minor',
};

export const defectStatusLabels: Record<DefectStatus, string> = {
  [DefectStatus.OPEN]: 'Open',
  [DefectStatus.IN_PROGRESS]: 'In Progress',
  [DefectStatus.RESOLVED]: 'Resolved',
  [DefectStatus.VERIFIED]: 'Verified',
};

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const ncrStatusVariants: Record<NcrStatus, BadgeVariant> = {
  [NcrStatus.OPEN]: 'destructive',
  [NcrStatus.ASSIGNED]: 'default',
  [NcrStatus.CORRECTIVE_ACTION_COMPLETE]: 'secondary',
  [NcrStatus.VERIFIED]: 'secondary',
  [NcrStatus.CLOSED]: 'outline',
  [NcrStatus.REJECTED]: 'destructive',
  [NcrStatus.REOPENED]: 'destructive',
};

export const defectSeverityVariants: Record<DefectSeverity, BadgeVariant> = {
  [DefectSeverity.CRITICAL]: 'destructive',
  [DefectSeverity.MAJOR]: 'default',
  [DefectSeverity.MINOR]: 'outline',
};

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

/**
 * A non-conformance report.
 *
 * Always traceable to the inspection that found it (`inspectionId`), and to
 * the specific defect row when one was recorded (`defectId`). Remarks are kept
 * as two distinct fields because the backend records the corrector's account
 * and the verifier's account separately, and the timeline shows both.
 */
export interface Ncr {
  /** UUID primary key. */
  id: string;
  /** Human-facing NCR number, server-assigned. */
  ncrNumber: string;
  /** Discipline, derived from the inspection's category. */
  type: NcrType;
  /** The inspection this NCR was raised against. */
  inspectionId: string;
  /** The specific defect row, when the NCR came from one. */
  defectId?: string;
  title: string;
  description: string;
  severity: DefectSeverity;
  status: NcrStatus;
  /** Employee accountable for the corrective action. */
  siteEngineerId?: number;
  /** Target resolution date (`YYYY-MM-DD`). */
  targetDate?: string;
  raisedById?: number;
  closedById?: number;
  correctiveActionRemarks?: string;
  verificationRemarks?: string;
  /** ISO timestamps marking each lifecycle step the NCR has reached. */
  correctiveActionCompletedAt?: string;
  verifiedAt?: string;
  closedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function optionalString(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

function optionalNumber(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Parses a raw NCR payload into a typed {@link Ncr}. */
export function parseNcr(raw: Raw): Ncr {
  return {
    id: parseUuid(raw?.id, 'parseNcr.id'),
    ncrNumber: raw?.ncrNumber ?? '',
    type: (raw?.type as NcrType) ?? NcrType.QUALITY,
    inspectionId: parseUuid(raw?.inspectionId, 'parseNcr.inspectionId'),
    defectId: optionalString(raw?.defectId),
    title: raw?.title ?? '',
    description: raw?.description ?? '',
    severity: (raw?.severity as DefectSeverity) ?? DefectSeverity.MINOR,
    status: (raw?.status as NcrStatus) ?? NcrStatus.OPEN,
    siteEngineerId: optionalNumber(raw?.siteEngineerId),
    targetDate: optionalString(raw?.targetDate),
    raisedById: optionalNumber(raw?.raisedById),
    closedById: optionalNumber(raw?.closedById),
    correctiveActionRemarks: optionalString(raw?.correctiveActionRemarks),
    verificationRemarks: optionalString(raw?.verificationRemarks),
    correctiveActionCompletedAt: optionalString(
      raw?.correctiveActionCompletedAt
    ),
    verifiedAt: optionalString(raw?.verifiedAt),
    closedAt: optionalString(raw?.closedAt),
    createdAt: optionalString(raw?.createdAt),
    updatedAt: optionalString(raw?.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

/**
 * Fields for raising an NCR. `ncrNumber`, `type` and `raisedById` are all
 * server-set, so none of them appear here.
 */
export interface CreateNcrRequest {
  /** The inspection the NCR is raised against. Required. */
  inspectionId: string;
  /** The defect row it came from, when there is one. */
  defectId?: string;
  title: string;
  description: string;
  severity?: DefectSeverity;
  siteEngineerId?: number;
  /** Target resolution date (`YYYY-MM-DD`). */
  targetDate?: string;
}

/** Assigns an NCR to the engineer who will carry out the correction. */
export interface AssignNcrRequest {
  siteEngineerId: number;
  /** Target resolution date (`YYYY-MM-DD`). */
  targetDate?: string;
}

/** Free-text remarks carried by the corrective-action and sign-off steps. */
export interface NcrRemarksRequest {
  remarks?: string;
}

// ---------------------------------------------------------------------------
// Lifecycle helpers
// ---------------------------------------------------------------------------

/** Statuses that are done with, so nothing about them can still run late. */
export const SETTLED_NCR_STATUSES: ReadonlySet<NcrStatus> = new Set<NcrStatus>([
  NcrStatus.VERIFIED,
  NcrStatus.CLOSED,
]);

/**
 * Whether an NCR has passed its target date without being settled.
 *
 * Compared against the start of today, so one due today is not overdue until
 * tomorrow: site teams work to the day, not the minute.
 */
export function isNcrOverdue(ncr: Ncr): boolean {
  if (!ncr.targetDate || SETTLED_NCR_STATUSES.has(ncr.status)) return false;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const due = new Date(ncr.targetDate);
  if (Number.isNaN(due.getTime())) return false;
  due.setHours(0, 0, 0, 0);

  return due < startOfToday;
}

/** Whole days an overdue NCR is past its target date; 0 when not overdue. */
export function ncrDaysOverdue(ncr: Ncr): number {
  if (!isNcrOverdue(ncr) || !ncr.targetDate) return 0;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const due = new Date(ncr.targetDate);
  due.setHours(0, 0, 0, 0);

  return Math.round((startOfToday.getTime() - due.getTime()) / 86_400_000);
}

/**
 * The lifecycle actions available from a given status.
 *
 * Mirrors what the backend will accept, so the UI never offers a button whose
 * endpoint would reject the call.
 */
export type NcrAction =
  | 'assign'
  | 'corrective-action-complete'
  | 'verify'
  | 'reject'
  | 'reopen'
  | 'close';

export function availableNcrActions(status: NcrStatus): NcrAction[] {
  switch (status) {
    case NcrStatus.OPEN:
      return ['assign'];
    case NcrStatus.ASSIGNED:
    case NcrStatus.REOPENED:
    case NcrStatus.REJECTED:
      return ['corrective-action-complete', 'assign'];
    case NcrStatus.CORRECTIVE_ACTION_COMPLETE:
      return ['verify', 'reject'];
    case NcrStatus.VERIFIED:
      return ['close', 'reopen'];
    case NcrStatus.CLOSED:
      return ['reopen'];
    default:
      return [];
  }
}

export const ncrActionLabels: Record<NcrAction, string> = {
  assign: 'Assign',
  'corrective-action-complete': 'Mark Corrected',
  verify: 'Verify',
  reject: 'Reject',
  reopen: 'Reopen',
  close: 'Close',
};
