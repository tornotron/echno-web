'use client';

import { getErrorMessage } from '@tornotron/echno-core';
import {
  isExtractJobActive,
  useRetryExtractJob,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  DocumentClassification,
  ExtractJob,
  UnreadPage,
} from '@tornotron/echno-core/document-ingestion/types';
import { Button } from '@/components/shadcn/button';
import { pagesLabel } from '../lib/labels';

interface UnreadEntry {
  key: string;
  fileName: string;
  pages: UnreadPage[];
  /** The job whose failed chunks can be sent again; absent when no page of this entry can be retried. */
  retryJob?: ExtractJob;
}

/** Each file's pages that were not read, from its parse, its parts and its reading jobs. */
export function unreadEntries(
  classifications: DocumentClassification[],
  jobs: ExtractJob[]
): UnreadEntry[] {
  const names = new Map(classifications.map((c) => [c.documentId, c.fileName]));
  const entries: UnreadEntry[] = [];
  for (const doc of classifications) {
    const pages = [
      ...doc.unreadPages,
      ...doc.segments.flatMap((s) => s.unreadPages),
    ];
    if (pages.length > 0) {
      entries.push({
        key: `doc-${doc.documentId}`,
        fileName: doc.fileName,
        pages,
      });
    }
  }
  for (const job of jobs) {
    const pages = [...job.failedPages, ...job.unreadPages];
    const retryable =
      (job.failedPages.length > 0 || job.chunksFailed > 0) &&
      !isExtractJobActive(job);
    if (pages.length === 0 && !retryable) continue;
    entries.push({
      key: `job-${job.id}`,
      fileName: names.get(job.documentId) ?? 'A file',
      pages,
      retryJob: retryable ? job : undefined,
    });
  }
  return entries;
}

function retryId(entry: UnreadEntry): string | undefined {
  return entry.retryJob?.id;
}

function reasons(pages: UnreadPage[]): string {
  return [...new Set(pages.map((p) => p.detail ?? p.reason))].join('; ');
}

/**
 * A partial result is kept, so a person reads every row that was read; this
 * banner names the pages that were not, file by file, and "Retry failed
 * parts" sends only the failed chunks of a job again. Pages not read because
 * the file reader could not open them, or because they are not in English,
 * are listed too, and a retry does not change them.
 */
export function UnreadPagesBanner({
  classifications,
  jobs,
}: {
  classifications: DocumentClassification[];
  jobs: ExtractJob[];
}) {
  const retry = useRetryExtractJob();
  const entries = unreadEntries(classifications, jobs);
  if (entries.length === 0) return null;
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-md border border-amber-300/60 bg-amber-50 p-3 text-sm dark:border-amber-500/20 dark:bg-amber-500/5"
      data-testid="unread-banner"
    >
      <p className="font-medium">
        Some pages were not read. What was read is kept for you to review; the
        values on these pages are missing from it.
      </p>
      <ul className="flex flex-col gap-1.5">
        {entries.map((entry) => (
          <li key={entry.key} className="flex flex-wrap items-center gap-2">
            <span>
              {entry.fileName}:{' '}
              {entry.pages.length > 0
                ? `${pagesLabel(entry.pages.map((p) => p.page))} not read (${reasons(entry.pages)})`
                : 'some parts could not be read'}
            </span>
            {retryId(entry) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={retry.isPending}
                onClick={() => retry.mutate(retryId(entry) ?? '')}
              >
                Retry failed parts
              </Button>
            )}
          </li>
        ))}
      </ul>
      {retry.isError && (
        <p role="alert" className="text-destructive">
          {getErrorMessage(retry.error)}
        </p>
      )}
    </div>
  );
}
