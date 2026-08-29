import { beforeEach, describe, expect, test } from 'bun:test';
import {
  createEmptySchema,
  schemaToTemplateItems,
  templateItemsToSchema,
  type ChecklistElement,
  type ChecklistTemplateItem,
  type ElementType,
} from '@/types/inspection';
import { useBuilderStore } from './use-builder-store';

const store = () => useBuilderStore.getState();

beforeEach(() => {
  useBuilderStore.setState({
    schema: createEmptySchema(),
    selectedElementId: undefined,
    mode: 'builder',
    dirty: false,
    saving: false,
    past: [],
    future: [],
  });
});

/** Ids of the top-level elements, in canvas order. */
const topLevelIds = () => store().schema.elements.map((element) => element.id);

/** Labels of a section's children, in canvas order. */
function childLabels(sectionId: string): string[] {
  const section = store().schema.elements.find(
    (element) => element.id === sectionId
  );
  return (section?.children ?? []).map((child) => child.label);
}

/** Adds an element and returns the id the store assigned it. */
function add(type: ElementType, sectionId?: string): string {
  store().addElement(type, sectionId);
  return store().selectedElementId!;
}

// ---------------------------------------------------------------------------
// Editing
// ---------------------------------------------------------------------------

describe('adding and editing elements', () => {
  test('a new element is appended, selected and marks the checklist dirty', () => {
    const id = add('passFail');

    expect(topLevelIds()).toEqual([id]);
    expect(store().schema.elements[0].type).toBe('passFail');
    expect(store().selectedElementId).toBe(id);
    expect(store().dirty).toBe(true);
  });

  test('an element added against a section lands inside it, not beside it', () => {
    const sectionId = add('section');
    add('number', sectionId);

    expect(topLevelIds()).toEqual([sectionId]);
    expect(childLabels(sectionId)).toEqual(['Number']);
  });

  test('a patch reaches an element nested inside a section', () => {
    const sectionId = add('section');
    const childId = add('text', sectionId);

    store().updateElement(childId, { label: 'Cover to reinforcement', required: true });

    expect(childLabels(sectionId)).toEqual(['Cover to reinforcement']);
    const child = store().schema.elements[0].children?.[0];
    expect(child?.required).toBe(true);
  });

  test('a duplicate sits next to its source and shares no ids with it', () => {
    const sectionId = add('section');
    const childId = add('number', sectionId);
    store().updateElement(childId, { label: 'Slump' });

    store().duplicateElement(sectionId);

    expect(topLevelIds().length).toBe(2);
    const [original, copy] = store().schema.elements;
    expect(copy.id).not.toBe(original.id);
    expect(copy.children?.[0].label).toBe('Slump');
    // Responses key off element id, so a copy that reused them would collide.
    expect(copy.children?.[0].id).not.toBe(original.children?.[0].id);
    expect(store().selectedElementId).toBe(copy.id);
  });

  test('deleting a nested element removes it and clears the selection', () => {
    const sectionId = add('section');
    const childId = add('text', sectionId);

    store().deleteElement(childId);

    expect(childLabels(sectionId)).toEqual([]);
    expect(store().selectedElementId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Moving
// ---------------------------------------------------------------------------

describe('moving elements', () => {
  test('an element moves to the position of the one it was dropped on', () => {
    const first = add('text');
    const second = add('number');
    const third = add('photo');

    store().moveElement(third, first);

    expect(topLevelIds()).toEqual([third, first, second]);
  });

  test('an element dropped on a section is appended to its children', () => {
    const sectionId = add('section');
    const loose = add('passFail');

    store().moveIntoSection(loose, sectionId);

    expect(topLevelIds()).toEqual([sectionId]);
    expect(childLabels(sectionId)).toEqual(['Pass / Fail check']);
  });

  test('a section cannot be dropped inside itself, which would detach its children', () => {
    const sectionId = add('section');
    const childId = add('number', sectionId);
    const before = store().schema;

    store().moveElement(sectionId, childId);

    expect(store().schema).toBe(before);
    expect(childLabels(sectionId)).toEqual(['Number']);
  });

  test('a section cannot be nested inside another section', () => {
    const outer = add('section');
    const inner = add('section');
    const before = store().schema;

    store().moveIntoSection(inner, outer);

    expect(store().schema).toBe(before);
    expect(topLevelIds()).toEqual([outer, inner]);
  });
});

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

describe('undo and redo', () => {
  test('undo rewinds one edit and redo replays it', () => {
    const first = add('text');
    const second = add('number');

    store().undo();
    expect(topLevelIds()).toEqual([first]);

    store().redo();
    expect(topLevelIds()).toEqual([first, second]);
  });

  test('a fresh edit discards the redo stack', () => {
    add('text');
    store().undo();
    store().addElement('photo');

    expect(store().future).toEqual([]);
    store().redo();
    expect(store().schema.elements.map((element) => element.type)).toEqual([
      'photo',
    ]);
  });

  test('undo on an untouched checklist is a no-op', () => {
    const before = store().schema;

    store().undo();

    expect(store().schema).toBe(before);
    expect(store().dirty).toBe(false);
  });

  test('the undo stack is bounded so a long session cannot grow without limit', () => {
    for (let index = 0; index < 60; index += 1) store().addElement('text');

    expect(store().past.length).toBe(50);
  });

  test('loading a checklist replaces the schema and clears the history', () => {
    add('text');
    store().undo();

    store().load(createEmptySchema('Loaded'));

    expect(store().schema.title).toBe('Loaded');
    expect(store().past).toEqual([]);
    expect(store().future).toEqual([]);
    expect(store().dirty).toBe(false);
    expect(store().selectedElementId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// The save round trip
//
// The builder edits a tree; the backend stores a flat item list. Saving and
// reopening a checklist runs the schema through both halves of the adapter, so
// what an author gets back is what the adapter can reconstruct, not what they
// authored. The pins below are on that, since the failure mode is an author
// losing work with no error anywhere.
// ---------------------------------------------------------------------------

/** Flattens the store's schema and rebuilds it, as a save and reload does. */
function saveAndReopen() {
  const requests = schemaToTemplateItems(store().schema);
  // The backend assigns ids and a line order; the shape is otherwise the
  // request echoed back.
  const stored: ChecklistTemplateItem[] = requests.map((item, index) => ({
    ...item,
    id: `stored-${index}`,
    lineOrder: index,
  }));
  return templateItemsToSchema(stored, store().schema.title);
}

describe('saving and reopening a checklist', () => {
  test('no check point is lost, and each keeps its label and its section', () => {
    const sectionId = add('section');
    store().updateElement(sectionId, { label: 'Reinforcement' });
    store().updateElement(add('passFail', sectionId), { label: 'Cover blocks placed' });
    store().updateElement(add('number', sectionId), { label: 'Bar spacing' });

    const second = add('section');
    store().updateElement(second, { label: 'Concrete' });
    store().updateElement(add('photo', second), { label: 'Pour photo' });

    const reopened = saveAndReopen();

    expect(reopened.elements.map((element) => element.label)).toEqual([
      'Reinforcement',
      'Concrete',
    ]);
    expect(
      reopened.elements.flatMap((element) =>
        (element.children ?? []).map((child) => child.label)
      )
    ).toEqual(['Cover blocks placed', 'Bar spacing', 'Pour photo']);
  });

  /**
   * The recovered element type is inferred from the worded acceptance
   * criterion, and three of the palette's types write no criterion at all, so
   * they cannot be told apart on the way back. This is the documented lossy
   * case; the table is here so widening it is a test failure rather than a
   * surprise, and so narrowing it (by giving the backend a schema column) is
   * a deliberate edit to this list.
   */
  test('the element type an author picked survives, or degrades exactly here', () => {
    const authored: ElementType[] = [
      'passFail',
      'yesNoNa',
      'number',
      'photo',
      'select',
      'radio',
      'text',
      'textarea',
      'comment',
    ];

    const sectionId = add('section');
    store().updateElement(sectionId, { label: 'Everything' });
    for (const type of authored) {
      store().updateElement(add(type, sectionId), { label: type });
    }

    const reopened = saveAndReopen();
    const recovered = Object.fromEntries(
      (reopened.elements[0].children ?? []).map((child: ChecklistElement) => [
        child.label,
        child.type,
      ])
    );

    expect(recovered).toEqual({
      // Recovered as authored.
      passFail: 'passFail',
      yesNoNa: 'yesNoNa',
      number: 'number',
      photo: 'photo',
      select: 'select',
      // A radio and a select are both stored as "One of: ...", so a radio
      // comes back as a select.
      radio: 'select',
      // No acceptance criterion is written for these, so nothing distinguishes
      // them once stored and they fall back to a pass/fail check.
      text: 'passFail',
      textarea: 'passFail',
      comment: 'passFail',
    });
  });

  test('a numeric tolerance authored in the builder comes back on the item', () => {
    const id = add('number');
    store().updateElement(id, {
      label: 'Slump (mm)',
      validation: { min: 75, max: 125 },
    });

    const items = schemaToTemplateItems(store().schema);

    expect(items.length).toBe(1);
    expect(items[0].tolerance).toBe('75 to 125');
    expect(items[0].category).toBe('General');
  });
});
