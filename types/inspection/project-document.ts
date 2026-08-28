import {
  type InspectionAttachment,
  parseInspectionAttachment,
} from './inspection-attachment';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

/**
 * A file already stored against a project — drawings, specifications, method
 * statements, permits.
 *
 * Inspections do not own these. They reference them, so attaching a drawing to
 * an inspection never copies the file and the project library stays the single
 * source of truth.
 */
export interface ProjectDocument extends InspectionAttachment {
  projectId: number;
  /** Grouping shown in the picker, e.g. "Drawings". */
  category?: string;
}

export function parseProjectDocument(raw: Raw): ProjectDocument {
  return {
    ...parseInspectionAttachment(raw),
    projectId: raw.projectId,
    category: raw.category ?? undefined,
  };
}
