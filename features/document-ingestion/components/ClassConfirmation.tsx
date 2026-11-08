'use client';

import { useState } from 'react';
import { CheckCheck, Loader2, Plus, X } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useClassifyIngestDocument,
  useConfirmAllClassifications,
  useIngestClassifications,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  ConfirmAllResult,
  DocClass,
  DocumentClassification,
} from '@tornotron/echno-core/document-ingestion/types';
import { DOC_CLASSES } from '@tornotron/echno-core/document-ingestion/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  classMethodLabels,
  docClassLabel,
  docClassLabels,
  extractJobStatusLabels,
  segmentStatusLabels,
} from '../lib/labels';
import { checkRanges, draftsOf, type RangeDraft } from '../lib/ranges';
import { SELECT_CLASS } from '../lib/styles';

export const CLASSIFICATION_PAGE_SIZE = 100;

/**
 * What each file is, as a rule or the AI service proposed it, for a person to
 * confirm. A file holding several documents is split into page ranges, each
 * under its own class. Nothing is read from a file until its class is
 * confirmed; "Confirm all" confirms every proposal as it stands.
 */
export function ClassConfirmation({ packageId }: { packageId: string }) {
  const { data, isLoading, isError, error } = useIngestClassifications(
    packageId,
    { size: CLASSIFICATION_PAGE_SIZE }
  );
  const confirmAll = useConfirmAllClassifications();
  const [result, setResult] = useState<ConfirmAllResult | null>(null);

  const docs = data?.content ?? [];
  const open = docs.filter((d) => !d.confirmed && d.docClass);

  return (
    <div className="flex flex-col gap-4" data-testid="class-confirmation">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={open.length === 0 || confirmAll.isPending}
          onClick={() => {
            setResult(null);
            confirmAll
              .mutateAsync(packageId)
              .then((r) => r && setResult(r))
              .catch(() => {});
          }}
        >
          {confirmAll.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCheck className="size-4" />
          )}
          Confirm all proposed classes
        </Button>
        <span className="text-muted-foreground text-sm">
          {open.length === 1
            ? '1 file waits for its class to be confirmed.'
            : `${open.length} files wait for their class to be confirmed.`}
        </span>
      </div>
      {confirmAll.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(confirmAll.error)}
        </p>
      )}
      {result && (
        <p role="status" className="text-sm">
          Confirmed {result.documentsConfirmed} files and{' '}
          {result.segmentsConfirmed} parts; {result.jobsQueued} reading jobs
          queued.
          {result.remaining > 0 &&
            ` ${result.remaining} are left. Press confirm all again.`}
        </p>
      )}
      {isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading classes
        </div>
      )}
      {isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(error)}
        </p>
      )}
      {data && docs.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No files are classified yet. Each file is classified once it is read.
        </p>
      )}
      <ul className="flex flex-col gap-4">
        {docs.map((doc) => (
          <li key={doc.documentId}>
            <DocumentClassRow doc={doc} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocumentClassRow({ doc }: { doc: DocumentClassification }) {
  const classify = useClassifyIngestDocument();
  const initial: DocClass = doc.docClass ?? 'OTHER';
  const [docClass, setDocClass] = useState<DocClass>(initial);
  const [drafts, setDrafts] = useState<RangeDraft[]>(() =>
    draftsOf(doc.segments, initial)
  );
  const [problem, setProblem] = useState<string | null>(null);
  const job = doc.classification;
  const pending = !doc.docClass;
  const paged = (doc.pageCount ?? 0) > 1;
  const sheets = doc.segments.filter((s) => s.sheetName);

  const confirm = () => {
    setProblem(null);
    let segments;
    if (paged && drafts.length > 0) {
      const checked = checkRanges(drafts, doc.pageCount);
      if ('problem' in checked) {
        setProblem(checked.problem);
        return;
      }
      segments = checked.ranges;
    }
    classify.mutate({
      documentId: doc.documentId,
      req: { docClass, ...(segments ? { segments } : {}) },
    });
  };

  const setDraft = (index: number, next: Partial<RangeDraft>) =>
    setDrafts((current) =>
      current.map((d, i) => (i === index ? { ...d, ...next } : d))
    );

  return (
    <div
      className="flex flex-col gap-3 rounded-md border p-3 text-sm"
      data-testid={`class-${doc.documentId}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{doc.fileName}</span>
        {doc.pageCount !== undefined && (
          <span className="text-muted-foreground">{doc.pageCount} pages</span>
        )}
        {doc.confirmed ? (
          <Badge variant="secondary">Confirmed</Badge>
        ) : pending ? (
          <Badge variant="outline">
            {job ? extractJobStatusLabels[job.status] : 'Not classified yet'}
          </Badge>
        ) : (
          <Badge variant="outline">To confirm</Badge>
        )}
      </div>
      {doc.docClass && (
        <p>
          Proposed: {docClassLabel(doc.docClass)}
          {doc.classMethod ? `, ${classMethodLabels[doc.classMethod]}` : ''}
          {doc.classReason && (
            <span className="text-muted-foreground">. {doc.classReason}</span>
          )}
        </p>
      )}
      {job?.message && <p className="text-muted-foreground">{job.message}</p>}
      {doc.segments.length > 0 && (
        <ul className="text-muted-foreground flex flex-col gap-0.5 text-xs">
          {doc.segments.map((s) => (
            <li key={s.id}>
              {s.sheetName
                ? `Sheet ${s.sheetName}`
                : `Pages ${s.pageFrom ?? '?'} to ${s.pageTo ?? '?'}`}
              : {docClassLabel(s.docClass)}
              {s.status ? `, ${segmentStatusLabels[s.status]}` : ''}
              {s.reason ? `. ${s.reason}` : ''}
            </li>
          ))}
        </ul>
      )}
      {!pending && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`class-of-${doc.documentId}`}>Class</Label>
              <select
                id={`class-of-${doc.documentId}`}
                className={SELECT_CLASS}
                value={docClass}
                onChange={(event) =>
                  setDocClass(event.target.value as DocClass)
                }
              >
                {DOC_CLASSES.map((value) => (
                  <option key={value} value={value}>
                    {docClassLabels[value]}
                  </option>
                ))}
              </select>
            </div>
            {paged && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDrafts((current) => [
                    ...current,
                    { docClass, from: '', to: '' },
                  ])
                }
              >
                <Plus className="size-4" />
                Add a page range
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={classify.isPending}
              onClick={confirm}
            >
              {doc.confirmed ? 'Save classes' : 'Confirm'}
            </Button>
          </div>
          {sheets.length > 0 && (
            <p className="text-muted-foreground text-xs">
              A workbook is split by sheet, so it has no page ranges.
            </p>
          )}
          {drafts.length > 0 && (
            <ul className="flex flex-col gap-2">
              {drafts.map((draft, index) => (
                <li
                  // A draft has no id until it is saved; its place is its identity.

                  key={index}
                  className="flex flex-wrap items-end gap-2"
                >
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`range-${doc.documentId}-${index}-class`}>
                      Range {index + 1} class
                    </Label>
                    <select
                      id={`range-${doc.documentId}-${index}-class`}
                      className={SELECT_CLASS}
                      value={draft.docClass}
                      onChange={(event) =>
                        setDraft(index, {
                          docClass: event.target.value as DocClass,
                        })
                      }
                    >
                      {DOC_CLASSES.map((value) => (
                        <option key={value} value={value}>
                          {docClassLabels[value]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`range-${doc.documentId}-${index}-from`}>
                      From page
                    </Label>
                    <Input
                      id={`range-${doc.documentId}-${index}-from`}
                      className="w-20"
                      inputMode="numeric"
                      value={draft.from}
                      onChange={(event) =>
                        setDraft(index, { from: event.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`range-${doc.documentId}-${index}-to`}>
                      To page
                    </Label>
                    <Input
                      id={`range-${doc.documentId}-${index}-to`}
                      className="w-20"
                      inputMode="numeric"
                      value={draft.to}
                      onChange={(event) =>
                        setDraft(index, { to: event.target.value })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove range ${index + 1}`}
                    onClick={() =>
                      setDrafts((current) =>
                        current.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {problem && (
            <p role="alert" className="text-destructive">
              {problem}
            </p>
          )}
          {classify.isError && (
            <p role="alert" className="text-destructive">
              {getErrorMessage(classify.error)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
