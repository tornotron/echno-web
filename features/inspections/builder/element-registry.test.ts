import { describe, expect, test } from 'bun:test';
import {
  ELEMENT_GROUPS,
  ELEMENT_GROUP_LABELS,
  ELEMENT_REGISTRY,
  createElement,
  definitionFor,
  elementsInGroup,
} from './element-registry';
import type { ElementDefinition } from './types';
import {
  CURRENT_SCHEMA_VERSION,
  isInputElement,
  isRepresentableElement,
  schemaToTemplateItems,
  type ChecklistElement,
  type ChecklistSchema,
  type ElementType,
} from '@/types/inspection';

const definitions: ElementDefinition[] = Object.values(ELEMENT_REGISTRY);

/** Types the schema still names but a stored template has no column for. */
const DROPPED_TYPES: ElementType[] = [
  'multiselect',
  'date',
  'rating',
  'checkbox',
  'video',
  'file',
  'signature',
  'divider',
  'description',
];

function schemaWith(elements: ChecklistElement[]): ChecklistSchema {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    type: 'checklist',
    title: 'Palette check',
    description: '',
    settings: {},
    elements,
  };
}

// ---------------------------------------------------------------------------
// The representability guard
//
// The palette is built from the registry, and the registry is keyed on
// RepresentableElementType so a type the adapter cannot represent is a compile
// error. Nothing in `bun test` typechecks, though, and the cost of the guard
// failing is an author filling in a field that is silently dropped on save.
// These are the runtime half of that guard.
// ---------------------------------------------------------------------------

describe('the builder palette cannot offer more than a template can hold', () => {
  test('every registered element type is representable', () => {
    const notRepresentable = definitions
      .map((definition) => definition.type)
      .filter((type) => !isRepresentableElement(type));

    expect(notRepresentable).toEqual([]);
  });

  test('the types the backend cannot hold are absent from the registry', () => {
    const offered = DROPPED_TYPES.filter((type) =>
      Object.hasOwn(ELEMENT_REGISTRY, type)
    );

    expect(offered).toEqual([]);
  });

  test('every registered input element survives the trip to the backend shape', () => {
    // One element of every input type the palette offers, all inside a
    // section so they carry a category. Anything the adapter cannot represent
    // is dropped on the way out, which is exactly the silent loss the palette
    // is meant to make impossible.
    const inputTypes = definitions
      .map((definition) => definition.type)
      .filter((type) => isInputElement(type));

    const items = schemaToTemplateItems(
      schemaWith([
        {
          id: 'section-1',
          type: 'section',
          label: 'Everything',
          children: inputTypes.map((type, index) => ({
            id: `element-${index}`,
            type,
            label: `Field ${type}`,
          })),
        },
      ])
    );

    expect(items.map((item) => item.checkPoint)).toEqual(
      inputTypes.map((type) => `Field ${type}`)
    );
  });
});

// ---------------------------------------------------------------------------
// Registry / palette wiring
// ---------------------------------------------------------------------------

describe('the registry and the palette agree', () => {
  test('every entry is keyed on the type it defines', () => {
    const mismatched = Object.entries(ELEMENT_REGISTRY)
      .filter(([key, definition]) => key !== definition.type)
      .map(([key]) => key);

    expect(mismatched).toEqual([]);
  });

  test('the palette groups between them show every registered element once', () => {
    const shown = ELEMENT_GROUPS.flatMap((group) =>
      elementsInGroup(group).map((definition) => definition.type)
    );

    expect(shown.toSorted()).toEqual(
      definitions.map((definition) => definition.type).toSorted()
    );
  });

  test('every palette group is labelled and carries at least one element', () => {
    for (const group of ELEMENT_GROUPS) {
      expect(ELEMENT_GROUP_LABELS[group]).toBeTruthy();
      expect(elementsInGroup(group).length).toBeGreaterThan(0);
    }
  });
});

describe('definitionFor', () => {
  test('a dropped type falls back to the unsupported notice, not a text field', () => {
    for (const type of DROPPED_TYPES) {
      expect(definitionFor(type).label).toBe('Unsupported element');
    }
  });

  test('a registered type resolves to its own definition', () => {
    expect(definitionFor('passFail').label).toBe('Pass / Fail');
    expect(definitionFor('photo').group).toBe('inspection');
  });
});

describe('createElement', () => {
  test('applies the registry defaults for the type', () => {
    const passFail = createElement('passFail', 'e1');
    expect(passFail.id).toBe('e1');
    expect(passFail.type).toBe('passFail');
    expect(passFail.label).toBe('Pass / Fail check');
    expect(passFail.required).toBe(true);

    const select = createElement('select', 'e2');
    expect(select.options?.length).toBe(2);

    const section = createElement('section', 'e3');
    expect(section.children).toEqual([]);
  });

  test('an unsupported type is built as an empty element rather than guessed at', () => {
    const signature = createElement('signature', 'e4');

    // The type is kept as asked so the canvas can show the notice; nothing is
    // invented to make it look like a working field.
    expect(signature.type).toBe('signature');
    expect(signature.label).toBe('Unsupported element');
    expect(signature.options).toBeUndefined();
  });
});
