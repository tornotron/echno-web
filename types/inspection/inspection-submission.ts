import { parsePositiveInt } from '@/types/parse-id';
import type { ChecklistResponses } from './checklist-engine';
import { SubmissionStatus } from './inspection-enums';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

/**
 * An inspector's answers to one inspection's checklist.
 *
 * Responses are keyed by element id against the schema in the inspection's
 * pinned template version — which is why that version must never be mutated.
 */
export interface InspectionSubmission {
  id: number;
  inspectionId: number;
  status: SubmissionStatus;
  responses: ChecklistResponses;
  compliancePercentage: number;
  submittedById?: number;
  submittedByName?: string;
  submittedAt?: Date;
  updatedAt: Date;
}

function parseResponses(raw: unknown): ChecklistResponses {
  const value: unknown = typeof raw === 'string' ? safeJsonParse(raw) : raw;
  return value && typeof value === 'object'
    ? (value as ChecklistResponses)
    : {};
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function parseInspectionSubmission(raw: Raw): InspectionSubmission {
  return {
    id: parsePositiveInt(raw.id, 'parseInspectionSubmission.id'),
    inspectionId: parsePositiveInt(
      raw.inspectionId,
      'parseInspectionSubmission.inspectionId'
    ),
    status: (raw.status as SubmissionStatus) ?? SubmissionStatus.draft,
    responses: parseResponses(raw.responseJson ?? raw.responses),
    compliancePercentage: raw.compliancePercentage ?? 0,
    submittedById: raw.submittedById ?? undefined,
    submittedByName: raw.submittedByName ?? undefined,
    submittedAt: raw.submittedAt ? new Date(raw.submittedAt) : undefined,
    updatedAt: new Date(raw.updatedAt ?? Date.now()),
  };
}

export interface SaveInspectionSubmissionRequest {
  responses: ChecklistResponses;
  status: SubmissionStatus;
  compliancePercentage?: number;
}

export function submissionRequestToJson(
  dto: SaveInspectionSubmissionRequest
): Record<string, unknown> {
  return {
    responseJson: dto.responses,
    status: dto.status,
    compliancePercentage: dto.compliancePercentage,
  };
}
