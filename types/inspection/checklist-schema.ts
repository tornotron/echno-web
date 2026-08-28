/**
 * The JSON checklist schema: single source of truth for the builder, the
 * preview, the runtime renderer, templates, versions and submissions.
 *
 * Nothing in this file knows about React. The element *registry* maps these
 * types to components; adding an element type means adding a variant here and
 * a registry entry, never touching the builder or renderer.
 */

// ---------------------------------------------------------------------------
// Element types
// ---------------------------------------------------------------------------

/** Field elements that capture a response. */
export const INPUT_ELEMENT_TYPES = [
  'text',
  'textarea',
  'number',
  'checkbox',
  'radio',
  'select',
  'multiselect',
  'date',
  'passFail',
  'yesNoNa',
  'rating',
  'comment',
  'photo',
  'video',
  'file',
  'signature',
] as const;

/** Presentational elements that never produce a response value. */
export const LAYOUT_ELEMENT_TYPES = [
  'section',
  'heading',
  'description',
  'divider',
] as const;

export type InputElementType = (typeof INPUT_ELEMENT_TYPES)[number];
export type LayoutElementType = (typeof LAYOUT_ELEMENT_TYPES)[number];
export type ElementType = InputElementType | LayoutElementType;

const INPUT_TYPE_SET = new Set<string>(INPUT_ELEMENT_TYPES);

/** True when the element captures a response value (vs. pure layout). */
export function isInputElement(type: ElementType): type is InputElementType {
  return INPUT_TYPE_SET.has(type);
}

/** Palette grouping for the builder's element list. */
export type ElementGroup = 'basic' | 'inspection' | 'layout';

// ---------------------------------------------------------------------------
// Conditional visibility
// ---------------------------------------------------------------------------

export const CONDITION_OPERATORS = [
  'equals',
  'notEquals',
  'contains',
  'isEmpty',
  'isNotEmpty',
] as const;

export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

export interface VisibilityCondition {
  /** Id of the element whose answer is being tested. */
  element: string;
  operator: ConditionOperator;
  /** Compared against the referenced element's response. */
  value?: ResponseValue;
}

/**
 * Visibility rule attached to an element.
 *
 * `when` is a list so `all`/`any` composition is available from the start;
 * the initial builder UI only authors a single condition, but the schema and
 * evaluator already handle several without a migration.
 */
export interface VisibilityRule {
  match?: 'all' | 'any';
  when: VisibilityCondition[];
}

// ---------------------------------------------------------------------------
// Options & validation
// ---------------------------------------------------------------------------

export interface ElementOption {
  /** Stored in the response. */
  value: string;
  /** Shown to the inspector. */
  label: string;
  /**
   * Optional weight used by scored checklists. `undefined` means the option
   * does not participate in scoring.
   */
  score?: number;
}

export interface ElementValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  /** Serialized regex source, applied to string responses. */
  pattern?: string;
}

// ---------------------------------------------------------------------------
// Elements
// ---------------------------------------------------------------------------

export type ResponseValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

/**
 * One node in the checklist tree.
 *
 * Only `section` populates `children`; the tree is deliberately two levels
 * deep so drag-and-drop stays predictable and the renderer stays flat.
 */
export interface ChecklistElement {
  id: string;
  type: ElementType;
  /** Field label, or section/heading title. */
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: ResponseValue;
  options?: ElementOption[];
  validation?: ElementValidation;
  visibility?: VisibilityRule;
  /** Section-only: render collapsed by default. */
  collapsible?: boolean;
  /** Section children. Empty for every non-section element. */
  children?: ChecklistElement[];
}

export interface ChecklistSettings {
  showProgress?: boolean;
  allowSaveDraft?: boolean;
  /** Compute a compliance score from scored options / passFail answers. */
  enableScoring?: boolean;
}

export interface ChecklistSchema {
  schemaVersion: number;
  type: 'checklist';
  title: string;
  description?: string;
  settings: ChecklistSettings;
  elements: ChecklistElement[];
}

/** Bumped only on breaking shape changes; readers branch on it. */
export const CURRENT_SCHEMA_VERSION = 1;

export function createEmptySchema(
  title = 'Untitled Checklist'
): ChecklistSchema {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    type: 'checklist',
    title,
    description: '',
    settings: {
      showProgress: true,
      allowSaveDraft: true,
      enableScoring: false,
    },
    elements: [],
  };
}

// ---------------------------------------------------------------------------
// Tree helpers
// ---------------------------------------------------------------------------

/** Depth-first list of every element, sections included. */
export function flattenElements(
  elements: ChecklistElement[]
): ChecklistElement[] {
  return elements.flatMap((element) => [
    element,
    ...flattenElements(element.children ?? []),
  ]);
}

/** Every element that captures a response, in render order. */
export function inputElements(schema: ChecklistSchema): ChecklistElement[] {
  return flattenElements(schema.elements).filter((element) =>
    isInputElement(element.type)
  );
}

export function findElement(
  elements: ChecklistElement[],
  id: string
): ChecklistElement | undefined {
  for (const element of elements) {
    if (element.id === id) return element;
    const hit = findElement(element.children ?? [], id);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * Clone a schema with fresh element ids.
 *
 * Used when instantiating a template so the new checklist never shares ids
 * with the template it came from. Responses key off element id, and reused
 * ids would silently collide across inspections.
 */
export function withNewElementIds(schema: ChecklistSchema): ChecklistSchema {
  const remap = (elements: ChecklistElement[]): ChecklistElement[] =>
    elements.map((element) => ({
      ...element,
      id: generateElementId(element.type),
      children: element.children ? remap(element.children) : undefined,
    }));

  return { ...schema, elements: remap(schema.elements) };
}

let idCounter = 0;

/** Readable, collision-resistant element id (`checkbox-lq4k2p-3`). */
export function generateElementId(type: ElementType): string {
  idCounter += 1;
  return `${type}-${Date.now().toString(36)}-${idCounter}`;
}
