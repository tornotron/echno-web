'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useDiffIngestRevision,
  useIngestCandidates,
  useResolveChangeConflict,
  useSetIngestRevision,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  Candidate,
  ConflictChoice,
  IngestDocument,
  IngestPackage,
  RevisionDiff,
} from '@tornotron/echno-core/document-ingestion/types';
import {
  changeOf,
  hasFlag,
  INGEST_FLAG,
} from '@tornotron/echno-core/document-ingestion/types';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { useCan } from '@/hooks/use-can';
import { INGEST_REVIEW_ACCESS } from '../lib/access';
import { SELECT_CLASS } from '../lib/styles';
import { isReadWorkbook } from '../lib/workbook';
import { ApplyButton } from './ApplyButton';
import {
  CANDIDATE_PAGE_SIZE,
  CandidateReview,
  type ReviewColumn,
} from './CandidateReview';
import { PageViewer } from './PageViewer';

function target(c: Candidate): string {
  const change = changeOf(c);
  return [change.target, change.field].filter(Boolean).join(', ') || 'change';
}

function isUnmatched(c: Candidate): boolean {
  return hasFlag(c, INGEST_FLAG.UNMATCHED);
}

function isConflict(c: Candidate): boolean {
  return c.status === 'APPLY_FAILED';
}

const COLUMNS: ReviewColumn[] = [
  {
    header: 'Item',
    cell: (c) => {
      const change = changeOf(c);
      return (
        <div className="flex flex-col">
          <span className="font-medium">{change.target ?? ''}</span>
          <span className="text-muted-foreground text-xs">
            {[change.targetKind, change.field].filter(Boolean).join(', ')}
          </span>
        </div>
      );
    },
  },
  { header: 'Old, as stated', cell: (c) => changeOf(c).oldValue ?? '' },
  { header: 'New', cell: (c) => changeOf(c).newValue ?? '' },
  { header: 'Earlier value', cell: (c) => changeOf(c).priorValue ?? '' },
  {
    header: 'Variance',
    className: 'text-right tabular-nums',
    cell: (c) => changeOf(c).quantityVariance ?? '',
  },
  {
    header: 'Money impact',
    className: 'text-right tabular-nums',
    cell: (c) => changeOf(c).moneyImpact ?? '',
  },
  {
    header: 'From',
    cell: (c) =>
      changeOf(c).origin === 'REVISED_FILE'
        ? 'Revised file'
        : changeOf(c).origin === 'CORRIGENDUM'
          ? 'Corrigendum'
          : (changeOf(c).origin ?? ''),
  },
];

const EDIT_FIELDS = [
  { key: 'field', label: 'Field', value: (c: Candidate) => changeOf(c).field },
  {
    key: 'newValue',
    label: 'New value',
    value: (c: Candidate) => changeOf(c).newValue,
  },
];

/**
 * A corrigendum or a revised file, read into one change per affected value.
 * Each change shows the old value it states, the new value, the earlier
 * value it was matched to, and the quantity variance and money impact worked
 * out from accepted numbers. A change that matches nothing is listed apart
 * and never dropped. Applying writes a change to a live record only while
 * the record still holds the value last applied; a record edited by hand
 * since then is never overwritten silently, and a person chooses.
 */
export function CorrigendumReview({
  pkg,
  documents,
  fileNames,
}: {
  pkg: IngestPackage;
  documents: IngestDocument[];
  fileNames: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-6" data-testid="corrigendum">
      <RevisionSetup documents={documents} fileNames={fileNames} />
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Changes</p>
        <CandidateReview
          packageId={pkg.id}
          kind="CHANGE"
          fileNames={fileNames}
          columns={COLUMNS}
          editFields={EDIT_FIELDS}
          describe={target}
          exclude={(c) => isUnmatched(c) || isConflict(c)}
          emptyText="No changes yet. They are read from a corrigendum, or from comparing a revised BOQ with the file it replaces."
        />
      </div>
      <Conflicts packageId={pkg.id} />
      <Unmatched packageId={pkg.id} fileNames={fileNames} />
      <div className="flex flex-col gap-2">
        <p className="text-sm">
          Applying writes each accepted change. A change to a BOQ row not yet
          applied becomes a revised row to review on the BOQ tab.
        </p>
        <ApplyButton packageId={pkg.id} kind="CHANGE" label="Apply changes" />
      </div>
    </div>
  );
}

function RevisionSetup({
  documents,
  fileNames,
}: {
  documents: IngestDocument[];
  fileNames: Record<string, string>;
}) {
  const setRevision = useSetIngestRevision();
  const diff = useDiffIngestRevision();
  const [revised, setRevised] = useState('');
  const [replaces, setReplaces] = useState('');
  const [label, setLabel] = useState('');
  const [diffs, setDiffs] = useState<Record<string, RevisionDiff>>({});

  const revisions = documents.filter((d) => d.supersedesDocumentId);
  const save = () => {
    if (!revised || !replaces) return;
    setRevision
      .mutateAsync({
        documentId: revised,
        req: {
          supersedesDocumentId: replaces,
          ...(label.trim() ? { revisionLabel: label.trim() } : {}),
        },
      })
      .then(() => {
        setRevised('');
        setReplaces('');
        setLabel('');
      })
      .catch(() => {});
  };

  return (
    <div className="flex flex-col gap-3" data-testid="revisions">
      <p className="text-sm font-medium">Revised files</p>
      <p className="text-muted-foreground text-sm">
        Say which file a revised file replaces. A revised BOQ workbook is then
        compared row by row with the one it replaces, with no AI reading.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="revised-file">Revised file</Label>
          <select
            id="revised-file"
            className={SELECT_CLASS}
            value={revised}
            onChange={(event) => setRevised(event.target.value)}
          >
            <option value="">Choose a file</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fileName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="replaced-file">Replaces</Label>
          <select
            id="replaced-file"
            className={SELECT_CLASS}
            value={replaces}
            onChange={(event) => setReplaces(event.target.value)}
          >
            <option value="">Choose a file</option>
            {documents
              .filter((d) => d.id !== revised)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fileName}
                </option>
              ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="revision-label">Revision label</Label>
          <Input
            id="revision-label"
            value={label}
            placeholder="Rev 1"
            onChange={(event) => setLabel(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!revised || !replaces || setRevision.isPending}
          onClick={save}
        >
          Save revision
        </Button>
      </div>
      {setRevision.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(setRevision.error)}
        </p>
      )}
      {revisions.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm">
          {revisions.map((d) => {
            const result = diffs[d.id];
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-3">
                <span>
                  {d.fileName}
                  {d.revisionLabel ? ` (${d.revisionLabel})` : ''} replaces{' '}
                  {fileNames[d.supersedesDocumentId ?? ''] ?? 'an earlier file'}
                </span>
                {isReadWorkbook(d) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={diff.isPending}
                    onClick={() =>
                      diff
                        .mutateAsync(d.id)
                        .then((r) =>
                          setDiffs((current) => ({ ...current, [d.id]: r }))
                        )
                        .catch(() => {})
                    }
                  >
                    Compare with the file it replaces
                  </Button>
                )}
                {result && (
                  <span role="status">
                    Compared {result.itemsCompared} items:{' '}
                    {result.changesProposed} changes, {result.itemsAdded} added,{' '}
                    {result.itemsRemoved} removed.
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {diff.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(diff.error)}
        </p>
      )}
    </div>
  );
}

/** Changes the apply step refused, with the values it named and the two choices. */
function Conflicts({ packageId }: { packageId: string }) {
  const { data } = useIngestCandidates(packageId, {
    kind: 'CHANGE',
    status: 'APPLY_FAILED',
    size: CANDIDATE_PAGE_SIZE,
  });
  const resolve = useResolveChangeConflict();
  const { allowed } = useCan(INGEST_REVIEW_ACCESS);
  const rows = data?.content ?? [];
  if (rows.length === 0) return null;

  const choose = (candidateId: string, choice: ConflictChoice) =>
    resolve.mutate({ candidateId, choice });

  return (
    <div className="flex flex-col gap-2" data-testid="conflicts">
      <p className="text-sm font-medium">Changes not applied ({rows.length})</p>
      <p className="text-muted-foreground text-sm">
        Nothing was overwritten. Where a record was edited by hand after its
        value was applied, the reason names the value on the record now, the
        value last applied, and the value in the change. Choose which to keep.
      </p>
      <ul className="flex flex-col gap-3">
        {rows.map((c) => {
          const change = changeOf(c);
          return (
            <li
              key={c.id}
              className="flex flex-col gap-2 rounded-md border p-3 text-sm"
              data-testid={`conflict-${c.id}`}
            >
              <span className="font-medium">{target(c)}</span>
              <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-1">
                <dt className="text-muted-foreground">Value on the record</dt>
                <dd>{c.conflictRecordValue ?? 'Not known'}</dd>
                <dt className="text-muted-foreground">Value last applied</dt>
                <dd>
                  {c.conflictAppliedValue ?? change.priorValue ?? 'Not known'}
                </dd>
                <dt className="text-muted-foreground">Value in the change</dt>
                <dd>{change.newValue ?? ''}</dd>
                <dt className="text-muted-foreground">Reason</dt>
                <dd className="text-destructive">
                  {c.applyError ?? 'No reason was given.'}
                </dd>
              </dl>
              {allowed && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={resolve.isPending}
                    onClick={() => choose(c.id, 'APPLY_CHANGE')}
                  >
                    Write the change over the record
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={resolve.isPending}
                    onClick={() => choose(c.id, 'KEEP_RECORD')}
                  >
                    Keep the record
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {resolve.isPending && (
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
      )}
      {resolve.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(resolve.error)}
        </p>
      )}
      <p className="text-muted-foreground text-xs">
        Writing the change over the record takes effect on the next apply, and
        only while the record still holds the value it holds now.
      </p>
    </div>
  );
}

/** Statements that matched no earlier value. Kept here, never dropped, for a person to enter by hand. */
function Unmatched({
  packageId,
  fileNames,
}: {
  packageId: string;
  fileNames: Record<string, string>;
}) {
  const { data } = useIngestCandidates(packageId, {
    kind: 'CHANGE',
    page: 0,
    size: CANDIDATE_PAGE_SIZE,
  });
  const [open, setOpen] = useState<string | null>(null);
  const rows = (data?.content ?? []).filter((c) => isUnmatched(c));
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-2" data-testid="unmatched">
      <p className="text-sm font-medium">
        Not matched to any earlier value ({rows.length})
      </p>
      <p className="text-muted-foreground text-sm">
        These statements name nothing found in the package, so nothing is
        changed for them. Enter each by hand where it belongs.
      </p>
      <ul className="flex flex-col gap-3 text-sm">
        {rows.map((c) => {
          const change = changeOf(c);
          const flag = c.flags.find((f) => f.code === INGEST_FLAG.UNMATCHED);
          return (
            <li key={c.id} className="flex flex-col gap-1">
              <span>
                <span className="font-medium">
                  {change.target ?? 'No item named'}
                </span>
                {change.field ? `, ${change.field}` : ''}
                {change.newValue ? `: ${change.newValue}` : ''}
              </span>
              {flag?.message && (
                <span className="text-muted-foreground text-xs">
                  {flag.message}
                </span>
              )}
              {c.sources.length > 0 && (
                <button
                  type="button"
                  className="text-primary w-fit text-xs hover:underline"
                  onClick={() => setOpen(open === c.id ? null : c.id)}
                >
                  {open === c.id ? 'Hide source' : 'Show source'}
                </button>
              )}
              {open === c.id &&
                c.sources.map((source) => (
                  <PageViewer
                    key={source.id}
                    source={source}
                    className="max-w-sm"
                    fileName={
                      fileNames[source.documentId ?? c.documentId ?? '']
                    }
                  />
                ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
