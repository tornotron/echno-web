import { describe, expect, test } from 'bun:test';
import {
  MIN_REGION_SIZE,
  TILE_MIN_SIZE_PX,
  boxFromCorners,
  clientToFraction,
  fractionBoxToPixels,
  fractionToPixel,
  handlePosition,
  isUsableBox,
  labelPlacement,
  moveBox,
  movePoints,
  moveVertex,
  polygonBounds,
  resizeBox,
  sameBox,
  tileCrop,
} from './region-geometry';

/**
 * The region maths (Phase 4 WP5): stored fractions to pixels and back, the
 * editor's drags, and the grid tile's CSS crop. Pinned because a slip here
 * draws every box in the wrong place without any error.
 */

describe('fractions and pixels', () => {
  test('a box in fractions maps onto the rendered image', () => {
    expect(fractionBoxToPixels([0.25, 0.1, 0.75, 0.6], 800, 600)).toEqual({
      left: 200,
      top: 60,
      width: 400,
      height: 300,
    });
  });

  test('a point maps the same way', () => {
    expect(fractionToPixel([0.5, 0.25], 4032, 3024)).toEqual([2016, 756]);
  });

  test('a pointer position becomes fractions of the element, clamped to the image', () => {
    const rect = { left: 100, top: 50, width: 400, height: 200 };
    expect(clientToFraction(300, 150, rect)).toEqual([0.5, 0.5]);
    expect(clientToFraction(0, 400, rect)).toEqual([0, 1]);
    expect(clientToFraction(300, 150, { ...rect, width: 0 })).toEqual([0, 0]);
  });

  test('a label sits above the box, or inside it at the top edge', () => {
    expect(labelPlacement([0.2, 0.5, 0.4, 0.7])).toEqual({
      left: '20%',
      top: '50%',
      inside: false,
    });
    expect(labelPlacement([0.2, 0.01, 0.4, 0.2]).inside).toBe(true);
  });
});

describe('editor drags', () => {
  test('drawing from either corner gives an ordered box at the stored scale', () => {
    expect(boxFromCorners([0.6, 0.7], [0.2, 0.123_456_7])).toEqual([
      0.2, 0.123_457, 0.6, 0.7,
    ]);
  });

  test('a box smaller than the minimum is not kept', () => {
    expect(isUsableBox([0.1, 0.1, 0.1 + MIN_REGION_SIZE, 0.2])).toBe(true);
    expect(isUsableBox([0.1, 0.1, 0.101, 0.2])).toBe(false);
  });

  test('moving a box keeps its size and stops at the edge', () => {
    expect(moveBox([0.1, 0.1, 0.3, 0.2], 0.1, 0.05)).toEqual([
      0.2, 0.15, 0.4, 0.25,
    ]);
    expect(moveBox([0.1, 0.1, 0.3, 0.2], 0.9, -0.5)).toEqual([0.8, 0, 1, 0.1]);
  });

  test('a corner moves two edges and an edge handle one', () => {
    const box: [number, number, number, number] = [0.2, 0.2, 0.6, 0.6];
    expect(resizeBox(box, 'se', [0.8, 0.9])).toEqual([0.2, 0.2, 0.8, 0.9]);
    expect(resizeBox(box, 'n', [0.9, 0.1])).toEqual([0.2, 0.1, 0.6, 0.6]);
    expect(resizeBox(box, 'w', [0.05, 0.9])).toEqual([0.05, 0.2, 0.6, 0.6]);
  });

  test('an edge cannot pass its opposite, so x1 < x2 and y1 < y2 hold', () => {
    const [x1, y1, x2, y2] = resizeBox([0.2, 0.2, 0.6, 0.6], 'nw', [0.9, 0.9]);
    expect(x1).toBeLessThan(x2);
    expect(y1).toBeLessThan(y2);
    expect(x2 - x1).toBeCloseTo(MIN_REGION_SIZE, 6);
  });

  test('handles sit on the corners and edge midpoints', () => {
    const box: [number, number, number, number] = [0.2, 0.4, 0.6, 0.8];
    expect(handlePosition(box, 'nw')).toEqual([0.2, 0.4]);
    expect(handlePosition(box, 'e')[0]).toBe(0.6);
    expect(handlePosition(box, 'e')[1]).toBeCloseTo(0.6, 9);
    expect(handlePosition(box, 's')[1]).toBe(0.8);
  });

  test('polygon moves keep every vertex inside the image', () => {
    const points: [number, number][] = [
      [0.1, 0.5],
      [0.3, 0.4],
      [0.2, 0.7],
    ];
    expect(polygonBounds(points)).toEqual([0.1, 0.4, 0.3, 0.7]);
    expect(movePoints(points, -0.5, 0)).toEqual([
      [0, 0.5],
      [0.2, 0.4],
      [0.1, 0.7],
    ]);
    expect(moveVertex(points, 1, [1.2, -0.1])).toEqual([
      [0.1, 0.5],
      [1, 0],
      [0.2, 0.7],
    ]);
  });

  test('boxes compare at the stored precision', () => {
    expect(sameBox([0.1, 0.2, 0.3, 0.4], [0.100_000_4, 0.2, 0.3, 0.4])).toBe(
      true
    );
    expect(sameBox([0.1, 0.2, 0.3, 0.4], [0.100_01, 0.2, 0.3, 0.4])).toBe(
      false
    );
  });
});

describe('grid tile crop', () => {
  test('pads the box by 20 percent a side and scales it into the tile without stretching', () => {
    // A 400 x 300 px box on a 4000 x 3000 photo; padded it is 560 x 420 px.
    const crop = tileCrop([0.4, 0.4, 0.5, 0.5], 140, {
      width: 4000,
      height: 3000,
    });
    expect(crop.crop).toEqual([0.38, 0.38, 0.52, 0.52]);
    expect(crop.scale).toBeCloseTo(140 / 560, 9);
    // The whole photo at that scale: 1000 x 750 px, never squashed.
    expect(crop.backgroundSize).toBe('1000px 750px');
    // The padded crop's top-left lands at the tile's left edge, centred vertically.
    const offsetY = (140 - 420 * crop.scale) / 2;
    expect(crop.backgroundPosition).toBe(
      `${-0.38 * 1000}px ${Math.round((offsetY - 0.38 * 750) * 100) / 100}px`
    );
    // The box itself is 100 x 75 px inside the 140 px tile.
    expect(crop.region.width).toBeCloseTo(100, 6);
    expect(crop.region.height).toBeCloseTo(75, 6);
    expect(crop.region.left).toBeCloseTo(20, 6);
  });

  test('a tiny detection is widened to at least 64 image pixels', () => {
    const crop = tileCrop([0.5, 0.5, 0.501, 0.501], 140, {
      width: 4000,
      height: 3000,
    });
    const [x1, y1, x2, y2] = crop.crop;
    expect((x2 - x1) * 4000).toBeCloseTo(64, 1);
    expect((y2 - y1) * 3000).toBeCloseTo(64, 1);
  });

  test('a crop against the edge slides back inside the image', () => {
    const crop = tileCrop([0, 0, 0.1, 0.1], 140, { width: 1000, height: 1000 });
    expect(crop.crop[0]).toBe(0);
    expect(crop.crop[1]).toBe(0);
    expect(crop.crop[2]).toBeCloseTo(0.14, 6);
  });

  test('the tile is never smaller than 64 px', () => {
    expect(tileCrop([0.1, 0.1, 0.2, 0.2], 20).size).toBe(TILE_MIN_SIZE_PX);
  });

  test('without the image size it still crops to the padded box', () => {
    const crop = tileCrop([0.4, 0.4, 0.5, 0.5], 140);
    expect(crop.crop).toEqual([0.38, 0.38, 0.52, 0.52]);
  });
});
