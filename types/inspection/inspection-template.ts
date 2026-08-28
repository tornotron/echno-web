import { parsePositiveInt } from '@/types/parse-id';
import {
  type ChecklistSchema,
  CURRENT_SCHEMA_VERSION,
  createEmptySchema,
} from './checklist-schema';
import { TemplateCategory, InspectionType } from './inspection-enums';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

/**
 * The schema arrives as a JSON string from the backend's JSONB column on some
 * endpoints and as a parsed object on others. Normalise both, and never throw
 * on a malformed definition — a broken template must still be openable in the
 * builder so it can be repaired.
 */
export function parseChecklistSchema(raw: unknown): ChecklistSchema {
  const value: unknown =
    typeof raw === 'string' ? safeJsonParse(raw) : (raw ?? undefined);

  if (!value || typeof value !== 'object') return createEmptySchema();

  const candidate = value as Partial<ChecklistSchema>;
  return {
    schemaVersion: candidate.schemaVersion ?? CURRENT_SCHEMA_VERSION,
    type: 'checklist',
    title: candidate.title ?? 'Untitled Checklist',
    description: candidate.description ?? '',
    settings: candidate.settings ?? {
      showProgress: true,
      allowSaveDraft: true,
      enableScoring: false,
    },
    elements: Array.isArray(candidate.elements) ? candidate.elements : [],
  };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export interface InspectionTemplate {
  id: number;
  name: string;
  description?: string;
  category: TemplateCategory;
  /** Inspection type this template is intended for. */
  type: InspectionType;
  /** The current (draft) schema. Published snapshots live in versions. */
  schema: ChecklistSchema;
  /** Highest published version number, or 0 when never published. */
  currentVersion: number;
  currentVersionId?: number;
  createdById?: number;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function parseInspectionTemplate(raw: Raw): InspectionTemplate {
  return {
    id: parsePositiveInt(raw.id, 'parseInspectionTemplate.id'),
    name: raw.name,
    description: raw.description ?? undefined,
    category: raw.category as TemplateCategory,
    type: raw.type as InspectionType,
    schema: parseChecklistSchema(raw.schemaJson ?? raw.schema),
    currentVersion: raw.currentVersion ?? 0,
    currentVersionId: raw.currentVersionId ?? undefined,
    createdById: raw.createdById ?? undefined,
    createdByName: raw.createdByName ?? undefined,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Version — immutable published snapshot
// ---------------------------------------------------------------------------

export interface InspectionTemplateVersion {
  id: number;
  templateId: number;
  version: number;
  schema: ChecklistSchema;
  createdAt: Date;
}

export function parseInspectionTemplateVersion(
  raw: Raw
): InspectionTemplateVersion {
  return {
    id: parsePositiveInt(raw.id, 'parseInspectionTemplateVersion.id'),
    templateId: parsePositiveInt(
      raw.templateId,
      'parseInspectionTemplateVersion.templateId'
    ),
    version: raw.version ?? 1,
    schema: parseChecklistSchema(raw.schemaJson ?? raw.schema),
    createdAt: new Date(raw.createdAt),
  };
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface CreateInspectionTemplateRequest {
  name: string;
  description?: string;
  category: TemplateCategory;
  type: InspectionType;
  schema: ChecklistSchema;
}

export interface UpdateInspectionTemplateRequest {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  type?: InspectionType;
  schema?: ChecklistSchema;
  /** Publish the current schema as a new immutable version. */
  publish?: boolean;
}

/** Serializes a template request; the schema goes over the wire as JSON. */
export function templateRequestToJson(
  dto: CreateInspectionTemplateRequest | UpdateInspectionTemplateRequest
): Record<string, unknown> {
  const { schema, ...rest } = dto;
  return schema ? { ...rest, schemaJson: schema } : { ...rest };
}
