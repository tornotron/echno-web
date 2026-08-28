// types/inspection/checklist-template.ts
//
// The reusable checklist template served from `/api/v1/checklist-templates/web`,
// matching the backend `ChecklistTemplateDto`.
//
// The backend stores a template as a flat, ordered list of check points keyed
// by trade, with a server-managed integer `version` that it bumps on every
// PUT. There is no version-history entity and no stored JSON schema, so a
// prior version cannot be fetched back and a checklist cannot carry branching
// logic. `checklist-schema.ts` describes the richer shape the builder edits;
// `template-schema-adapter.ts` converts between the two and documents exactly
// what the round trip cannot keep.
//
// Web-side only because @tornotron/echno-core does not model checklist
// templates yet; these belong beside the inspection contract in core.

import { parseUuid } from '@tornotron/echno-core';

/**
 * Trade a template applies to. One template per trade per organization, which
 * is why creating a second for the same trade returns 409.
 */
export enum InspectionTrade {
  PRE_CONSTRUCTION_DOCUMENTATION = 'pre-construction-documentation',
  SHUTTERING_FORMWORK = 'shuttering-formwork',
  REINFORCEMENT = 'reinforcement',
  RCC = 'rcc',
  MASONRY = 'masonry',
  PLASTERING = 'plastering',
  WATERPROOFING = 'waterproofing',
  FLOORING = 'flooring',
  FABRICATION = 'fabrication',
  ALUMINIUM_UPVC = 'aluminium-upvc',
  ELECTRICAL_FIXTURES = 'electrical-fixtures',
  PLUMBING_FIXTURES = 'plumbing-fixtures',
  SANITARY_FIXTURES = 'sanitary-fixtures',
  FINISHING = 'finishing',
  DIMENSIONAL_CHECK = 'dimensional-check',
  PROGRESS_CHECK = 'progress-check',
}

/** Broad grouping an inspection falls under, distinct from its type. */
export enum InspectionCategory {
  SAFETY = 'safety',
  QA_QC = 'qa-qc',
  COMPLIANCE = 'compliance',
  OTHER = 'other',
}

export const inspectionTradeLabels: Record<InspectionTrade, string> = {
  [InspectionTrade.PRE_CONSTRUCTION_DOCUMENTATION]:
    'Pre-construction Documentation',
  [InspectionTrade.SHUTTERING_FORMWORK]: 'Shuttering / Formwork',
  [InspectionTrade.REINFORCEMENT]: 'Reinforcement',
  [InspectionTrade.RCC]: 'RCC',
  [InspectionTrade.MASONRY]: 'Masonry',
  [InspectionTrade.PLASTERING]: 'Plastering',
  [InspectionTrade.WATERPROOFING]: 'Waterproofing',
  [InspectionTrade.FLOORING]: 'Flooring',
  [InspectionTrade.FABRICATION]: 'Fabrication',
  [InspectionTrade.ALUMINIUM_UPVC]: 'Aluminium / uPVC',
  [InspectionTrade.ELECTRICAL_FIXTURES]: 'Electrical Fixtures',
  [InspectionTrade.PLUMBING_FIXTURES]: 'Plumbing Fixtures',
  [InspectionTrade.SANITARY_FIXTURES]: 'Sanitary Fixtures',
  [InspectionTrade.FINISHING]: 'Finishing',
  [InspectionTrade.DIMENSIONAL_CHECK]: 'Dimensional Check',
  [InspectionTrade.PROGRESS_CHECK]: 'Progress Check',
};

export const inspectionCategoryLabels: Record<InspectionCategory, string> = {
  [InspectionCategory.SAFETY]: 'Safety',
  [InspectionCategory.QA_QC]: 'QA / QC',
  [InspectionCategory.COMPLIANCE]: 'Compliance',
  [InspectionCategory.OTHER]: 'Other',
};

/** Trades in the order work reaches them on site, for grouped pickers. */
export const inspectionTradeOrder: InspectionTrade[] = [
  InspectionTrade.PRE_CONSTRUCTION_DOCUMENTATION,
  InspectionTrade.SHUTTERING_FORMWORK,
  InspectionTrade.REINFORCEMENT,
  InspectionTrade.RCC,
  InspectionTrade.MASONRY,
  InspectionTrade.PLASTERING,
  InspectionTrade.WATERPROOFING,
  InspectionTrade.FLOORING,
  InspectionTrade.FABRICATION,
  InspectionTrade.ALUMINIUM_UPVC,
  InspectionTrade.ELECTRICAL_FIXTURES,
  InspectionTrade.PLUMBING_FIXTURES,
  InspectionTrade.SANITARY_FIXTURES,
  InspectionTrade.FINISHING,
  InspectionTrade.DIMENSIONAL_CHECK,
  InspectionTrade.PROGRESS_CHECK,
];

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

/**
 * One check point in a template.
 *
 * `lineOrder` is assigned server-side from the position of the item in the
 * submitted list, so it is read-only here and never sent back.
 */
export interface ChecklistTemplateItem {
  /** UUID primary key. */
  id: string;
  /** Grouping heading the check point sits under. */
  category: string;
  /** The check point itself. */
  checkPoint: string;
  /** Specification or acceptance criterion, long form. */
  specification?: string;
  /** The value the inspector should find. */
  expectedValue?: string;
  /** The rule that decides pass or fail. */
  acceptanceCriterion?: string;
  /** Permitted deviation from the expected value. */
  tolerance?: string;
  /** Whether photo evidence is required. */
  photosRequired: boolean;
  /** Priority (free text). */
  priority?: string;
  /** Server-assigned position within the template. */
  lineOrder: number;
}

/** A reusable checklist definition for one trade. */
export interface ChecklistTemplate {
  /** UUID primary key. */
  id: string;
  trade: InspectionTrade;
  name: string;
  description?: string;
  active: boolean;
  /** Server-managed counter, bumped on every update. */
  version: number;
  items: ChecklistTemplateItem[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * A product-supplied template an organization can adopt as its own. Read-only
 * and shared across tenants until adopted.
 */
export interface StarterChecklistTemplate {
  id: string;
  trade: InspectionTrade;
  name: string;
  description?: string;
  items: ChecklistTemplateItem[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function optionalString(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

export function parseChecklistTemplateItem(
  raw: Raw,
  index = 0
): ChecklistTemplateItem {
  return {
    id: parseUuid(raw?.id, 'parseChecklistTemplateItem.id'),
    category: raw?.category ?? '',
    checkPoint: raw?.checkPoint ?? '',
    specification: optionalString(raw?.specification),
    expectedValue: optionalString(raw?.expectedValue),
    acceptanceCriterion: optionalString(raw?.acceptanceCriterion),
    tolerance: optionalString(raw?.tolerance),
    photosRequired: raw?.photosRequired === true,
    priority: optionalString(raw?.priority),
    lineOrder:
      typeof raw?.lineOrder === 'number' ? (raw.lineOrder as number) : index,
  };
}

function parseItems(raw: unknown): ChecklistTemplateItem[] {
  return Array.isArray(raw)
    ? (raw as Raw[])
        .map((item, index) => parseChecklistTemplateItem(item, index))
        .toSorted((a, b) => a.lineOrder - b.lineOrder)
    : [];
}

export function parseChecklistTemplate(raw: Raw): ChecklistTemplate {
  return {
    id: parseUuid(raw?.id, 'parseChecklistTemplate.id'),
    trade: raw?.trade as InspectionTrade,
    name: raw?.name ?? '',
    description: optionalString(raw?.description),
    active: raw?.active !== false,
    version: typeof raw?.version === 'number' ? (raw.version as number) : 1,
    items: parseItems(raw?.items),
    createdAt: optionalString(raw?.createdAt),
    updatedAt: optionalString(raw?.updatedAt),
  };
}

export function parseStarterChecklistTemplate(
  raw: Raw
): StarterChecklistTemplate {
  return {
    id: parseUuid(raw?.id, 'parseStarterChecklistTemplate.id'),
    trade: raw?.trade as InspectionTrade,
    name: raw?.name ?? '',
    description: optionalString(raw?.description),
    items: parseItems(raw?.items),
  };
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

/** A check point on a create / update template request. */
export interface ChecklistTemplateItemRequest {
  category: string;
  checkPoint: string;
  specification?: string;
  expectedValue?: string;
  acceptanceCriterion?: string;
  tolerance?: string;
  photosRequired?: boolean;
  priority?: string;
}

/**
 * Create / update payload. `trade` is immutable after creation, so the update
 * path sends it unchanged and the backend rejects a different one.
 */
export interface ChecklistTemplateRequest {
  trade: InspectionTrade;
  name: string;
  description?: string;
  active?: boolean;
  /** Required and non-empty; replaces the item list wholesale on update. */
  items: ChecklistTemplateItemRequest[];
}

export function checklistTemplateRequestToJson(
  dto: ChecklistTemplateRequest
): Record<string, unknown> {
  return {
    trade: dto.trade,
    name: dto.name,
    description: dto.description,
    active: dto.active ?? true,
    items: dto.items.map((item) => ({
      category: item.category,
      checkPoint: item.checkPoint,
      specification: item.specification,
      expectedValue: item.expectedValue,
      acceptanceCriterion: item.acceptanceCriterion,
      tolerance: item.tolerance,
      photosRequired: item.photosRequired ?? false,
      priority: item.priority,
    })),
  };
}
