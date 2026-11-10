'use client';

import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useDecideCandidates,
  useIngestCandidates,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  Candidate,
  CandidateDecision,
  CandidateKind,
  CandidateStatus,
  DecisionResult,
} from '@tornotron/echno-core/document-ingestion/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { useCan } from '@/hooks/use-can';
import { INGEST_REVIEW_ACCESS } from '../lib/access';
import { candidateStatusLabels, REVIEW_STATUSES } from '../lib/labels';
import {
  acceptDecision,
  acceptedAlone,
  allTicked,
  bulkAcceptable,
  tickedFor,
} from '../lib/review';
import { SELECT_CLASS } from '../lib/styles';
import { PageViewer } from './PageViewer';
import { DecisionSummary, FlagList } from './ReviewParts';

export const CANDIDATE_PAGE_SIZE = 200;

export interface ReviewColumn {
  header: string;
  cell: (candidate: Candidate) => ReactNode;
  className?: string;
}

export interface EditField {
  /** The payload key the edit sets. */
  key: string;
  label: string;
  multiline?: boolean;
  value: (candidate: Candidate) => string | undefined;
}

interface CandidateReviewProps {
  packageId: string;
  kind: CandidateKind;
  /** File name by document id, for the source of each value. */
  fileNames: Record<string, string>;
  columns: ReviewColumn[];
  editFields: EditField[];
  /** A short name for a row, for button labels and the decision summary. */
  describe: (candidate: Candidate) => string;
  emptyText: string;
  /** Rows another list on the screen shows instead, such as unmatched changes. */
  exclude?: (candidate: Candidate) => boolean;
  /** Shown above the table, given the rows of the current page. */
  header?: (rows: Candidate[]) => ReactNode;
  testId?: string;
}

function isOpen(candidate: Candidate): boolean {
  return candidate.status === 'PROPOSED';
}

/**
 * One kind of candidate value from a package, each beside the page it was
 * read from. A person accepts, corrects or rejects each value. A flagged row
 * is accepted only once each of its flags is ticked as checked, so bulk
 * accept takes the unflagged rows and the rows whose flags are all ticked;
 * a value whose quote was not found on its page is accepted only on its own.
 * The backend enforces both rules and reports every row it skipped.
 */
export function CandidateReview({
  packageId,
  kind,
  fileNames,
  columns,
  editFields,
  describe,
  emptyText,
  exclude,
  header,
  testId,
}: CandidateReviewProps) {
  const [status, setStatus] = useState<CandidateStatus | ''>('');
  const [page, setPage] = useState(0);
  const [ticked, setTicked] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [results, setResults] = useState<DecisionResult[] | null>(null);
  const { allowed: canReview } = useCan(INGEST_REVIEW_ACCESS);

  const { data, isLoading, isError, error } = useIngestCandidates(packageId, {
    kind,
    status: status || undefined,
    page,
    size: CANDIDATE_PAGE_SIZE,
  });
  const decide = useDecideCandidates();

  const rows = useMemo(
    () => (data?.content ?? []).filter((c) => !exclude?.(c)),
    [data, exclude]
  );
  const byId = useMemo(() => new Map(rows.map((c) => [c.id, c])), [rows]);
  const ready = bulkAcceptable(rows, ticked);
  const alone = rows.filter((c) => c.status === 'PROPOSED' && acceptedAlone(c));
  const chosen = selected ? byId.get(selected) : undefined;

  const run = (decisions: CandidateDecision[]) => {
    if (decisions.length === 0) return;
    setResults(null);
    decide
      .mutateAsync({ packageId, decisions })
      .then((outcome) => {
        setResults(outcome ?? []);
        setEditing(null);
      })
      .catch(() => {});
  };

  const toggleTick = (candidateId: string, code: string) =>
    setTicked((current) => {
      const codes = new Set(current[candidateId]);
      if (codes.has(code)) codes.delete(code);
      else codes.add(code);
      return { ...current, [candidateId]: [...codes] };
    });

  const changePage = (next: number) => {
    setPage(next);
    setEditing(null);
    setResults(null);
  };
  const span = columns.length + 4;

  return (
    <div className="flex flex-col gap-4" data-testid={testId}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${kind}-status`}>Status</Label>
          <select
            id={`${kind}-status`}
            className={SELECT_CLASS}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as CandidateStatus | '');
              changePage(0);
            }}
          >
            <option value="">All values</option>
            {REVIEW_STATUSES.map((value) => (
              <option key={value} value={value}>
                {candidateStatusLabels[value]}
              </option>
            ))}
          </select>
        </div>
        {canReview && (
          <Button
            type="button"
            disabled={ready.length === 0 || decide.isPending}
            onClick={() => run(ready.map((c) => acceptDecision(c, ticked)))}
          >
            <Check className="size-4" />
            Accept {valuesLabel(ready.length)} ready to accept
          </Button>
        )}
        {decide.isPending && (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        {canReview
          ? 'A value with flags is ready once you tick each flag as checked.'
          : 'Your role can see these values. A project manager or a system admin accepts or rejects them.'}
        {canReview &&
          alone.length > 0 &&
          ` ${valuesLabel(alone.length)} whose quote was not found on the page ${alone.length === 1 ? 'is' : 'are'} accepted one at a time, never in bulk.`}
      </p>

      {decide.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(decide.error)}
        </p>
      )}
      {results && (
        <DecisionSummary
          results={results}
          describe={(id) => {
            const c = byId.get(id);
            return c ? describe(c) : id;
          }}
        />
      )}
      {isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading values
        </div>
      )}
      {isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(error)}
        </p>
      )}

      {data && (
        <>
          {header?.(rows)}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    {columns.map((column) => (
                      <th
                        key={column.header}
                        className={`px-2 py-2 font-medium ${column.className ?? ''}`}
                      >
                        {column.header}
                      </th>
                    ))}
                    <th className="px-2 py-2 font-medium">Flags</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Source</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={span}
                        className="text-muted-foreground px-2 py-3"
                      >
                        {emptyText}
                      </td>
                    </tr>
                  )}
                  {rows.map((c) => (
                    <Fragment key={c.id}>
                      <tr
                        className={`border-t align-top ${selected === c.id ? 'bg-muted/40' : ''}`}
                        data-testid={`candidate-${c.id}`}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.header}
                            className={`px-2 py-2 ${column.className ?? ''}`}
                          >
                            {column.cell(c)}
                          </td>
                        ))}
                        <td className="px-2 py-2">
                          <FlagList
                            candidate={c}
                            ticked={tickedFor(c, ticked)}
                            onToggle={
                              canReview && isOpen(c)
                                ? (code) => toggleTick(c.id, code)
                                : undefined
                            }
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Badge
                            variant={
                              c.status === 'APPLY_FAILED'
                                ? 'destructive'
                                : c.status === 'PROPOSED'
                                  ? 'outline'
                                  : 'secondary'
                            }
                          >
                            {candidateStatusLabels[c.status]}
                          </Badge>
                          {c.applyError && (
                            <p className="text-destructive mt-1 text-xs">
                              {c.applyError}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-2 text-xs">
                          {c.sources.length === 0 ? (
                            <span className="text-muted-foreground">
                              No source
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="text-primary hover:underline"
                              onClick={() =>
                                setSelected(selected === c.id ? null : c.id)
                              }
                            >
                              {selected === c.id
                                ? 'Hide source'
                                : 'Show source'}
                            </button>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {canReview && isOpen(c) && (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                aria-label={`Accept ${describe(c)}`}
                                title={
                                  allTicked(c, ticked)
                                    ? acceptedAlone(c)
                                      ? 'Accept this value on its own'
                                      : 'Accept'
                                    : 'Tick each flag as checked to accept'
                                }
                                disabled={
                                  !allTicked(c, ticked) || decide.isPending
                                }
                                onClick={() => run([acceptDecision(c, ticked)])}
                              >
                                <Check className="size-4" />
                              </Button>
                              {editFields.length > 0 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  aria-label={`Edit ${describe(c)}`}
                                  title="Correct and accept"
                                  disabled={decide.isPending}
                                  onClick={() => setEditing(c.id)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                aria-label={`Reject ${describe(c)}`}
                                title="Reject"
                                disabled={decide.isPending}
                                onClick={() =>
                                  run([{ candidateId: c.id, action: 'REJECT' }])
                                }
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {editing === c.id && (
                        <tr className="bg-amber-50/50 dark:bg-amber-500/5">
                          <td colSpan={span} className="px-2 py-2">
                            <EditForm
                              candidate={c}
                              fields={editFields}
                              acknowledged={tickedFor(c, ticked)}
                              pending={decide.isPending}
                              onCancel={() => setEditing(null)}
                              onSave={(edits) =>
                                run([
                                  {
                                    candidateId: c.id,
                                    action: 'EDIT',
                                    edits,
                                    ...(c.flags.length > 0
                                      ? {
                                          acknowledgedFlags: tickedFor(
                                            c,
                                            ticked
                                          ),
                                        }
                                      : {}),
                                  },
                                ])
                              }
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <aside className="flex flex-col gap-4" aria-label="Source">
              {chosen ? (
                chosen.sources.map((source) => (
                  <PageViewer
                    key={source.id}
                    source={source}
                    fileName={
                      fileNames[source.documentId ?? chosen.documentId ?? '']
                    }
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Pick &quot;Show source&quot; on a row to see where on the page
                  its value was read.
                </p>
              )}
            </aside>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>
              Page {data.page + 1} of {Math.max(data.totalPages, 1)},{' '}
              {data.totalElements} values
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => changePage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= data.totalPages}
                onClick={() => changePage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function valuesLabel(count: number): string {
  return count === 1 ? '1 value' : `${count} values`;
}

function EditForm({
  candidate,
  fields,
  acknowledged,
  pending,
  onCancel,
  onSave,
}: {
  candidate: Candidate;
  fields: EditField[];
  acknowledged: string[];
  pending: boolean;
  onCancel: () => void;
  onSave: (edits: Record<string, string | null>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value(candidate) ?? '']))
  );
  const missing = candidate.flags.filter((f) => !acknowledged.includes(f.code));

  const save = () => {
    const edits: Record<string, string | null> = {};
    for (const field of fields) {
      const next = (values[field.key] ?? '').trim();
      if (next !== (field.value(candidate) ?? '')) {
        edits[field.key] = next === '' ? null : next;
      }
    }
    onSave(edits);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {fields.map((field) => {
          const id = `edit-${candidate.id}-${field.key}`;
          return (
            <div key={field.key} className="flex min-w-48 flex-col gap-1.5">
              <Label htmlFor={id}>{field.label}</Label>
              {field.multiline ? (
                <Textarea
                  id={id}
                  value={values[field.key]}
                  className="min-w-96"
                  onChange={(event) =>
                    setValues((v) => ({
                      ...v,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              ) : (
                <Input
                  id={id}
                  value={values[field.key]}
                  onChange={(event) =>
                    setValues((v) => ({
                      ...v,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              )}
            </div>
          );
        })}
      </div>
      {missing.length > 0 && (
        <p className="text-xs">
          Tick each flag as checked first, or the value stays to review.
        </p>
      )}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={save}>
          Save and accept
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
