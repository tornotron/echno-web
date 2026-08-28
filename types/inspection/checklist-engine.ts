/**
 * Pure evaluation logic over a {@link ChecklistSchema} and a response map.
 *
 * Deliberately framework-free: the builder preview, the runtime renderer and
 * the reports all call these same functions, so a checklist behaves
 * identically wherever it is rendered.
 */

import {
  type ChecklistElement,
  type ChecklistSchema,
  type ResponseValue,
  type VisibilityCondition,
  type VisibilityRule,
  flattenElements,
  isInputElement,
} from './checklist-schema';

/** Response map keyed by element id. */
export type ChecklistResponses = Record<string, ResponseValue>;

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

function isBlank(value: ResponseValue): boolean {
  if (value === null || value === undefined || value === '') return true;
  return Array.isArray(value) && value.length === 0;
}

function evaluateCondition(
  condition: VisibilityCondition,
  responses: ChecklistResponses
): boolean {
  const actual = responses[condition.element];

  switch (condition.operator) {
    case 'isEmpty': {
      return isBlank(actual);
    }
    case 'isNotEmpty': {
      return !isBlank(actual);
    }
    case 'equals': {
      return String(actual ?? '') === String(condition.value ?? '');
    }
    case 'notEquals': {
      return String(actual ?? '') !== String(condition.value ?? '');
    }
    case 'contains': {
      const needle = String(condition.value ?? '');
      return Array.isArray(actual)
        ? actual.includes(needle)
        : String(actual ?? '').includes(needle);
    }
    default: {
      return true;
    }
  }
}

/** An element with no rule is always visible. */
export function isElementVisible(
  element: ChecklistElement,
  responses: ChecklistResponses
): boolean {
  const rule: VisibilityRule | undefined = element.visibility;
  if (!rule || rule.when.length === 0) return true;

  return rule.match === 'any'
    ? rule.when.some((c) => evaluateCondition(c, responses))
    : rule.when.every((c) => evaluateCondition(c, responses));
}

/**
 * Every input element currently visible, in render order.
 * A hidden section hides its children regardless of their own rules.
 */
export function visibleInputElements(
  schema: ChecklistSchema,
  responses: ChecklistResponses
): ChecklistElement[] {
  const visible: ChecklistElement[] = [];

  const walk = (elements: ChecklistElement[]) => {
    for (const element of elements) {
      if (!isElementVisible(element, responses)) continue;
      if (isInputElement(element.type)) visible.push(element);
      walk(element.children ?? []);
    }
  };

  walk(schema.elements);
  return visible;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Validation errors keyed by element id. */
export type ChecklistErrors = Record<string, string>;

function validateElement(
  element: ChecklistElement,
  value: ResponseValue
): string | undefined {
  if (element.required && isBlank(value)) {
    // `checkbox` is required-means-must-be-ticked; everything else just needs a value.
    return element.type === 'checkbox'
      ? `${element.label} must be confirmed`
      : `${element.label} is required`;
  }
  if (element.type === 'checkbox' && element.required && value === false) {
    return `${element.label} must be confirmed`;
  }

  const rules = element.validation;
  if (!rules || isBlank(value)) return undefined;

  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min)
      return `${element.label} must be at least ${rules.min}`;
    if (rules.max !== undefined && value > rules.max)
      return `${element.label} must be at most ${rules.max}`;
  }

  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength)
      return `${element.label} must be at least ${rules.minLength} characters`;
    if (rules.maxLength !== undefined && value.length > rules.maxLength)
      return `${element.label} must be at most ${rules.maxLength} characters`;
    if (rules.pattern) {
      try {
        if (!new RegExp(rules.pattern).test(value))
          return `${element.label} is not in the expected format`;
      } catch {
        // An unparseable author-supplied pattern must not block submission.
      }
    }
  }

  return undefined;
}

/** Validates only the elements currently visible; hidden fields never block. */
export function validateChecklist(
  schema: ChecklistSchema,
  responses: ChecklistResponses
): ChecklistErrors {
  const errors: ChecklistErrors = {};

  for (const element of visibleInputElements(schema, responses)) {
    const message = validateElement(element, responses[element.id]);
    if (message) errors[element.id] = message;
  }

  return errors;
}

/**
 * How many elements beneath `element` currently carry a validation error.
 *
 * Lets a collapsed section advertise, and react to, trouble hidden inside
 * it. Only visible elements are ever validated, so a plain walk of the
 * subtree cannot pick up errors on fields the inspector can't reach.
 */
export function subtreeErrorCount(
  element: ChecklistElement,
  errors: ChecklistErrors
): number {
  let count = 0;

  const walk = (elements: ChecklistElement[]) => {
    for (const child of elements) {
      if (errors[child.id]) count += 1;
      walk(child.children ?? []);
    }
  };

  walk(element.children ?? []);
  return count;
}

// ---------------------------------------------------------------------------
// Progress & scoring
// ---------------------------------------------------------------------------

export interface ChecklistProgress {
  total: number;
  answered: number;
  /** 0–100, rounded. */
  percentage: number;
}

export function checklistProgress(
  schema: ChecklistSchema,
  responses: ChecklistResponses
): ChecklistProgress {
  const elements = visibleInputElements(schema, responses);
  const answered = elements.filter(
    (element) => !isBlank(responses[element.id])
  ).length;

  return {
    total: elements.length,
    answered,
    percentage:
      elements.length === 0
        ? 0
        : Math.round((answered / elements.length) * 100),
  };
}

export interface ChecklistScore {
  /** Elements that participate in scoring. */
  scorable: number;
  passed: number;
  failed: number;
  notApplicable: number;
  /** passed / (scorable - notApplicable), 0–100. */
  compliancePercentage: number;
}

/** Answers treated as a pass / fail / N-A by the compliance scorer. */
const PASS_VALUES = new Set(['PASS', 'YES', 'true']);
const FAIL_VALUES = new Set(['FAIL', 'NO', 'false']);
const NA_VALUES = new Set(['NA', 'N/A']);

/**
 * Compliance across `passFail`, `yesNoNa` and required `checkbox` elements.
 * Other element types carry no pass/fail meaning and are ignored.
 */
export function scoreChecklist(
  schema: ChecklistSchema,
  responses: ChecklistResponses
): ChecklistScore {
  let passed = 0;
  let failed = 0;
  let notApplicable = 0;

  const scorable = flattenElements(schema.elements).filter(
    (element) =>
      element.type === 'passFail' ||
      element.type === 'yesNoNa' ||
      element.type === 'checkbox'
  );

  for (const element of scorable) {
    const raw = responses[element.id];
    const value = String(raw ?? '');

    if (NA_VALUES.has(value)) notApplicable += 1;
    else if (PASS_VALUES.has(value)) passed += 1;
    else if (FAIL_VALUES.has(value)) failed += 1;
  }

  const denominator = passed + failed;

  return {
    scorable: scorable.length,
    passed,
    failed,
    notApplicable,
    compliancePercentage:
      denominator === 0 ? 0 : Math.round((passed / denominator) * 100),
  };
}
