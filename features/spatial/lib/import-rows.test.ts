import { describe, expect, test } from 'bun:test';
import { parseSpatialImportText } from './import-rows';

describe('parseSpatialImportText', () => {
  test('reads a headed CSV into import rows', () => {
    const { rows, errors } = parseSpatialImportText(
      'building,floor,zone,element,levelIndex,elementType\nB1,L03,Z1,C4,3,column\nB1,L03,,,3,\nB2,,,,,'
    );
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { building: 'B1', floor: 'L03', zone: 'Z1', element: 'C4', levelIndex: 3, elementType: 'column' },
      { building: 'B1', floor: 'L03', levelIndex: 3 },
      { building: 'B2' },
    ]);
  });

  test('reads tab-separated rows pasted from a sheet, positionally', () => {
    const { rows } = parseSpatialImportText('B1\tL03\tZ1\tC4\t3\tcolumn\nB1\tL04');
    expect(rows).toEqual([
      { building: 'B1', floor: 'L03', zone: 'Z1', element: 'C4', levelIndex: 3, elementType: 'column' },
      { building: 'B1', floor: 'L04' },
    ]);
  });

  test('reports a row with no building and a non-integer level index', () => {
    const { rows, errors } = parseSpatialImportText('building,floor,levelIndex\n,L01,1\nB1,L02,two\nB1,L03,3');
    expect(rows).toEqual([{ building: 'B1', floor: 'L03', levelIndex: 3 }]);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('line 2');
    expect(errors[1]).toContain('line 3');
  });
});
