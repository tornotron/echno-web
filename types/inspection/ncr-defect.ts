import { parsePositiveInt } from '@/types/parse-id';
import {
  type InspectionAttachment,
  parseInspectionAttachment,
} from './inspection-attachment';
import { NcrSeverity, NcrStatus } from './inspection-enums';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

/**
 * A non-conformance report / defect.
 *
 * Can stand alone (raised directly against a project) or be traced back to the
 * exact checklist item that failed — `inspectionId` + `checklistElementId`.
 * That pair is what links the NCR workflow to the inspection that found it.
 */
export interface NcrDefect {
  id: number;
  ncrNumber: string;
  title: string;
  description?: string;

  projectId: number;
  projectName?: string;

  /** Set when the NCR was raised from a failed checklist item. */
  inspectionId?: number;
  inspectionTitle?: string;
  checklistElementId?: string;
  checklistElementLabel?: string;

  location?: string;
  severity: NcrSeverity;
  status: NcrStatus;

  responsibleId?: number;
  responsibleName?: string;
  dueDate?: Date;

  correctiveAction?: string;
  /** Photos, video and documents captured when the NCR was raised. */
  evidence: InspectionAttachment[];

  createdById?: number;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export function parseNcrDefect(raw: Raw): NcrDefect {
  return {
    id: parsePositiveInt(raw.id, 'parseNcrDefect.id'),
    ncrNumber: raw.ncrNumber ?? '',
    title: raw.title,
    description: raw.description ?? undefined,

    projectId: parsePositiveInt(raw.projectId, 'parseNcrDefect.projectId'),
    projectName: raw.projectName ?? undefined,

    inspectionId: raw.inspectionId ?? undefined,
    inspectionTitle: raw.inspectionTitle ?? undefined,
    checklistElementId: raw.checklistElementId ?? undefined,
    checklistElementLabel: raw.checklistElementLabel ?? undefined,

    location: raw.location ?? undefined,
    severity: (raw.severity as NcrSeverity) ?? NcrSeverity.medium,
    status: (raw.status as NcrStatus) ?? NcrStatus.open,

    responsibleId: raw.responsibleId ?? undefined,
    responsibleName: raw.responsibleName ?? undefined,
    dueDate: raw.dueDate ? new Date(raw.dueDate) : undefined,

    correctiveAction: raw.correctiveAction ?? undefined,
    evidence: Array.isArray(raw.evidence)
      ? (raw.evidence as Raw[]).map((item) => parseInspectionAttachment(item))
      : [],

    createdById: raw.createdById ?? undefined,
    createdByName: raw.createdByName ?? undefined,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    closedAt: raw.closedAt ? new Date(raw.closedAt) : undefined,
  };
}

/** Statuses that are done with — nothing about them can still run late. */
export const SETTLED_STATUSES: ReadonlySet<NcrStatus> = new Set<NcrStatus>([
  NcrStatus.closed,
  NcrStatus.verified,
]);

/**
 * Whether an NCR has passed its due date without being settled.
 *
 * Compared against the start of today, so a defect due today is not overdue
 * until tomorrow — site teams work to the day, not the minute.
 */
export function isNcrOverdue(defect: NcrDefect): boolean {
  if (!defect.dueDate || SETTLED_STATUSES.has(defect.status)) return false;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return defect.dueDate < startOfToday;
}

/** Whole days an overdue NCR is past its due date; 0 when not overdue. */
export function ncrDaysOverdue(defect: NcrDefect): number {
  if (!isNcrOverdue(defect) || !defect.dueDate) return 0;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const due = new Date(defect.dueDate);
  due.setHours(0, 0, 0, 0);

  return Math.round((startOfToday.getTime() - due.getTime()) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Activity timeline
// ---------------------------------------------------------------------------

/**
 * One entry on an NCR's timeline.
 *
 * Comments and status changes share a single stream so the history reads in
 * order: a status move usually *is* the comment ("resealed, ready for QA"),
 * and splitting them would scatter the narrative.
 */
export interface NcrComment {
  id: number;
  ncrId: number;
  body: string;
  attachments: InspectionAttachment[];
  /** Present when this entry also moved the NCR's status. */
  fromStatus?: NcrStatus;
  toStatus?: NcrStatus;
  authorName?: string;
  createdAt: Date;
}

export function parseNcrComment(raw: Raw): NcrComment {
  return {
    id: parsePositiveInt(raw.id, 'parseNcrComment.id'),
    ncrId: parsePositiveInt(raw.ncrId, 'parseNcrComment.ncrId'),
    body: raw.body ?? '',
    attachments: Array.isArray(raw.attachments)
      ? (raw.attachments as Raw[]).map((item) =>
          parseInspectionAttachment(item)
        )
      : [],
    fromStatus: (raw.fromStatus as NcrStatus | undefined) ?? undefined,
    toStatus: (raw.toStatus as NcrStatus | undefined) ?? undefined,
    authorName: raw.authorName ?? undefined,
    createdAt: new Date(raw.createdAt ?? Date.now()),
  };
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface CreateNcrDefectRequest {
  title: string;
  description?: string;
  projectId: number;
  inspectionId?: number;
  checklistElementId?: string;
  checklistElementLabel?: string;
  location?: string;
  severity: NcrSeverity;
  responsibleId?: number;
  dueDate?: string;
  /** Evidence captured at the point of raising. Uploaded as multipart. */
  files?: File[];
}

export interface UpdateNcrDefectRequest {
  title?: string;
  description?: string;
  location?: string;
  severity?: NcrSeverity;
  status?: NcrStatus;
  /** `null` unassigns; omitted leaves the current holder in place. */
  responsibleId?: number | null;
  /** `null` clears the due date; omitted leaves it in place. */
  dueDate?: string | null;
  correctiveAction?: string;
}

export interface CreateNcrCommentRequest {
  body: string;
  /** Optional status transition recorded alongside the comment. */
  toStatus?: NcrStatus;
  files?: File[];
}
