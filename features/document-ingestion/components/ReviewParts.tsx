'use client';

import type {
  Candidate,
  DecisionResult,
} from '@tornotron/echno-core/document-ingestion/types';
import { Badge } from '@/components/shadcn/badge';
import { decisionOutcomeLabels, flagLabel } from '../lib/labels';

/**
 * Pieces every review table shares: the flags of a row with a tick for each
 * one checked, and the outcome of a batch of decisions. Every value shown is
 * plain text, model output included.
 */

export function FlagList({
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

export function DecisionSummary({
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
