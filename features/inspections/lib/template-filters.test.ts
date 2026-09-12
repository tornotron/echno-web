import { describe, expect, test } from 'bun:test';
import type { ChecklistTemplate } from '@tornotron/echno-core/inspection/types';
import { filterTemplates } from './template-filters';

function template(over: Partial<ChecklistTemplate>): ChecklistTemplate {
  return {
    id: `id-${over.trade}`,
    name: over.trade ?? 'x',
    active: true,
    version: 1,
    items: [],
    ...over,
  };
}

const rcc = template({ trade: 'rcc', applicableElementTypes: ['column', 'beam'] });
const reinforcement = template({
  trade: 'reinforcement',
  applicableElementTypes: ['column', 'slab'],
});
const tiling = template({ trade: 'tiling' });

describe('filterTemplates', () => {
  test('no filters keeps everything', () => {
    expect(filterTemplates([rcc, reinforcement, tiling], { trade: '', elementType: '' })).toHaveLength(3);
  });

  test('an element type keeps templates that declare it and templates with no scope', () => {
    const out = filterTemplates([rcc, reinforcement, tiling], { trade: '', elementType: 'beam' });
    expect(out.map((t) => t.trade)).toEqual(['rcc', 'tiling']);
  });

  test('trade and element type combine', () => {
    const out = filterTemplates([rcc, reinforcement, tiling], {
      trade: 'reinforcement',
      elementType: 'column',
    });
    expect(out.map((t) => t.trade)).toEqual(['reinforcement']);
    expect(
      filterTemplates([rcc, reinforcement, tiling], { trade: 'reinforcement', elementType: 'beam' })
    ).toHaveLength(0);
  });
});
