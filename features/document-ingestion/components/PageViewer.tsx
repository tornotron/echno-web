'use client';

import { useState } from 'react';
import type { SourceRef } from '@tornotron/echno-core/document-ingestion/types';
import { cn } from '@/lib/utils';
import { boxOf, boxStyle, isSheetSource, sourcePlace } from '../lib/source';

interface PageViewerProps {
  source: SourceRef;
  fileName?: string;
  /**
   * A short-lived link to the worker's image of the page
   * (`page-images/<n>.webp`). Without one, the box is drawn on a blank page
   * of the same shape, so its place on the page still shows.
   */
  imageUrl?: string;
  className?: string;
}

/**
 * Where one value was read. For a page it draws the source box, normalized 0
 * to 1 from the top-left corner, over the page image; for a workbook it names
 * the sheet, row and cell. The quote is the text the value was read from,
 * shown as text, with whether it was found on the page.
 */
export function PageViewer({
  source,
  fileName,
  imageUrl,
  className,
}: PageViewerProps) {
  const [failed, setFailed] = useState(false);
  const place = sourcePlace(source, fileName);
  const box = boxOf(source);
  const sheet = isSheetSource(source);

  return (
    <figure
      className={cn('flex flex-col gap-2 text-sm', className)}
      data-testid="page-viewer"
    >
      <figcaption className="font-medium">{place}</figcaption>
      {!sheet && source.page !== undefined && (
        <div
          className="bg-background relative w-full overflow-hidden rounded-md border"
          style={{ aspectRatio: '1 / 1.414' }}
        >
          {imageUrl && !failed ? (
            // A presigned object-store link: the Next image optimizer would
            // fetch it again server side and outlive its expiry.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={`Page ${source.page} of ${fileName ?? 'the file'}`}
              className="absolute inset-0 h-full w-full object-fill"
              onError={() => setFailed(true)}
            />
          ) : (
            <p className="text-muted-foreground absolute inset-x-0 top-2 px-3 text-center text-xs">
              {imageUrl
                ? 'The page image did not load. The box shows where on the page the value is.'
                : 'The page image is not shown here yet. The box shows where on the page the value is.'}
            </p>
          )}
          {box ? (
            <div
              className="absolute border-2 border-amber-500 bg-amber-400/20"
              style={boxStyle(box)}
              data-testid="source-box"
              aria-label="Source box"
            />
          ) : (
            <p className="text-muted-foreground absolute inset-x-0 bottom-2 px-3 text-center text-xs">
              No box was recorded for this value on page {source.page}.
            </p>
          )}
        </div>
      )}
      {sheet && (
        <p className="text-muted-foreground text-xs">
          Open the workbook at this cell to check the value.
        </p>
      )}
      {source.quote !== undefined && source.quote !== '' && (
        <blockquote className="border-l-2 pl-3 whitespace-pre-wrap">
          {source.quote}
        </blockquote>
      )}
      <p
        className={cn(
          'text-xs',
          source.quoteVerified ? 'text-muted-foreground' : 'text-destructive'
        )}
      >
        {source.quoteVerified
          ? 'The quote was found on the page.'
          : 'The quote was not found on the page. Check the value against the file before accepting it.'}
      </p>
    </figure>
  );
}
