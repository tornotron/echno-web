import type {
  RegionBox,
  RegionPoint,
} from '@tornotron/echno-core/inspection/types';

/**
 * Geometry for regions stored as fractions of the image as displayed (after
 * EXIF orientation): origin top left, x to the right, y down, each in
 * `[0, 1]`. The overlay draws these directly in an SVG with
 * `viewBox="0 0 1 1"`; the functions here cover the places that need
 * pixels (pointer input, labels, the grid's CSS crop) and the editor's
 * drags. Everything is pure so the maths has plain unit tests.
 */

/** The smallest box side the editor keeps, as a fraction of the image. */
export const MIN_REGION_SIZE = 0.005;

/** The stored precision: numeric(9,6). */
export function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** A box in pixels of an image rendered at `width` by `height`. */
export interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** `[x1, y1, x2, y2]` fractions to pixels of an image drawn at `width` x `height`. */
export function fractionBoxToPixels(
  box: RegionBox,
  width: number,
  height: number
): PixelRect {
  const [x1, y1, x2, y2] = box;
  return {
    left: x1 * width,
    top: y1 * height,
    width: (x2 - x1) * width,
    height: (y2 - y1) * height,
  };
}

/** A point in fractions to pixels. */
export function fractionToPixel(
  point: RegionPoint,
  width: number,
  height: number
): [number, number] {
  return [point[0] * width, point[1] * height];
}

/**
 * A pointer position to fractions of the element it is over, clamped to the
 * image so a drag past the edge pins the region to the edge.
 */
export function clientToFraction(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>
): RegionPoint {
  if (rect.width <= 0 || rect.height <= 0) return [0, 0];
  return [
    clamp01((clientX - rect.left) / rect.width),
    clamp01((clientY - rect.top) / rect.height),
  ];
}

/** The box two corners span, in either order, rounded to the stored scale. */
export function boxFromCorners(a: RegionPoint, b: RegionPoint): RegionBox {
  return [
    round6(clamp01(Math.min(a[0], b[0]))),
    round6(clamp01(Math.min(a[1], b[1]))),
    round6(clamp01(Math.max(a[0], b[0]))),
    round6(clamp01(Math.max(a[1], b[1]))),
  ];
}

/** True when the box is big enough to keep (both sides at least the minimum). */
export function isUsableBox(box: RegionBox): boolean {
  return (
    box[2] - box[0] >= MIN_REGION_SIZE && box[3] - box[1] >= MIN_REGION_SIZE
  );
}

/** The bounding box of a polygon's vertices. */
export function polygonBounds(points: readonly RegionPoint[]): RegionBox {
  if (points.length === 0) return [0, 0, 0, 0];
  let x1 = 1;
  let y1 = 1;
  let x2 = 0;
  let y2 = 0;
  for (const [x, y] of points) {
    x1 = Math.min(x1, x);
    y1 = Math.min(y1, y);
    x2 = Math.max(x2, x);
    y2 = Math.max(y2, y);
  }
  return [round6(x1), round6(y1), round6(x2), round6(y2)];
}

/**
 * Moves a box by `dx, dy`, stopping at the image edge without changing its
 * size.
 */
export function moveBox(box: RegionBox, dx: number, dy: number): RegionBox {
  const [x1, y1, x2, y2] = box;
  const sx = Math.min(Math.max(dx, -x1), 1 - x2);
  const sy = Math.min(Math.max(dy, -y1), 1 - y2);
  return [round6(x1 + sx), round6(y1 + sy), round6(x2 + sx), round6(y2 + sy)];
}

/** The eight drag handles on a box: corners and edge midpoints. */
export type BoxHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const BOX_HANDLES: readonly BoxHandle[] = [
  'nw',
  'n',
  'ne',
  'e',
  'se',
  's',
  'sw',
  'w',
];

/** Where a handle sits on `box`, in fractions. */
export function handlePosition(box: RegionBox, handle: BoxHandle): RegionPoint {
  const [x1, y1, x2, y2] = box;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const x = handle.includes('w') ? x1 : handle.includes('e') ? x2 : cx;
  const y = handle.startsWith('n') ? y1 : handle.startsWith('s') ? y2 : cy;
  return [x, y];
}

/**
 * Drags one handle of `box` to `point`. A corner moves two edges and an edge
 * handle one; the opposite edges stay put. An edge cannot pass its opposite
 * (the box keeps the minimum size), so `x1 < x2` and `y1 < y2` hold, which
 * is what the backend validates.
 */
export function resizeBox(
  box: RegionBox,
  handle: BoxHandle,
  point: RegionPoint
): RegionBox {
  let [x1, y1, x2, y2] = box;
  const [px, py] = [clamp01(point[0]), clamp01(point[1])];
  if (handle.includes('w')) x1 = Math.min(px, x2 - MIN_REGION_SIZE);
  if (handle.includes('e')) x2 = Math.max(px, x1 + MIN_REGION_SIZE);
  if (handle.startsWith('n')) y1 = Math.min(py, y2 - MIN_REGION_SIZE);
  if (handle.startsWith('s')) y2 = Math.max(py, y1 + MIN_REGION_SIZE);
  return [
    round6(clamp01(x1)),
    round6(clamp01(y1)),
    round6(clamp01(x2)),
    round6(clamp01(y2)),
  ];
}

/** Moves every vertex by `dx, dy`, stopping the whole polygon at the edge. */
export function movePoints(
  points: readonly RegionPoint[],
  dx: number,
  dy: number
): RegionPoint[] {
  const [x1, y1, x2, y2] = polygonBounds(points);
  const sx = Math.min(Math.max(dx, -x1), 1 - x2);
  const sy = Math.min(Math.max(dy, -y1), 1 - y2);
  return points.map(([x, y]) => [round6(x + sx), round6(y + sy)]);
}

/** Moves one vertex to `point`, inside the image. */
export function moveVertex(
  points: readonly RegionPoint[],
  index: number,
  point: RegionPoint
): RegionPoint[] {
  return points.map((vertex, i) =>
    i === index
      ? [round6(clamp01(point[0])), round6(clamp01(point[1]))]
      : vertex
  );
}

/** True when two boxes are the same at the stored precision. */
export function sameBox(a: RegionBox, b: RegionBox): boolean {
  return a.every((value, i) => round6(value) === round6(b[i]));
}

/** True when two vertex lists are the same at the stored precision. */
export function samePoints(
  a: readonly RegionPoint[] | undefined,
  b: readonly RegionPoint[] | undefined
): boolean {
  const left = a ?? [];
  const right = b ?? [];
  if (left.length !== right.length) return false;
  return left.every(
    (point, i) =>
      round6(point[0]) === round6(right[i][0]) &&
      round6(point[1]) === round6(right[i][1])
  );
}

/** The `points` attribute of an SVG polygon in the 0..1 viewBox. */
export function svgPoints(points: readonly RegionPoint[]): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

/**
 * Where a region's label goes, as CSS percentages of the image: above the
 * box's top-left corner, or just inside it when the box touches the top
 * edge and a label above would leave the image.
 */
export function labelPlacement(box: RegionBox): {
  left: string;
  top: string;
  inside: boolean;
} {
  const [x1, y1] = box;
  return {
    left: `${x1 * 100}%`,
    top: `${y1 * 100}%`,
    inside: y1 < 0.06,
  };
}

/** The share of each side added around a region in a grid tile. */
export const TILE_PADDING = 0.2;
/** The smallest crop, in image pixels, so a tiny detection keeps some context. */
export const TILE_MIN_CROP_PX = 64;
/** The smallest tile, in CSS pixels. */
export const TILE_MIN_SIZE_PX = 64;
/** The image aspect assumed when the producer did not send its size. */
const FALLBACK_ASPECT: [number, number] = [4, 3];

/**
 * One axis of a tile crop: `[lo, hi]` padded by `pad` each side, widened
 * to `minFraction`, then slid back inside `[0, 1]` before clamping, so a
 * crop against an edge keeps its width where the image allows it.
 */
function cropSpan(
  lo: number,
  hi: number,
  pad: number,
  minFraction: number
): [number, number] {
  let a = lo - pad;
  let b = hi + pad;
  const short = minFraction - (b - a);
  if (short > 0) {
    a -= short / 2;
    b += short / 2;
  }
  if (a < 0) {
    b -= a;
    a = 0;
  }
  if (b > 1) {
    a -= b - 1;
    b = 1;
  }
  return [clamp01(a), clamp01(b)];
}

export interface TileCrop {
  /** Tile side in CSS pixels. */
  size: number;
  /** `background-size` for the tile. */
  backgroundSize: string;
  /** `background-position` for the tile. */
  backgroundPosition: string;
  /** The image crop shown, as fractions `[x1, y1, x2, y2]`. */
  crop: RegionBox;
  /** Where the region itself sits in the tile, in CSS pixels. */
  region: PixelRect;
  /** Scale from image pixels to tile pixels. */
  scale: number;
}

/**
 * The CSS background crop for a grid tile: the region padded by 20 percent
 * on each side, widened to at least 64 image pixels, clamped to the image,
 * and scaled uniformly into a square tile of `tileSize` (at least 64 CSS
 * pixels) so the photo is never stretched. A crop that is not square is
 * centred in the tile.
 *
 * Image pixel sizes come from the region (`imageWidth`, `imageHeight`, sent
 * by the producer); without them a 4:3 photo is assumed, which only affects
 * the letterboxing, not which part of the photo is shown.
 */
export function tileCrop(
  box: RegionBox,
  tileSize: number,
  image: { width?: number; height?: number } = {}
): TileCrop {
  const size = Math.max(TILE_MIN_SIZE_PX, tileSize);
  const known = !!image.width && !!image.height;
  const iw = known ? (image.width as number) : FALLBACK_ASPECT[0] * 1000;
  const ih = known ? (image.height as number) : FALLBACK_ASPECT[1] * 1000;

  const [x1, y1, x2, y2] = box;
  const w = x2 - x1;
  const h = y2 - y1;
  const minFx = known ? Math.min(1, TILE_MIN_CROP_PX / iw) : 0;
  const minFy = known ? Math.min(1, TILE_MIN_CROP_PX / ih) : 0;
  const [cx1, cx2] = cropSpan(x1, x2, w * TILE_PADDING, minFx);
  const [cy1, cy2] = cropSpan(y1, y2, h * TILE_PADDING, minFy);

  const cropW = Math.max((cx2 - cx1) * iw, 1e-9);
  const cropH = Math.max((cy2 - cy1) * ih, 1e-9);
  const scale = size / Math.max(cropW, cropH);
  const bgW = iw * scale;
  const bgH = ih * scale;
  const offsetX = (size - cropW * scale) / 2;
  const offsetY = (size - cropH * scale) / 2;
  const posX = offsetX - cx1 * bgW;
  const posY = offsetY - cy1 * bgH;

  const px = (value: number) => `${Math.round(value * 100) / 100}px`;
  return {
    size,
    backgroundSize: `${px(bgW)} ${px(bgH)}`,
    backgroundPosition: `${px(posX)} ${px(posY)}`,
    crop: [round6(cx1), round6(cy1), round6(cx2), round6(cy2)],
    region: {
      left: posX + x1 * bgW,
      top: posY + y1 * bgH,
      width: w * bgW,
      height: h * bgH,
    },
    scale,
  };
}
