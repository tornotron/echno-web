import { describe, expect, test } from 'bun:test';
import { checkRanges, draftsOf } from './ranges';

describe('checkRanges', () => {
  test('sends whole ranges within the file', () => {
    expect(
      checkRanges(
        [
          { docClass: 'NIT', from: '1', to: '4' },
          { docClass: 'GCC', from: '5', to: '12' },
        ],
        12
      )
    ).toEqual({
      ranges: [
        { docClass: 'NIT', pageFrom: 1, pageTo: 4 },
        { docClass: 'GCC', pageFrom: 5, pageTo: 12 },
      ],
    });
  });

  test('names the first problem', () => {
    expect(checkRanges([{ docClass: 'NIT', from: '1', to: 'x' }], 12)).toEqual({
      problem: 'Range 1: enter whole page numbers.',
    });
    expect(checkRanges([{ docClass: 'NIT', from: '1', to: '13' }], 12)).toEqual(
      {
        problem: 'Range 1: the file has 12 pages.',
      }
    );
    expect(
      checkRanges(
        [
          { docClass: 'NIT', from: '1', to: '5' },
          { docClass: 'GCC', from: '5', to: '9' },
        ],
        12
      )
    ).toEqual({ problem: 'Pages 5 to 5 are in two ranges.' });
  });

  test('drafts come from page segments in page order, not sheets', () => {
    expect(
      draftsOf(
        [
          {
            id: 's2',
            docClass: 'GCC',
            pageFrom: 5,
            pageTo: 9,
            unreadPages: [],
          },
          { id: 's1', pageFrom: 1, pageTo: 4, unreadPages: [] },
          { id: 's3', sheetName: 'BOQ', unreadPages: [] },
        ],
        'NIT'
      )
    ).toEqual([
      { docClass: 'NIT', from: '1', to: '4' },
      { docClass: 'GCC', from: '5', to: '9' },
    ]);
  });
});
