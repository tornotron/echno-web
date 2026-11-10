'use client';

import type { PointerEvent as ReactPointerEvent, ReactNode, Ref } from 'react';
import {
  RegionOrigin,
  RegionShape,
} from '@tornotron/echno-core/inspection/types';
import type {
  ObservationRegion,
  RegionBox,
  RegionPoint,
} from '@tornotron/echno-core/inspection/types';
import { cn } from '@/lib/utils/index';
import { labelPlacement, svgPoints } from '../lib/region-geometry';
import {
  classLabel,
  labelTextColour,
  regionColour,
} from '../lib/region-taxonomy';

/** What the overlay needs to draw one region; stored regions and editor drafts both map to it. */
export interface OverlayRegion {
  id: string;
  shape: RegionShape;
  box: RegionBox;
  points?: RegionPoint[];
  classKey: string;
  score?: number;
  origin: RegionOrigin;
  /** Retired by a later review; drawn faint, and only with history on. */
  retired?: boolean;
}

/** A stored region in the overlay's shape. */
export function toOverlayRegion(region: ObservationRegion): OverlayRegion {
  return {
    id: region.id,
    shape: region.shape,
    box: region.box,
    points: region.points,
    classKey: region.classKey,
    score: region.score,
    origin: region.origin,
    retired: region.retiredAt !== undefined,
  };
}

/** The regions to draw: active ones always, retired ones only with history on. */
export function visibleRegions<T extends { retired?: boolean }>(
  regions: readonly T[],
  showHistory: boolean
): T[] {
  return regions.filter((region) => showHistory || !region.retired);
}

/** The SVG dash for a region: a model's guess is dashed until someone has reviewed it. */
export function regionDash(
  region: Pick<OverlayRegion, 'origin' | 'retired'>,
  reviewed: boolean
): string | undefined {
  if (region.retired) return '2 3';
  if (region.origin === RegionOrigin.PRODUCER && !reviewed) return '6 4';
  return undefined;
}

interface RegionOverlayProps {
  src: string;
  alt: string;
  regions: readonly OverlayRegion[];
  /** False while the observation is pending: producer regions are dashed. */
  reviewed: boolean;
  showHistory?: boolean;
  selectedId?: string;
  className?: string;
  /** Draw class and score labels. Off for small thumbnails. */
  showLabels?: boolean;
  /** The editor's hooks; without them the overlay is a picture. */
  onRegionPointerDown?: (
    id: string,
    event: ReactPointerEvent<SVGElement>
  ) => void;
  onBackgroundPointerDown?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  /** Extra HTML drawn over the image (the editor's handles). */
  children?: ReactNode;
  /** The positioned wrapper, which the editor measures for pointer input. */
  frameRef?: Ref<HTMLDivElement>;
}

/**
 * An evidence image with its regions drawn on top. The SVG uses
 * `viewBox="0 0 1 1"` with `preserveAspectRatio="none"`, so the stored
 * fractions are drawn as they are; `vector-effect="non-scaling-stroke"`
 * keeps the outline the same width however the image is scaled. Labels are
 * HTML positioned from the same fractions, because SVG text would stretch.
 * Browsers apply EXIF orientation to `<img>` by default, which is the frame
 * the coordinates are measured in.
 */
export function RegionOverlay({
  src,
  alt,
  regions,
  reviewed,
  showHistory = false,
  selectedId,
  className,
  showLabels = true,
  onRegionPointerDown,
  onBackgroundPointerDown,
  children,
  frameRef,
}: RegionOverlayProps) {
  const drawn = visibleRegions(regions, showHistory);
  const interactive = !!onRegionPointerDown;
  return (
    <div
      ref={frameRef}
      className={cn('relative w-full overflow-hidden select-none', className)}
      data-testid="region-overlay"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="block h-auto w-full"
      />
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className={cn(
          'absolute inset-0 h-full w-full',
          !interactive && !onBackgroundPointerDown && 'pointer-events-none'
        )}
        onPointerDown={onBackgroundPointerDown}
        role="presentation"
      >
        {drawn.map((region) => {
          const colour = regionColour(region.classKey);
          const selected = region.id === selectedId;
          const common = {
            stroke: colour,
            strokeWidth: selected ? 3 : 2,
            strokeDasharray: regionDash(region, reviewed),
            strokeOpacity: region.retired ? 0.55 : 1,
            fill: colour,
            fillOpacity: selected ? 0.22 : region.retired ? 0.04 : 0.1,
            vectorEffect: 'non-scaling-stroke' as const,
            'data-region-id': region.id,
            'data-testid': 'overlay-region',
            className: cn(interactive && !region.retired && 'cursor-move'),
            onPointerDown:
              interactive && !region.retired
                ? (event: ReactPointerEvent<SVGElement>) => {
                    event.stopPropagation();
                    onRegionPointerDown?.(region.id, event);
                  }
                : undefined,
          };
          return region.shape === RegionShape.POLYGON && region.points ? (
            <polygon
              key={region.id}
              points={svgPoints(region.points)}
              {...common}
            />
          ) : (
            <rect
              key={region.id}
              x={region.box[0]}
              y={region.box[1]}
              width={Math.max(0, region.box[2] - region.box[0])}
              height={Math.max(0, region.box[3] - region.box[1])}
              {...common}
            />
          );
        })}
      </svg>
      {showLabels &&
        drawn.map((region) => {
          const colour = regionColour(region.classKey);
          const place = labelPlacement(region.box);
          return (
            <span
              key={`label-${region.id}`}
              data-testid="overlay-label"
              className={cn(
                'pointer-events-none absolute rounded-sm px-1 text-[10px] leading-4 font-medium whitespace-nowrap',
                place.inside ? '' : '-translate-y-full',
                region.retired && 'line-through opacity-60'
              )}
              style={{
                left: place.left,
                top: place.top,
                backgroundColor: colour,
                color: labelTextColour(colour),
              }}
            >
              {classLabel(region.classKey)}
              {region.score === undefined
                ? ''
                : ` ${Math.round(region.score * 100)}%`}
            </span>
          );
        })}
      {children}
    </div>
  );
}
