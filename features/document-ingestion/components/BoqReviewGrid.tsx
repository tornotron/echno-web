'use client';

import { Fragment, useMemo, useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useDecideCandidates,
  useIngestCandidates,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  BoqField,
  Candidate,
  CandidateDecision,
  CandidateStatus,
  DecisionResult,
} from '@tornotron/echno-core/document-ingestion/types';
import {
  BOQ_FIELDS,
  boqItemOf,
  sourceOf,
} from '@tornotron/echno-core/document-ingestion/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { cn } from '@/lib/utils';
import { sourceLabel } from '../lib/cells';
import {
  boqFieldLabels,
  candidateStatusLabels,
  decisionOutcomeLabels,
  flagLabel,
  REVIEW_STATUSES,
} from '../lib/labels';
import { SELECT_CLASS } from '../lib/styles';

export const REVIEW_PAGE_SIZE = 200;

const NUMERIC: ReadonlySet<BoqField> = new Set(['quantity', 'rate', 'amount']);

interface BoqReviewGridProps {
  packageId: string;
  /** File name by document id, for the source line of each row. */
  fileNames: Record<string, string>;
}

/** Whether a person can still decide on the row: not yet decided, or refused by the contract. */
function isOpen(candidate: Candidate): boolean {
  return candidate.status === 'PROPOSED' || candidate.status === 'APPLY_FAILED';
}

/**
 * The rows read from the package's BOQ sheets, each with the cell it came
 * from. A person accepts, rejects or corrects each row. A row with flags is
 * accepted only once each flag is ticked as checked, so bulk accept takes the
 * unflagged rows only, and a separate action accepts the rows whose one flag
 * is a code the person has checked.
 */
export function BoqReviewGrid({ packageId, fileNames }: BoqReviewGridProps) {
  const [status, setStatus] = useState<CandidateStatus | ''>('');
  const [page, setPage] = useState(0);
  const [ticked, setTicked] = useState<Record<string, string[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [ackCode, setAckCode] = useState('');
  const [results, setResults] = useState<DecisionResult[] | null>(null);

  const { data, isLoading, isError, error } = useIngestCandidates(packageId, {
    kind: 'BOQ_ITEM',
    status: status || undefined,
    page,
    size: REVIEW_PAGE_SIZE,
  });
  const decide = useDecideCandidates();

  const rows = useMemo(() => data?.content ?? [], [data]);
  const byId = useMemo(() => new Map(rows.map((c) => [c.id, c])), [rows]);
  const unflagged = rows.filter(
    (c) => c.status === 'PROPOSED' && c.flags.length === 0
  );
  const flagCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const c of rows) {
      if (c.status !== 'PROPOSED') continue;
      for (const flag of c.flags) codes.add(flag.code);
    }
    return [...codes].toSorted();
  }, [rows]);
  const chosenCode = flagCodes.includes(ackCode) ? ackCode : '';
  const onlyChosen = rows.filter(
    (c) =>
      c.status === 'PROPOSED' &&
      c.flags.length > 0 &&
      c.flags.every((flag) => flag.code === chosenCode)
  );

  const send = async (decisions: CandidateDecision[]) => {
    if (decisions.length === 0) return;
    setResults(null);
    const outcome = await decide.mutateAsync({ packageId, decisions });
    setResults(outcome ?? []);
    setEditing(null);
  };
  const run = (decisions: CandidateDecision[]) => {
    send(decisions).catch(() => {});
  };

  const toggleTick = (candidateId: string, code: string) =>
    setTicked((current) => {
      const codes = new Set(current[candidateId]);
      if (codes.has(code)) codes.delete(code);
      else codes.add(code);
      return { ...current, [candidateId]: [...codes] };
    });
  const tickedFor = (c: Candidate) =>
    (ticked[c.id] ?? []).filter((code) => c.flags.some((f) => f.code === code));
  const allTicked = (c: Candidate) =>
    c.flags.every((flag) => tickedFor(c).includes(flag.code));
  const acceptOne = (c: Candidate): CandidateDecision => ({
    candidateId: c.id,
    action: 'ACCEPT',
    ...(c.flags.length > 0 ? { acknowledgedFlags: tickedFor(c) } : {}),
  });

  const changePage = (next: number) => {
    setPage(next);
    setEditing(null);
    setResults(null);
  };

  return (
    <div className="flex flex-col gap-4" data-testid="boq-review">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="review-status">Status</Label>
          <select
            id="review-status"
            className={SELECT_CLASS}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as CandidateStatus | '');
              changePage(0);
            }}
          >
            <option value="">All rows</option>
            {REVIEW_STATUSES.map((value) => (
              <option key={value} value={value}>
                {candidateStatusLabels[value]}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          disabled={unflagged.length === 0 || decide.isPending}
          onClick={() =>
            run(unflagged.map((c) => ({ candidateId: c.id, action: 'ACCEPT' })))
          }
        >
          <Check className="size-4" />
          Accept {rowsLabel(unflagged.length)} without flags
        </Button>
        {flagCodes.length > 0 && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ack-code">Flag I have checked</Label>
              <select
                id="ack-code"
                className={SELECT_CLASS}
                value={chosenCode}
                onChange={(event) => setAckCode(event.target.value)}
              >
                <option value="">Choose a flag</option>
                {flagCodes.map((code) => (
                  <option key={code} value={code}>
                    {flagLabel(code)}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={
                !chosenCode || onlyChosen.length === 0 || decide.isPending
              }
              onClick={() =>
                run(
                  onlyChosen.map((c) => ({
                    candidateId: c.id,
                    action: 'ACCEPT',
                    acknowledgedFlags: [chosenCode],
                  }))
                )
              }
            >
              Accept {rowsLabel(onlyChosen.length)} with only this flag
            </Button>
          </div>
        )}
        {decide.isPending && (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        )}
      </div>

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
            return c ? sourceLabel(c, fileNameOf(c, fileNames)) : id;
          }}
        />
      )}

      {isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading rows
        </div>
      )}
      {isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(error)}
        </p>
      )}

      {data && (
        <>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-2 py-2 font-medium">Source</th>
                  {BOQ_FIELDS.map((field) => (
                    <th
                      key={field}
                      className={cn(
                        'px-2 py-2 font-medium',
                        NUMERIC.has(field) && 'text-right'
                      )}
                    >
                      {boqFieldLabels[field]}
                    </th>
                  ))}
                  <th className="px-2 py-2 font-medium">Section</th>
                  <th className="px-2 py-2 font-medium">Flags</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={BOQ_FIELDS.length + 5}
                      className="text-muted-foreground px-2 py-3"
                    >
                      No rows here. Read a sheet above to see its rows.
                    </td>
                  </tr>
                )}
                {rows.map((c) =>
                  editing === c.id ? (
                    <EditRow
                      key={c.id}
                      candidate={c}
                      fileName={fileNameOf(c, fileNames)}
                      acknowledged={tickedFor(c)}
                      pending={decide.isPending}
                      onCancel={() => setEditing(null)}
                      onSave={(edits) =>
                        run([
                          {
                            candidateId: c.id,
                            action: 'EDIT',
                            edits,
                            ...(c.flags.length > 0
                              ? { acknowledgedFlags: tickedFor(c) }
                              : {}),
                          },
                        ])
                      }
                    />
                  ) : (
                    <Fragment key={c.id}>
                      <tr
                        className="border-t align-top"
                        data-testid={`boq-row-${c.id}`}
                      >
                        <td className="px-2 py-2 text-xs whitespace-nowrap">
                          <div>{sourceLabel(c, fileNameOf(c, fileNames))}</div>
                          <button
                            type="button"
                            className="text-primary text-xs hover:underline"
                            onClick={() =>
                              setExpanded((current) => {
                                const next = new Set(current);
                                if (next.has(c.id)) next.delete(c.id);
                                else next.add(c.id);
                                return next;
                              })
                            }
                          >
                            {expanded.has(c.id) ? 'Hide cells' : 'Show cells'}
                          </button>
                        </td>
                        {BOQ_FIELDS.map((field) => {
                          const cell = sourceOf(c, field)?.cell;
                          return (
                            <td
                              key={field}
                              className={cn(
                                'px-2 py-2',
                                NUMERIC.has(field) &&
                                  'text-right whitespace-nowrap tabular-nums',
                                field === 'description' && 'min-w-64'
                              )}
                              title={cell ? `Cell ${cell}` : undefined}
                            >
                              {boqItemOf(c)[field] ?? ''}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-xs">
                          {boqItemOf(c).section ?? ''}
                        </td>
                        <td className="px-2 py-2">
                          <FlagList
                            candidate={c}
                            ticked={tickedFor(c)}
                            onToggle={
                              isOpen(c)
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
                        <td className="px-2 py-2">
                          {isOpen(c) && (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                aria-label={`Accept ${sourceLabel(c, fileNameOf(c, fileNames))}`}
                                title={
                                  allTicked(c)
                                    ? 'Accept'
                                    : 'Tick each flag as checked to accept'
                                }
                                disabled={!allTicked(c) || decide.isPending}
                                onClick={() => run([acceptOne(c)])}
                              >
                                <Check className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                aria-label={`Edit ${sourceLabel(c, fileNameOf(c, fileNames))}`}
                                title="Correct and accept"
                                disabled={decide.isPending}
                                onClick={() => setEditing(c.id)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                aria-label={`Reject ${sourceLabel(c, fileNameOf(c, fileNames))}`}
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
                      {expanded.has(c.id) && <CellsRow candidate={c} />}
                    </Fragment>
                  )
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>
              Page {data.page + 1} of {Math.max(data.totalPages, 1)},{' '}
              {data.totalElements} rows
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

function rowsLabel(count: number): string {
  return count === 1 ? '1 row' : `${count} rows`;
}

function fileNameOf(
  candidate: Candidate,
  fileNames: Record<string, string>
): string | undefined {
  const id = candidate.documentId ?? rowDocumentId(candidate);
  return id ? fileNames[id] : undefined;
}

function rowDocumentId(candidate: Candidate): string | undefined {
  return candidate.sources.find((s) => s.documentId)?.documentId;
}

function FlagList({
  candidate,
  ticked,
  onToggle,
}: {
  candidate: Candidate;
  ticked: string[];
  onToggle?: (code: string) => void;
}) {
  if (candidate.flags.length === 0) return null;
  return (
    <ul className="flex min-w-48 flex-col gap-1.5">
      {candidate.flags.map((flag) => (
        <li key={flag.code} className="flex flex-col gap-0.5">
          <Badge variant="amber" className="w-fit">
            {flagLabel(flag.code)}
          </Badge>
          <span className="text-muted-foreground text-xs">{flag.message}</span>
          {onToggle && (
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={ticked.includes(flag.code)}
                onChange={() => onToggle(flag.code)}
                aria-label={`Checked: ${flagLabel(flag.code)}`}
              />
              Checked
            </label>
          )}
          {candidate.acknowledgedFlags.includes(flag.code) && (
            <span className="text-xs">Checked by the reviewer</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Each field's cell and the text found there. */
function CellsRow({ candidate }: { candidate: Candidate }) {
  return (
    <tr className="bg-muted/30">
      <td colSpan={BOQ_FIELDS.length + 5} className="px-2 py-2 text-xs">
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {BOQ_FIELDS.map((field) => {
            const source = sourceOf(candidate, field);
            if (!source) return null;
            return (
              <li key={field}>
                <span className="text-muted-foreground">
                  {boqFieldLabels[field]}:
                </span>{' '}
                {source.cell ? `Cell ${source.cell}` : 'No cell'}
                {source.quote !== undefined && (
                  <span className="text-muted-foreground">
                    {' '}
                    reads &quot;{source.quote}&quot;
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </td>
    </tr>
  );
}

function EditRow({
  candidate,
  fileName,
  acknowledged,
  pending,
  onCancel,
  onSave,
}: {
  candidate: Candidate;
  fileName: string | undefined;
  acknowledged: string[];
  pending: boolean;
  onCancel: () => void;
  onSave: (edits: Record<string, string | null>) => void;
}) {
  const item = boqItemOf(candidate);
  const [values, setValues] = useState<Record<BoqField, string>>(() => {
    const initial = {} as Record<BoqField, string>;
    for (const field of BOQ_FIELDS) initial[field] = item[field] ?? '';
    return initial;
  });
  const missingAck = candidate.flags.filter(
    (flag) => !acknowledged.includes(flag.code)
  );

  const save = () => {
    const edits: Record<string, string | null> = {};
    for (const field of BOQ_FIELDS) {
      const next = values[field].trim();
      if (next !== (item[field] ?? ''))
        edits[field] = next === '' ? null : next;
    }
    onSave(edits);
  };

  return (
    <tr className="border-t bg-amber-50/50 align-top dark:bg-amber-500/5">
      <td className="px-2 py-2 text-xs whitespace-nowrap">
        {sourceLabel(candidate, fileName)}
      </td>
      {BOQ_FIELDS.map((field) => (
        <td key={field} className="px-2 py-2">
          <Input
            aria-label={boqFieldLabels[field]}
            value={values[field]}
            inputMode={NUMERIC.has(field) ? 'decimal' : undefined}
            className={cn('h-8', field === 'description' ? 'min-w-64' : 'w-24')}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                [field]: event.target.value,
              }))
            }
          />
        </td>
      ))}
      <td className="px-2 py-2 text-xs">{item.section ?? ''}</td>
      <td className="px-2 py-2 text-xs">
        {missingAck.length > 0 &&
          `Tick ${missingAck.map((f) => flagLabel(f.code)).join(', ')} as checked first, or the row stays to review.`}
      </td>
      <td />
      <td className="px-2 py-2">
        <div className="flex gap-1">
          <Button type="button" size="sm" disabled={pending} onClick={save}>
            Save and accept
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </td>
    </tr>
  );
}

function DecisionSummary({
  results,
  describe,
}: {
  results: DecisionResult[];
  describe: (candidateId: string) => string;
}) {
  const counts = new Map<string, number>();
  for (const r of results) {
    counts.set(r.outcome, (counts.get(r.outcome) ?? 0) + 1);
  }
  const problems = results.filter(
    (r) => r.outcome !== 'ACCEPTED' && r.outcome !== 'REJECTED'
  );
  return (
    <div
      className="rounded-md border p-3 text-sm"
      role="status"
      data-testid="decision-summary"
    >
      <p>
        {[...counts.entries()]
          .map(
            ([outcome, count]) =>
              `${decisionOutcomeLabels[outcome as DecisionResult['outcome']] ?? outcome}: ${count}`
          )
          .join('. ')}
      </p>
      {problems.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {problems.map((r) => (
            <li key={r.candidateId}>
              {describe(r.candidateId)}:{' '}
              {r.message ?? decisionOutcomeLabels[r.outcome]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
