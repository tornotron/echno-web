// types/inspection/template-schema-adapter.ts
//
// Converts between the checklist schema the builder edits and the flat item
// list the backend stores.
//
// The two models are not the same shape and cannot be made so on the client.
// The backend keeps a template as an ordered list of check points, each with a
// category heading and a handful of inspection fields. The schema is a tree of
// typed elements. The mapping below is the faithful part of that overlap:
//
//   section          -> the `category` carried by every check point beneath it
//   input element    -> one ChecklistTemplateItem
//     label          -> checkPoint
//     description    -> specification
//     defaultValue   -> expectedValue
//     type + options -> acceptanceCriterion (the rule stated in words)
//     validation     -> tolerance (the permitted range, stated in words)
//     photo type     -> photosRequired
//     required       -> priority
//
// What the backend has nowhere to put, and so does not survive a save:
// conditional visibility rules, per-option scoring weights, regex validation,
// placeholder and default values for anything but a plain expected value,
// checklist-level settings, and nesting deeper than section -> element.
//
// Rather than smuggle those through a free-text column, where they would
// corrupt fields inspectors actually read, the builder palette is limited to
// the element types listed in REPRESENTABLE_ELEMENT_TYPES. Lifting that limit
// needs a schema column on the backend's ChecklistTemplate, not a client
// change.

import {
  type ChecklistElement,
  type ChecklistSchema,
  type ElementType,
  CURRENT_SCHEMA_VERSION,
  isInputElement,
} from './checklist-schema';
import {
  type ChecklistTemplateItem,
  type ChecklistTemplateItemRequest,
} from './checklist-template';

/**
 * Element types a stored template can represent.
 *
 * Everything here maps onto a check point the backend can hold without losing
 * its meaning. Types outside this list (multiselect, date, rating, checkbox,
 * video, file, signature, divider, description) have no column to land in and
 * are kept out of the builder palette until the backend grows one.
 */
export const REPRESENTABLE_ELEMENT_TYPES: ElementType[] = [
  'section',
  'heading',
  'passFail',
  'yesNoNa',
  'number',
  'text',
  'textarea',
  'comment',
  'select',
  'radio',
  'photo',
];

const REPRESENTABLE = new Set<string>(REPRESENTABLE_ELEMENT_TYPES);

export function isRepresentableElement(type: ElementType): boolean {
  return REPRESENTABLE.has(type);
}

const DEFAULT_CATEGORY = 'General';

/** States an element's pass rule in the words an inspector will read. */
function acceptanceCriterionFor(element: ChecklistElement): string | undefined {
  const options = element.options
    ?.map((option) => option.label)
    .filter(Boolean);

  switch (element.type) {
    case 'passFail':
      return 'Pass or fail';
    case 'yesNoNa':
      return 'Yes, no, or not applicable';
    case 'photo':
      return 'Photo evidence required';
    case 'select':
    case 'radio':
      return options?.length ? `One of: ${options.join(', ')}` : undefined;
    case 'number':
      return 'Recorded value within tolerance';
    default:
      return undefined;
  }
}

/** States a numeric element's permitted range as text. */
function toleranceFor(element: ChecklistElement): string | undefined {
  const { min, max } = element.validation ?? {};
  if (min != null && max != null) return `${min} to ${max}`;
  if (min != null) return `Minimum ${min}`;
  if (max != null) return `Maximum ${max}`;
  return undefined;
}

function expectedValueFor(element: ChecklistElement): string | undefined {
  const value = element.defaultValue;
  if (value == null || value === '' || typeof value === 'boolean') {
    return undefined;
  }
  return Array.isArray(value) ? value.join(', ') : String(value);
}

/**
 * Flattens a schema into the backend's item list.
 *
 * Section labels become the category on each check point beneath them;
 * elements at the top level fall under `General`. Order is the order the
 * builder shows, which the backend then pins as `lineOrder`.
 */
export function schemaToTemplateItems(
  schema: ChecklistSchema
): ChecklistTemplateItemRequest[] {
  const items: ChecklistTemplateItemRequest[] = [];

  const visit = (elements: ChecklistElement[], category: string): void => {
    for (const element of elements) {
      if (element.type === 'section' || element.type === 'heading') {
        visit(element.children ?? [], element.label || category);
        continue;
      }
      if (!isInputElement(element.type)) continue;
      if (!isRepresentableElement(element.type)) continue;

      items.push({
        category,
        checkPoint: element.label,
        specification: element.description,
        expectedValue: expectedValueFor(element),
        acceptanceCriterion: acceptanceCriterionFor(element),
        tolerance: toleranceFor(element),
        photosRequired: element.type === 'photo' || element.required === true,
        priority: element.required ? 'high' : undefined,
      });
    }
  };

  visit(schema.elements, DEFAULT_CATEGORY);
  return items;
}

/** Recovers the element type a stored check point was written from. */
function elementTypeFor(item: ChecklistTemplateItem): ElementType {
  const criterion = item.acceptanceCriterion?.toLowerCase() ?? '';
  if (criterion.startsWith('pass or fail')) return 'passFail';
  if (criterion.startsWith('yes, no')) return 'yesNoNa';
  if (criterion.startsWith('photo evidence')) return 'photo';
  if (criterion.startsWith('one of:')) return 'select';
  if (criterion.startsWith('recorded value')) return 'number';
  return 'passFail';
}

function optionsFor(item: ChecklistTemplateItem) {
  const criterion = item.acceptanceCriterion ?? '';
  if (!criterion.toLowerCase().startsWith('one of:')) return undefined;
  return criterion
    .slice(criterion.indexOf(':') + 1)
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => ({ value: label, label }));
}

/**
 * Rebuilds a schema from a stored item list so the builder can open a saved
 * template. Items are grouped back into sections by their category, in the
 * order the backend returned them.
 */
export function templateItemsToSchema(
  items: ChecklistTemplateItem[],
  title: string,
  description?: string
): ChecklistSchema {
  const sections = new Map<string, ChecklistElement>();

  for (const item of items) {
    const category = item.category || DEFAULT_CATEGORY;
    let section = sections.get(category);
    if (!section) {
      section = {
        id: `section-${sections.size + 1}`,
        type: 'section',
        label: category,
        collapsible: true,
        children: [],
      };
      sections.set(category, section);
    }

    section.children?.push({
      id: item.id,
      type: elementTypeFor(item),
      label: item.checkPoint,
      description: item.specification,
      required: item.priority === 'high',
      defaultValue: item.expectedValue,
      options: optionsFor(item),
    });
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    type: 'checklist',
    title,
    description: description ?? '',
    settings: {
      showProgress: true,
      allowSaveDraft: true,
      enableScoring: false,
    },
    elements: [...sections.values()],
  };
}
