import { parsePositiveInt } from '@/types/parse-id';
import {
  type InspectionAttachment,
  parseInspectionAttachment,
} from './inspection-attachment';
import {
  InspectionResult,
  InspectionStatus,
  InspectionType,
} from './inspection-enums';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

/**
 * An inspection instance.
 *
 * The checklist itself is *not* embedded — the inspection points at the exact
 * template version it was created from (`templateVersionId`), so editing a
 * template later cannot change the meaning of a historical inspection.
 */
export interface Inspection {
  id: number;
  inspectionNumber: string;
  title: string;
  description?: string;
  type: InspectionType;
  status: InspectionStatus;
  result?: InspectionResult;

  projectId: number;
  projectName?: string;
  location?: string;

  inspectionDate: Date;

  inspectorId?: number;
  inspectorName?: string;

  /** Checklist definition reference — the version is the immutable half. */
  templateId?: number;
  templateName?: string;
  templateVersionId?: number;
  templateVersion?: number;

  compliancePercentage: number;
  openDefects: number;

  /**
   * Project documents referenced by this inspection (drawings, specs).
   * References only — the files stay owned by the project library.
   */
  referenceDocuments: InspectionAttachment[];

  createdAt: Date;
  updatedAt: Date;
}

export function parseInspection(raw: Raw): Inspection {
  return {
    id: parsePositiveInt(raw.id, 'parseInspection.id'),
    inspectionNumber: raw.inspectionNumber ?? '',
    title: raw.title,
    description: raw.description ?? undefined,
    type: raw.type as InspectionType,
    status: raw.status as InspectionStatus,
    result: (raw.result as InspectionResult | undefined) ?? undefined,

    projectId: parsePositiveInt(raw.projectId, 'parseInspection.projectId'),
    projectName: raw.projectName ?? undefined,
    location: raw.location ?? undefined,

    inspectionDate: new Date(raw.inspectionDate),

    inspectorId: raw.inspectorId ?? undefined,
    inspectorName: raw.inspectorName ?? undefined,

    templateId: raw.templateId ?? undefined,
    templateName: raw.templateName ?? undefined,
    templateVersionId: raw.templateVersionId ?? undefined,
    templateVersion: raw.templateVersion ?? undefined,

    compliancePercentage: raw.compliancePercentage ?? 0,
    openDefects: raw.openDefects ?? 0,

    referenceDocuments: Array.isArray(raw.referenceDocuments)
      ? (raw.referenceDocuments as Raw[]).map((item) =>
          parseInspectionAttachment(item)
        )
      : [],

    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}
