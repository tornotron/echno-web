'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { useProvenance } from '@tornotron/echno-core/document-ingestion/hooks';
import { sourcePlace } from '../lib/source';
import { PageViewer } from './PageViewer';

interface ProvenanceListProps {
  targetType: string;
  targetId: string | undefined;
  /** File name by document id, for each source. */
  fileNames?: Record<string, string>;
  /** A name for a field, such as `Project name` for `projectName`. */
  fieldLabel?: (field: string) => string;
  emptyText?: string;
}

/**
 * Where each field of one record came from: the value read, the value a
 * person accepted, and a link that opens the page or cell it was read from.
 * A field entered by hand says so.
 */
export function ProvenanceList({
  targetType,
  targetId,
  fileNames = {},
  fieldLabel = (field) => field,
  emptyText = 'No field of this record came from a document.',
}: ProvenanceListProps) {
  const { data, isLoading, isError, error } = useProvenance(
    targetType,
    targetId
  );
  const [open, setOpen] = useState<string | null>(null);

  if (!targetId) return null;
  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading sources
      </div>
    );
  }
  if (isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {getErrorMessage(error)}
      </p>
    );
  }
  const rows = data ?? [];
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-3 text-sm" data-testid="provenance">
      {rows.map((row) => {
        const source = row.source;
        const fileName = source?.documentId
          ? fileNames[source.documentId]
          : undefined;
        return (
          <li key={row.id} className="flex flex-col gap-1">
            <div>
              <span className="font-medium">{fieldLabel(row.targetField)}</span>
              {': '}
              <span className="whitespace-pre-wrap">
                {row.valueAccepted ?? row.valueExtracted ?? ''}
              </span>
            </div>
            {row.enteredByHand ? (
              <span className="text-muted-foreground text-xs">
                Entered by hand
              </span>
            ) : source ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="text-primary w-fit text-xs hover:underline"
                  onClick={() => setOpen(open === row.id ? null : row.id)}
                >
                  {open === row.id
                    ? 'Hide source'
                    : `Source: ${sourcePlace(source, fileName)}`}
                </button>
                {row.valueExtracted !== undefined &&
                  row.valueAccepted !== undefined &&
                  row.valueExtracted !== row.valueAccepted && (
                    <span className="text-muted-foreground text-xs">
                      Read as {row.valueExtracted}, corrected by the reviewer.
                    </span>
                  )}
                {open === row.id && (
                  <PageViewer
                    source={source}
                    fileName={fileName}
                    className="max-w-sm"
                  />
                )}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">
                No source was kept for this field.
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
