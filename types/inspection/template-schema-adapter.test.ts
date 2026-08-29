import { describe, expect, test } from 'bun:test';
import type { ChecklistElement, ChecklistSchema } from './checklist-schema';
import { CURRENT_SCHEMA_VERSION } from './checklist-schema';
import {
  REPRESENTABLE_ELEMENT_TYPES,
  isRepresentableElement,
  schemaToTemplateItems,
  templateItemsToSchema,
} from './template-schema-adapter';
import type { ChecklistTemplateItem } from '@tornotron/echno-core/inspection/types';

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

/** Stands in for the backend, which assigns the id and the line order. */
function asStored(
  requests: ReturnType<typeof schemaToTemplateItems>
): ChecklistTemplateItem[] {
  return requests.map((request, index) => ({
    ...request,
    id: `stored-${index + 1}`,
    photosRequired: request.photosRequired ?? false,
    lineOrder: index,
  }));
}

/** Saves a schema the way the builder does, then opens it again. */
function reopen(schema: ChecklistSchema): ChecklistSchema {
  return templateItemsToSchema(
    asStored(schemaToTemplateItems(schema)),
    'RCC pour'
  );
}

function firstChild(schema: ChecklistSchema): ChecklistElement | undefined {
  return schema.elements[0].children?.[0];
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

    expect(items[0].acceptanceCriterion).toBe(
      'Recorded value within tolerance'
    );
    expect(items[0].tolerance).toBe('75 to 125');
    expect(items[1].acceptanceCriterion).toBe('One of: M25, M30');
  });

  test('only photo elements require photos; required maps to priority', () => {
    const items = schemaToTemplateItems(
      schemaWith([
        {
          id: 'e1',
          type: 'passFail',
          label: 'Formwork aligned',
          required: true,
        },
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

  test('a photo check point without a criterion is still recovered as a photo', () => {
    const schema = templateItemsToSchema(
      [
        {
          id: 'p1',
          category: 'Concrete',
          checkPoint: 'Joint photo',
          photosRequired: true,
          lineOrder: 0,
        },
      ],
      'RCC pour'
    );

    expect(schema.elements[0].children?.[0].type).toBe('photo');
  });
});

/**
 * The builder saves a template and the author opens it again. Everything the
 * flatten wrote has to survive the rebuild, so these go out through
 * `schemaToTemplateItems` and come back through `templateItemsToSchema`.
 */
describe('save and reopen', () => {
  test('a number element keeps both of its tolerance bounds', () => {
    const reopened = reopen(
      schemaWith([
        {
          id: 'e1',
          type: 'number',
          label: 'Slump (mm)',
          validation: { min: 75, max: 125 },
        },
      ])
    );
    const element = firstChild(reopened);

    expect(element?.type).toBe('number');
    expect(element?.validation?.min).toBe(75);
    expect(element?.validation?.max).toBe(125);
  });

  test('a one-sided tolerance keeps the bound it has and invents no other', () => {
    const lowerOnly = firstChild(
      reopen(
        schemaWith([
          {
            id: 'e1',
            type: 'number',
            label: 'Cover (mm)',
            validation: { min: 40 },
          },
        ])
      )
    );
    const upperOnly = firstChild(
      reopen(
        schemaWith([
          {
            id: 'e2',
            type: 'number',
            label: 'Chloride (%)',
            validation: { max: 0.15 },
          },
        ])
      )
    );

    expect(lowerOnly?.validation?.min).toBe(40);
    expect(lowerOnly?.validation?.max).toBeUndefined();
    expect(upperOnly?.validation?.max).toBe(0.15);
    expect(upperOnly?.validation?.min).toBeUndefined();
  });

  test('a negative bound survives the wording', () => {
    const element = firstChild(
      reopen(
        schemaWith([
          {
            id: 'e1',
            type: 'number',
            label: 'Deviation (mm)',
            validation: { min: -5, max: 5 },
          },
        ])
      )
    );

    expect(element?.validation?.min).toBe(-5);
    expect(element?.validation?.max).toBe(5);
  });

  test('a number element with no bounds comes back with no validation', () => {
    const element = firstChild(
      reopen(
        schemaWith([{ id: 'e1', type: 'number', label: 'Bar spacing (mm)' }])
      )
    );

    expect(element?.type).toBe('number');
    expect(element?.validation).toBeUndefined();
  });

  test('the label, specification, expected value and required flag come back', () => {
    const element = firstChild(
      reopen(
        schemaWith([
          {
            id: 's1',
            type: 'section',
            label: 'Concrete',
            children: [
              {
                id: 'e1',
                type: 'number',
                label: 'Slump (mm)',
                description: 'IS 1199 slump cone',
                defaultValue: '100',
                required: true,
                validation: { min: 75, max: 125 },
              },
            ],
          },
        ])
      )
    );

    expect(element?.label).toBe('Slump (mm)');
    expect(element?.description).toBe('IS 1199 slump cone');
    expect(element?.defaultValue).toBe('100');
    expect(element?.required).toBe(true);
    expect(element?.validation?.max).toBe(125);
  });

  test('a photo element still requires a photo after reopening', () => {
    const element = firstChild(
      reopen(schemaWith([{ id: 'e1', type: 'photo', label: 'Joint photo' }]))
    );

    expect(element?.type).toBe('photo');
  });

  test('select options survive; radio narrows to select, as the wording allows', () => {
    const element = firstChild(
      reopen(
        schemaWith([
          {
            id: 'e1',
            type: 'radio',
            label: 'Grade',
            options: [
              { value: 'M25', label: 'M25' },
              { value: 'M30', label: 'M30' },
            ],
          },
        ])
      )
    );

    // Accepted loss: both radio and select are stored as "One of: ...", so the
    // recovered type is the one the wording names. The choices themselves keep.
    expect(element?.type).toBe('select');
    expect(element?.options?.map((option) => option.value)).toEqual([
      'M25',
      'M30',
    ]);
  });

  test('free-text elements come back as passFail, the documented loss', () => {
    // Accepted loss, not a defect: text, textarea and comment carry no pass
    // rule, so the backend stores no acceptance criterion to recover them by.
    // Fixing it needs a schema column on ChecklistTemplate, not a client change.
    for (const type of ['text', 'textarea', 'comment'] as const) {
      const element = firstChild(
        reopen(schemaWith([{ id: 'e1', type, label: 'Remarks' }]))
      );
      expect(element?.type).toBe('passFail');
    }
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
