import type {
  Candidate,
  CandidateDecision,
} from '@tornotron/echno-core/document-ingestion/types';
import {
  hasFlag,
  INGEST_FLAG,
} from '@tornotron/echno-core/document-ingestion/types';

/** Flags whose candidate is accepted only on its own, never in a bulk accept. */
export const ACCEPT_ALONE_FLAGS: readonly string[] = [
  INGEST_FLAG.QUOTE_NOT_FOUND,
];

/** Whether a candidate may only be accepted by itself (its quote was not found on the page). */
export function acceptedAlone(candidate: Candidate): boolean {
  return ACCEPT_ALONE_FLAGS.some((code) => hasFlag(candidate, code));
}

/** The flag codes a person ticked for one candidate, limited to the flags it carries. */
export function tickedFor(
  candidate: Candidate,
  ticked: Record<string, string[]>
): string[] {
  const codes = ticked[candidate.id] ?? [];
  return codes.filter((code) => candidate.flags.some((f) => f.code === code));
}

/** Whether every flag on a candidate is ticked as checked. */
export function allTicked(
  candidate: Candidate,
  ticked: Record<string, string[]>
): boolean {
  const done = tickedFor(candidate, ticked);
  return candidate.flags.every((flag) => done.includes(flag.code));
}

/**
 * The rows a bulk accept sends: still to review, every flag ticked, and none
 * that must be accepted alone. The backend applies the same rule and answers
 * `SKIPPED_FLAGGED` for a row that slips through.
 */
export function bulkAcceptable(
  rows: Candidate[],
  ticked: Record<string, string[]>
): Candidate[] {
  return rows.filter(
    (c) => c.status === 'PROPOSED' && !acceptedAlone(c) && allTicked(c, ticked)
  );
}

/** One accept, carrying the ticked flag codes when the candidate has flags. */
export function acceptDecision(
  candidate: Candidate,
  ticked: Record<string, string[]>
): CandidateDecision {
  return {
    candidateId: candidate.id,
    action: 'ACCEPT',
    ...(candidate.flags.length > 0
      ? { acknowledgedFlags: tickedFor(candidate, ticked) }
      : {}),
  };
}

/**
 * Adds up printed percentages such as `20`, `20%` or `12.5 %` in hundredths,
 * so no rounding of binary fractions shows. Text that is not a percentage is
 * counted as unread, and the total says so.
 */
export function percentTotal(values: (string | undefined)[]): {
  total: string;
  counted: number;
  unread: number;
} {
  let hundredths = 0;
  let counted = 0;
  let unread = 0;
  for (const value of values) {
    if (value === undefined || value.trim() === '') continue;
    const match = value.trim().match(/^(\d+)(?:\.(\d{1,2}))?\s*%?$/);
    if (!match) {
      unread += 1;
      continue;
    }
    const whole = Number(match[1]);
    const frac = Number((match[2] ?? '').padEnd(2, '0'));
    hundredths += whole * 100 + frac;
    counted += 1;
  }
  const whole = Math.floor(hundredths / 100);
  const frac = hundredths % 100;
  const total =
    frac === 0
      ? String(whole)
      : `${whole}.${String(frac).padStart(2, '0').replace(/0$/, '')}`;
  return { total, counted, unread };
}
