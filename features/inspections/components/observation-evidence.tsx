'use client';

import { FileText, Paperclip } from 'lucide-react';
import { AttachmentType } from '@tornotron/echno-core/attachment/types';
import type { Attachment } from '@tornotron/echno-core/attachment/types';
import type { Observation } from '@tornotron/echno-core/inspection/types';
import { useObservationEvidence } from '@/hooks/inspection';
import { Skeleton } from '@/components/shadcn/skeleton';
import { cn } from '@/lib/utils/index';

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
}: {
  observation: Pick<Observation, 'id' | 'evidenceRefs'>;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const { data: attachments, isLoading } = useObservationEvidence(
    observation.id
  );
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
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
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
