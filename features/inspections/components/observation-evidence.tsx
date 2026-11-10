'use client';

import { useState } from 'react';
import { FileText, Paperclip } from 'lucide-react';
import { AttachmentType } from '@tornotron/echno-core/attachment/types';
import type { Attachment } from '@tornotron/echno-core/attachment/types';
import { isObservationPending } from '@tornotron/echno-core/inspection/types';
import type {
  Observation,
  ObservationRegion,
} from '@tornotron/echno-core/inspection/types';
import { useObservation, useObservationEvidence } from '@/hooks/inspection';
import type { ObservationEvidenceState } from '@/hooks/inspection';
import { Label } from '@/components/shadcn/label';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Switch } from '@/components/shadcn/switch';
import { cn } from '@/lib/utils/index';
import { RegionOverlay, toOverlayRegion } from './region-overlay';

/**
 * The attachments an observation cites, images as thumbnails and anything
 * else as a named link. Refs that point outside the Echno store (a frame in
 * a drone capture, a point-cloud id) are counted, since there is nothing to
 * render for them here.
 */
export function ObservationEvidenceStrip({
  observation,
  size = 'md',
  className,
  evidence,
}: {
  observation: Pick<Observation, 'id' | 'evidenceRefs'>;
  size?: 'sm' | 'md';
  className?: string;
  /**
   * Evidence already fetched for the page (see
   * `useObservationPageEvidence`). When given, the strip makes no request
   * of its own.
   */
  evidence?: ObservationEvidenceState;
}) {
  const own = useObservationEvidence(evidence ? undefined : observation.id);
  const attachments = evidence ? evidence.attachments : own.data;
  const isLoading = evidence ? evidence.isLoading : own.isLoading;
  const external = observation.evidenceRefs.filter(
    (ref) => typeof ref.attachmentId !== 'number'
  ).length;
  const box = size === 'sm' ? 'h-10 w-10' : 'h-20 w-20';

  if (isLoading) {
    return (
      <div className={cn('flex gap-2', className)}>
        <Skeleton className={cn(box, 'rounded-md')} />
      </div>
    );
  }
  const items: Attachment[] = attachments ?? [];
  if (items.length === 0 && external === 0) {
    return (
      <span className={cn('text-muted-foreground text-xs', className)}>
        No evidence
      </span>
    );
  }
  return (
    // The strip sits inside a clickable queue row: a thumbnail click opens
    // the file, and must not also open the review sheet through bubbling.
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {items.map((attachment) =>
        attachment.fileType === AttachmentType.image ? (
          <a
            key={attachment.id}
            href={attachment.file}
            target="_blank"
            rel="noreferrer"
            title={attachment.fileName}
            className={cn(box, 'overflow-hidden rounded-md border')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.file}
              alt={attachment.fileName}
              className="h-full w-full object-cover"
            />
          </a>
        ) : (
          <a
            key={attachment.id}
            href={attachment.file}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <FileText className="h-3 w-3" />
            <span className="max-w-32 truncate">{attachment.fileName}</span>
          </a>
        )
      )}
      {external > 0 && (
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Paperclip className="h-3 w-3" />
          {external} capture ref{external === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}

/**
 * The observation's regions, tolerating a row cached before regions were
 * served (the field is then absent rather than empty).
 */
export function regionsOf(
  observation: Pick<Observation, 'regions'>
): ObservationRegion[] {
  return observation.regions ?? [];
}

/**
 * The images a region is drawn on, in the order their first region appears,
 * followed by no others: an image with nothing on it stays in the strip.
 */
export function regionImages(
  regions: readonly ObservationRegion[],
  attachments: readonly Attachment[]
): Attachment[] {
  const byId = new Map(attachments.map((item) => [item.id, item]));
  const seen = new Set<number>();
  const images: Attachment[] = [];
  for (const region of regions) {
    if (seen.has(region.attachmentId)) continue;
    seen.add(region.attachmentId);
    const attachment = byId.get(region.attachmentId);
    if (attachment?.fileType === AttachmentType.image) images.push(attachment);
  }
  return images;
}

/**
 * The evidence viewer: each image that carries a region, drawn full width
 * with its regions on top. A model's regions are dashed until the
 * observation is reviewed. "Show history" reloads the observation with its
 * retired regions, so a corrected box can be compared with what the model
 * proposed. Regions are part of inspections, so this shows whether or not
 * the vision module is on.
 */
export function ObservationEvidenceViewer({
  observation,
}: {
  observation: Observation;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const { data: attachments } = useObservationEvidence(observation.id);
  const { data: withHistory } = useObservation(
    showHistory ? observation.id : undefined,
    { includeRetiredRegions: true }
  );
  const regions = regionsOf(
    showHistory && withHistory ? withHistory : observation
  );
  const images = regionImages(regions, attachments ?? []);
  if (regionsOf(observation).length === 0 && !showHistory) return null;
  if (images.length === 0) return null;
  const hasRetired = observation.reviewedAt !== undefined;

  return (
    <div className="space-y-2" data-testid="evidence-viewer">
      {images.map((image) => (
        <RegionOverlay
          key={image.id}
          src={image.file}
          alt={image.fileName}
          className="rounded-md border"
          reviewed={!isObservationPending(observation)}
          showHistory={showHistory}
          regions={regions
            .filter((region) => region.attachmentId === image.id)
            .map((region) => toOverlayRegion(region))}
        />
      ))}
      {hasRetired && (
        <div className="flex items-center gap-2">
          <Switch
            id={`region-history-${observation.id}`}
            checked={showHistory}
            onCheckedChange={setShowHistory}
          />
          <Label
            htmlFor={`region-history-${observation.id}`}
            className="text-xs"
          >
            Show history
          </Label>
        </div>
      )}
    </div>
  );
}
