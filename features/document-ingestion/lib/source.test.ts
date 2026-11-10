import { describe, expect, test } from 'bun:test';
import { pageSource } from '../test/mocks';
import { boxOf, boxStyle, sourcePlace } from './source';

describe('source boxes', () => {
  test('a normalized box becomes percentages from the top-left corner', () => {
    const box = boxOf(pageSource({ box: [0.1, 0.2, 0.6, 0.25] }));
    expect(box).toEqual([0.1, 0.2, 0.6, 0.25]);
    expect(boxStyle(box!)).toEqual({
      left: '10%',
      top: '20%',
      width: '50%',
      height: '5%',
    });
  });

  test('a box outside 0 to 1, inverted or short is not drawn', () => {
    expect(boxOf(pageSource({ box: [0.1, 0.2, 1.2, 0.3] }))).toBeUndefined();
    expect(boxOf(pageSource({ box: [0.6, 0.2, 0.1, 0.3] }))).toBeUndefined();
    expect(boxOf(pageSource({ box: [0.1, 0.2] }))).toBeUndefined();
    expect(boxOf(pageSource({ box: undefined }))).toBeUndefined();
  });
});

describe('sourcePlace', () => {
  test('a page', () => {
    expect(sourcePlace(pageSource(), 'NIT.pdf')).toBe('NIT.pdf, page 2');
  });

  test('a workbook cell', () => {
    const cell = pageSource({
      page: undefined,
      box: undefined,
      sheet: 'Milestones',
      rowNumber: 6,
      cell: 'C6',
    });
    expect(sourcePlace(cell, 'Schedule.xlsx')).toBe(
      'Schedule.xlsx, sheet Milestones, row 6, cell C6'
    );
  });
});
