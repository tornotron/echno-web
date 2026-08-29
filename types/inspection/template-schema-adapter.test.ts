import { describe, expect, test } from 'bun:test';
import type { ChecklistElement, ChecklistSchema } from './checklist-schema';
import { CURRENT_SCHEMA_VERSION } from './checklist-schema';
import {
  REPRESENTABLE_ELEMENT_TYPES,
  isRepresentableElement,
  schemaToTemplateItems,
  templateItemsToSchema,
} from './template-schema-adapter';
import type { ChecklistTemplateItem } from './checklist-template';

function schemaWith(elements: ChecklistElement[]): ChecklistSchema {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    type: 'checklist',
    title: 'RCC pour',
    description: '',
    settings: {},
    elements,
  };
}

describe('schemaToTemplateItems', () => {
  test('section labels become the category of every item beneath them', () => {
    const items = schemaToTemplateItems(
      schemaWith([
        {
          id: 's1',
          type: 'section',
          label: 'Reinforcement',
          children: [
            { id: 'e1', type: 'passFail', label: 'Cover blocks placed' },
            { id: 'e2', type: 'number', label: 'Bar spacing (mm)' },
          ],
        },
        { id: 'e3', type: 'yesNoNa', label: 'Drawings on site' },
      ])
    );

    expect(items.length).toBe(3);
    expect(items[0].category).toBe('Reinforcement');
    expect(items[1].category).toBe('Reinforcement');
    expect(items[2].category).toBe('General');
  });

  test('the pass rule and tolerance are stated in words', () => {
    const items = schemaToTemplateItems(
      schemaWith([
        {
          id: 'e1',
          type: 'number',
          label: 'Slump (mm)',
          validation: { min: 75, max: 125 },
        },
        {
          id: 'e2',
          type: 'select',
          label: 'Grade',
          options: [
            { value: 'M25', label: 'M25' },
            { value: 'M30', label: 'M30' },
          ],
        },
      ])
    );

    expect(items[0].acceptanceCriterion).toBe('Recorded value within tolerance');
    expect(items[0].tolerance).toBe('75 to 125');
    expect(items[1].acceptanceCriterion).toBe('One of: M25, M30');
  });

  test('only photo elements require photos; required maps to priority', () => {
    const items = schemaToTemplateItems(
      schemaWith([
        { id: 'e1', type: 'passFail', label: 'Formwork aligned', required: true },
        { id: 'e2', type: 'photo', label: 'Joint photo' },
      ])
    );

    expect(items[0].photosRequired).toBe(false);
    expect(items[0].priority).toBe('high');
    expect(items[1].photosRequired).toBe(true);
    expect(items[1].priority).toBeUndefined();
  });

  test('non-representable input types are dropped, never smuggled', () => {
    const items = schemaToTemplateItems(
      schemaWith([
        { id: 'e1', type: 'signature', label: 'Sign off' },
        { id: 'e2', type: 'passFail', label: 'Kept' },
      ])
    );

    expect(items.length).toBe(1);
    expect(items[0].checkPoint).toBe('Kept');
  });
});

describe('templateItemsToSchema', () => {
  const stored: ChecklistTemplateItem[] = [
    {
      id: 'a1',
      category: 'Reinforcement',
      checkPoint: 'Cover blocks placed',
      acceptanceCriterion: 'Pass or fail',
      photosRequired: false,
      priority: 'high',
      lineOrder: 0,
    },
    {
      id: 'a2',
      category: 'Reinforcement',
      checkPoint: 'Grade',
      acceptanceCriterion: 'One of: M25, M30',
      photosRequired: false,
      lineOrder: 1,
    },
    {
      id: 'a3',
      category: 'Concrete',
      checkPoint: 'Slump (mm)',
      acceptanceCriterion: 'Recorded value within tolerance',
      photosRequired: false,
      lineOrder: 2,
    },
  ];

  test('items group back into sections by category, element types recovered', () => {
    const schema = templateItemsToSchema(stored, 'RCC pour');

    expect(schema.elements.length).toBe(2);
    expect(schema.elements[0].label).toBe('Reinforcement');
    expect(schema.elements[0].children?.length).toBe(2);
    expect(schema.elements[0].children?.[0].type).toBe('passFail');
    expect(schema.elements[0].children?.[0].required).toBe(true);
    expect(schema.elements[0].children?.[1].type).toBe('select');
    expect(
      schema.elements[0].children?.[1].options?.map((o) => o.value)
    ).toEqual(['M25', 'M30']);
    expect(schema.elements[1].children?.[0].type).toBe('number');
  });

  test('a round trip through the backend shape keeps every check point', () => {
    const schema = templateItemsToSchema(stored, 'RCC pour');
    const back = schemaToTemplateItems(schema);

    expect(back.length).toBe(stored.length);
    expect(back.map((item) => item.checkPoint)).toEqual(
      stored.map((item) => item.checkPoint)
    );
    expect(back.map((item) => item.category)).toEqual(
      stored.map((item) => item.category)
    );
  });
});

describe('representable element types', () => {
  test('the guard agrees with the list the palette is built from', () => {
    for (const type of REPRESENTABLE_ELEMENT_TYPES) {
      expect(isRepresentableElement(type)).toBe(true);
    }
    expect(isRepresentableElement('signature')).toBe(false);
    expect(isRepresentableElement('date')).toBe(false);
    expect(isRepresentableElement('multiselect')).toBe(false);
  });
});
