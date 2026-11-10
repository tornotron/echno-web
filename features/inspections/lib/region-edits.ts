import {
  RegionEditKind,
  RegionOrigin,
  RegionShape,
  isRegionActive,
} from '@tornotron/echno-core/inspection/types';
import type {
  ObservationRegion,
  RegionBox,
  RegionEditOp,
  RegionPoint,
} from '@tornotron/echno-core/inspection/types';
import { polygonBounds, round6, sameBox, samePoints } from './region-geometry';

/**
 * The region editor's working copy and the op list it turns into.
 *
 * The editor never changes a stored region. It keeps one draft per active
 * region (with `sourceId` pointing back at it) plus a draft for each box the
 * reviewer draws, and on submit the difference becomes the WP1 `regions`
 * op list: a changed draft is a `replace` (geometry and class together, so
 * a class change is a `replace` with a different `classKey`), a removed one
 * a `remove`, and a new one an `add`. The backend retires the old row and
 * keeps both, so the prediction and the correction survive.
 */
export interface DraftRegion {
  /** Stable key for React and the editor's selection. */
  key: string;
  /** The stored region this draft started from; unset for a new one. */
  sourceId?: string;
  attachmentId: number;
  shape: RegionShape;
  /** The box; for a polygon, kept equal to the bounds of `points`. */
  box: RegionBox;
  /** `POLYGON` only. */
  points?: RegionPoint[];
  classKey: string;
  /** Producer score, carried for the label only; a correction has none. */
  score?: number;
  origin: RegionOrigin;
  /** True once the reviewer deleted it. Only drafts with a `sourceId` linger. */
  removed: boolean;
  imageWidth?: number;
  imageHeight?: number;
}

/** One draft per active region, in draw order. */
export function draftsFromRegions(
  regions: readonly ObservationRegion[]
): DraftRegion[] {
  return regions
    .filter((region) => isRegionActive(region))
    .toSorted((a, b) => a.lineOrder - b.lineOrder)
    .map((region) => ({
      key: region.id,
      sourceId: region.id,
      attachmentId: region.attachmentId,
      shape: region.shape,
      box: region.box,
      points: region.shape === RegionShape.POLYGON ? region.points : undefined,
      classKey: region.classKey,
      score: region.score,
      origin: region.origin,
      removed: false,
      imageWidth: region.imageWidth,
      imageHeight: region.imageHeight,
    }));
}

export type DraftAction =
  | {
      type: 'geometry';
      key: string;
      box?: RegionBox;
      points?: RegionPoint[];
    }
  | { type: 'class'; key: string; classKey: string }
  | { type: 'remove'; key: string }
  | { type: 'add'; draft: DraftRegion }
  | { type: 'reset'; drafts: DraftRegion[] };

/** The editor's reducer. A drawn region that is removed is simply dropped. */
export function draftsReducer(
  state: DraftRegion[],
  action: DraftAction
): DraftRegion[] {
  switch (action.type) {
    case 'geometry': {
      return state.map((draft) => {
        if (draft.key !== action.key) return draft;
        if (draft.shape === RegionShape.POLYGON && action.points) {
          return {
            ...draft,
            points: action.points,
            box: polygonBounds(action.points),
          };
        }
        return action.box ? { ...draft, box: action.box } : draft;
      });
    }
    case 'class': {
      return state.map((draft) =>
        draft.key === action.key
          ? { ...draft, classKey: action.classKey }
          : draft
      );
    }
    case 'remove': {
      return state.flatMap((draft) => {
        if (draft.key !== action.key) return [draft];
        return draft.sourceId ? [{ ...draft, removed: true }] : [];
      });
    }
    case 'add': {
      return [...state, action.draft];
    }
    case 'reset': {
      return action.drafts;
    }
  }
}

function changed(draft: DraftRegion, source: ObservationRegion): boolean {
  if (draft.classKey !== source.classKey) return true;
  if (draft.shape === RegionShape.POLYGON) {
    return !samePoints(draft.points, source.points);
  }
  return !sameBox(draft.box, source.box);
}

function roundedBox(box: RegionBox): RegionBox {
  return [round6(box[0]), round6(box[1]), round6(box[2]), round6(box[3])];
}

function roundedPoints(points: readonly RegionPoint[]): RegionPoint[] {
  return points.map(([x, y]) => [round6(x), round6(y)]);
}

/**
 * The op list for the review request: `replace` and `remove` in the stored
 * regions' draw order, then the `add`s in the order they were drawn. Empty
 * when nothing differs, which the request treats as no change.
 */
export function buildRegionOps(
  original: readonly ObservationRegion[],
  drafts: readonly DraftRegion[]
): RegionEditOp[] {
  const sources = new Map(
    original
      .filter((region) => isRegionActive(region))
      .map((region) => [region.id, region])
  );
  const ops: RegionEditOp[] = [];
  const bySource = new Map(
    drafts
      .filter((draft) => draft.sourceId)
      .map((draft) => [draft.sourceId as string, draft])
  );

  for (const source of [...sources.values()].toSorted(
    (a, b) => a.lineOrder - b.lineOrder
  )) {
    const draft = bySource.get(source.id);
    if (!draft || draft.removed) {
      ops.push({ op: RegionEditKind.REMOVE, regionId: source.id });
      continue;
    }
    if (!changed(draft, source)) continue;
    ops.push(
      draft.shape === RegionShape.POLYGON
        ? {
            op: RegionEditKind.REPLACE,
            regionId: source.id,
            shape: RegionShape.POLYGON,
            points: roundedPoints(draft.points ?? []),
            classKey: draft.classKey,
          }
        : {
            op: RegionEditKind.REPLACE,
            regionId: source.id,
            shape: RegionShape.BOX,
            box: roundedBox(draft.box),
            classKey: draft.classKey,
          }
    );
  }

  for (const draft of drafts) {
    if (draft.sourceId || draft.removed) continue;
    const base = {
      op: RegionEditKind.ADD as const,
      attachmentId: draft.attachmentId,
      classKey: draft.classKey,
      ...(draft.imageWidth === undefined
        ? {}
        : { imageWidth: draft.imageWidth }),
      ...(draft.imageHeight === undefined
        ? {}
        : { imageHeight: draft.imageHeight }),
    };
    ops.push(
      draft.shape === RegionShape.POLYGON
        ? {
            ...base,
            shape: RegionShape.POLYGON,
            points: roundedPoints(draft.points ?? []),
          }
        : { ...base, shape: RegionShape.BOX, box: roundedBox(draft.box) }
    );
  }
  return ops;
}

/**
 * True when the edits would leave no active region on an observation that
 * had regions from its producer. The backend refuses that MODIFY with 400,
 * since the reviewer is really saying the detection is wrong, which is a
 * rejection.
 */
export function leavesNoRegion(
  original: readonly ObservationRegion[],
  drafts: readonly DraftRegion[]
): boolean {
  const hadProducer = original.some(
    (region) =>
      isRegionActive(region) && region.origin === RegionOrigin.PRODUCER
  );
  return hadProducer && drafts.every((draft) => draft.removed);
}

/** A short count of the op list, for the editor's footer. */
export function describeOps(ops: readonly RegionEditOp[]): string {
  if (ops.length === 0) return 'No region changes';
  const count = (kind: RegionEditKind) =>
    ops.filter((op) => op.op === kind).length;
  const parts: string[] = [];
  const replaced = count(RegionEditKind.REPLACE);
  const removed = count(RegionEditKind.REMOVE);
  const added = count(RegionEditKind.ADD);
  if (replaced > 0) parts.push(`${replaced} corrected`);
  if (removed > 0) parts.push(`${removed} removed`);
  if (added > 0) parts.push(`${added} added`);
  return `Regions: ${parts.join(', ')}`;
}
