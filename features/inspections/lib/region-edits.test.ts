import { describe, expect, test } from 'bun:test';
import {
  RegionEditKind,
  RegionOrigin,
  RegionShape,
  regionEditOpToJson,
} from '@tornotron/echno-core/inspection/types';
import type { ObservationRegion } from '@tornotron/echno-core/inspection/types';
import {
  buildRegionOps,
  describeOps,
  draftsFromRegions,
  draftsReducer,
  leavesNoRegion,
} from './region-edits';
import type { DraftRegion } from './region-edits';

/**
 * The region editor's op list (Phase 4 WP5, the WP1 `regions` change). What
 * is pinned: an untouched draft sends nothing; a moved box and a class change
 * are each a `replace` carrying the whole geometry and the class; a deleted
 * region is a `remove`; a drawn box is an `add` on its image; a polygon
 * replace sends points only; and removing every model region is flagged
 * because the backend refuses it.
 */

const HELMET = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VEST = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CRACK = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const RETIRED = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function region(overrides: Partial<ObservationRegion>): ObservationRegion {
  return {
    id: HELMET,
    attachmentId: 18_342,
    shape: RegionShape.BOX,
    box: [0.412, 0.188, 0.471, 0.262],
    classKey: 'ppe_helmet',
    score: 0.81,
    origin: RegionOrigin.PRODUCER,
    lineOrder: 0,
    imageWidth: 4032,
    imageHeight: 3024,
    ...overrides,
  };
}

const regions: ObservationRegion[] = [
  region({}),
  region({
    id: VEST,
    box: [0.1, 0.5, 0.2, 0.7],
    classKey: 'ppe_vest',
    lineOrder: 1,
  }),
  region({
    id: CRACK,
    shape: RegionShape.POLYGON,
    box: [0.1, 0.49, 0.21, 0.61],
    points: [
      [0.1, 0.52],
      [0.18, 0.49],
      [0.21, 0.61],
    ],
    classKey: 'crack',
    lineOrder: 2,
  }),
  region({
    id: RETIRED,
    lineOrder: 3,
    retiredAt: '2026-11-01T10:00:00Z',
  }),
];

function start(): DraftRegion[] {
  return draftsFromRegions(regions);
}

describe('drafts', () => {
  test('one draft per active region, in draw order; retired rows are left out', () => {
    expect(start().map((draft) => draft.sourceId)).toEqual([
      HELMET,
      VEST,
      CRACK,
    ]);
  });

  test('untouched drafts produce no ops', () => {
    expect(buildRegionOps(regions, start())).toEqual([]);
    expect(describeOps([])).toBe('No region changes');
  });
});

describe('op list', () => {
  test('a moved box is a replace with the new box and the same class', () => {
    const drafts = draftsReducer(start(), {
      type: 'geometry',
      key: HELMET,
      box: [0.4, 0.18, 0.48, 0.27],
    });
    expect(buildRegionOps(regions, drafts)).toEqual([
      {
        op: RegionEditKind.REPLACE,
        regionId: HELMET,
        shape: RegionShape.BOX,
        box: [0.4, 0.18, 0.48, 0.27],
        classKey: 'ppe_helmet',
      },
    ]);
  });

  test('a class change is a replace with the same box and the new class', () => {
    const drafts = draftsReducer(start(), {
      type: 'class',
      key: VEST,
      classKey: 'worker',
    });
    const ops = buildRegionOps(regions, drafts);
    expect(ops).toEqual([
      {
        op: RegionEditKind.REPLACE,
        regionId: VEST,
        shape: RegionShape.BOX,
        box: [0.1, 0.5, 0.2, 0.7],
        classKey: 'worker',
      },
    ]);
    expect(regionEditOpToJson(ops[0])).toEqual({
      op: 'replace',
      regionId: VEST,
      shape: 'box',
      box: [0.1, 0.5, 0.2, 0.7],
      classKey: 'worker',
    });
  });

  test('a deleted region is a remove', () => {
    const drafts = draftsReducer(start(), { type: 'remove', key: VEST });
    expect(buildRegionOps(regions, drafts)).toEqual([
      { op: RegionEditKind.REMOVE, regionId: VEST },
    ]);
  });

  test('a drawn box is an add on its image, with the image size when known', () => {
    const drafts = draftsReducer(start(), {
      type: 'add',
      draft: {
        key: 'new-1',
        attachmentId: 18_342,
        shape: RegionShape.BOX,
        box: [0.61, 0.2, 0.66, 0.27],
        classKey: 'ppe_helmet',
        origin: RegionOrigin.REVIEWER,
        removed: false,
        imageWidth: 4032,
        imageHeight: 3024,
      },
    });
    expect(buildRegionOps(regions, drafts)).toEqual([
      {
        op: RegionEditKind.ADD,
        attachmentId: 18_342,
        shape: RegionShape.BOX,
        box: [0.61, 0.2, 0.66, 0.27],
        classKey: 'ppe_helmet',
        imageWidth: 4032,
        imageHeight: 3024,
      },
    ]);
  });

  test('a drawn box removed again leaves nothing to send', () => {
    let drafts = draftsReducer(start(), {
      type: 'add',
      draft: {
        key: 'new-1',
        attachmentId: 18_342,
        shape: RegionShape.BOX,
        box: [0.61, 0.2, 0.66, 0.27],
        classKey: 'ppe_helmet',
        origin: RegionOrigin.REVIEWER,
        removed: false,
      },
    });
    drafts = draftsReducer(drafts, { type: 'remove', key: 'new-1' });
    expect(buildRegionOps(regions, drafts)).toEqual([]);
  });

  test('a dragged polygon vertex is a replace with points and no box', () => {
    const drafts = draftsReducer(start(), {
      type: 'geometry',
      key: CRACK,
      points: [
        [0.1, 0.52],
        [0.25, 0.45],
        [0.21, 0.61],
      ],
    });
    expect(drafts.find((draft) => draft.key === CRACK)?.box).toEqual([
      0.1, 0.45, 0.25, 0.61,
    ]);
    const ops = buildRegionOps(regions, drafts);
    expect(ops).toEqual([
      {
        op: RegionEditKind.REPLACE,
        regionId: CRACK,
        shape: RegionShape.POLYGON,
        points: [
          [0.1, 0.52],
          [0.25, 0.45],
          [0.21, 0.61],
        ],
        classKey: 'crack',
      },
    ]);
    expect(regionEditOpToJson(ops[0])).not.toHaveProperty('box');
  });

  test('replace and remove follow draw order, then adds', () => {
    let drafts = draftsReducer(start(), { type: 'remove', key: CRACK });
    drafts = draftsReducer(drafts, {
      type: 'add',
      draft: {
        key: 'new-1',
        attachmentId: 18_342,
        shape: RegionShape.BOX,
        box: [0.7, 0.7, 0.8, 0.8],
        classKey: 'worker',
        origin: RegionOrigin.REVIEWER,
        removed: false,
      },
    });
    drafts = draftsReducer(drafts, {
      type: 'class',
      key: HELMET,
      classKey: 'worker',
    });
    const ops = buildRegionOps(regions, drafts);
    expect(ops.map((op) => op.op)).toEqual([
      RegionEditKind.REPLACE,
      RegionEditKind.REMOVE,
      RegionEditKind.ADD,
    ]);
    expect(describeOps(ops)).toBe('Regions: 1 corrected, 1 removed, 1 added');
  });

  test('a geometry change rounding back to the stored value is not a change', () => {
    const drafts = draftsReducer(start(), {
      type: 'geometry',
      key: HELMET,
      box: [0.412_000_1, 0.188, 0.471, 0.262],
    });
    expect(buildRegionOps(regions, drafts)).toEqual([]);
  });
});

describe('refusal', () => {
  test('removing every model region is flagged; keeping one is not', () => {
    let drafts = start();
    for (const key of [HELMET, VEST]) {
      drafts = draftsReducer(drafts, { type: 'remove', key });
    }
    expect(leavesNoRegion(regions, drafts)).toBe(false);
    drafts = draftsReducer(drafts, { type: 'remove', key: CRACK });
    expect(leavesNoRegion(regions, drafts)).toBe(true);
  });

  test('an observation without model regions is never flagged', () => {
    const human = [region({ origin: RegionOrigin.HUMAN, score: undefined })];
    const drafts = draftsReducer(draftsFromRegions(human), {
      type: 'remove',
      key: HELMET,
    });
    expect(leavesNoRegion(human, drafts)).toBe(false);
  });
});
