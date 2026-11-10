'use client';

import { useState } from 'react';
import { ClipboardCopy, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useCopyQualityRequirementsToTemplate,
  useProjectQualityRequirements,
  useQualityRequirements,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  Candidate,
  CopyToTemplateResult,
  IngestPackage,
  QualityRequirementEntry,
} from '@tornotron/echno-core/document-ingestion/types';
import { qualityRequirementOf } from '@tornotron/echno-core/document-ingestion/types';
import { useOrgTrades } from '@tornotron/echno-core/inspection/hooks';
import { Button } from '@/components/shadcn/button';
import { useCan } from '@/hooks/use-can';
import { INGEST_CHECKLIST_ACCESS } from '../lib/access';
import { qualityFieldLabel } from '../lib/labels';
import { SELECT_CLASS } from '../lib/styles';
import { ApplyButton } from './ApplyButton';
import {
  CandidateReview,
  type EditField,
  type ReviewColumn,
} from './CandidateReview';
import { CELL, ErrorLine, Loading, RegisterTable } from './RegisterParts';

/** ITP rows are listed this many to a page. */
export const QUALITY_PAGE_SIZE = 200;

const COLUMNS: ReviewColumn[] = [
  {
    header: 'Activity',
    className: 'min-w-40',
    cell: (c) => {
      const q = qualityRequirementOf(c);
      return q.activity ?? q.subject ?? '';
    },
  },
  {
    header: 'Material',
    cell: (c) => {
      const q = qualityRequirementOf(c);
      return [q.material, q.grade].filter(Boolean).join(', ');
    },
  },
  {
    header: 'Standard',
    cell: (c) => qualityRequirementOf(c).standards.join(', '),
  },
  { header: 'Test', cell: (c) => qualityRequirementOf(c).test ?? '' },
  {
    header: 'Frequency',
    cell: (c) => qualityRequirementOf(c).frequency ?? '',
  },
  {
    header: 'Acceptance',
    cell: (c) => qualityRequirementOf(c).acceptanceCriterion ?? '',
  },
  {
    header: 'Hold or witness',
    cell: (c) => qualityRequirementOf(c).holdOrWitnessPoint ?? '',
  },
];

const EDIT_FIELDS: EditField[] = [
  {
    key: 'activity',
    label: 'Activity',
    value: (c) => qualityRequirementOf(c).activity,
  },
  { key: 'test', label: 'Test', value: (c) => qualityRequirementOf(c).test },
  {
    key: 'frequency',
    label: 'Frequency',
    value: (c) => qualityRequirementOf(c).frequency,
  },
  {
    key: 'acceptance_criterion',
    label: 'Acceptance',
    multiline: true,
    value: (c) => qualityRequirementOf(c).acceptanceCriterion,
  },
  {
    key: 'hold_or_witness_point',
    label: 'Hold or witness',
    value: (c) => qualityRequirementOf(c).holdOrWitnessPoint,
  },
];

/** A short name for an ITP row; a blank activity falls back to the subject. */
function rowName(q: QualityRequirementEntry): string {
  return q.activity || q.subject || 'ITP row';
}

function describe(c: Candidate): string {
  const q = qualityRequirementOf(c);
  return q.activity ?? q.subject ?? 'requirement';
}

const outcomeText: Record<string, string> = {
  COPIED: 'copied',
  ALREADY_COPIED: 'already in a template',
  NO_TRADE: 'no trade, pick one',
  NOT_FOUND: 'not found',
};

const HEADERS = [
  'Activity',
  'Material',
  'Standard',
  'Test',
  'Frequency',
  'Acceptance',
  'Hold or witness',
  'Trade',
  'Template',
];

/**
 * ITP rows as a table: what is tested, against which standard, how often,
 * what passes, and where work stops for a hold or witness point. A field the
 * specification does not state is said to be not stated. With `selection`,
 * each row has a tick for copying it to a checklist template.
 */
export function QualityRequirementsTable({
  rows,
  selection,
}: {
  rows: QualityRequirementEntry[];
  selection?: {
    ids: string[];
    toggle: (id: string) => void;
  };
}) {
  return (
    <RegisterTable
      testId="quality-requirements"
      headers={selection ? ['', ...HEADERS] : HEADERS}
    >
      {rows.map((q) => (
        <tr key={q.id} className="border-t">
          {selection && (
            <td className={CELL}>
              <input
                type="checkbox"
                aria-label={`Pick ${rowName(q)}`}
                checked={selection.ids.includes(q.id)}
                onChange={() => selection.toggle(q.id)}
              />
            </td>
          )}
          <td className={CELL}>{rowName(q)}</td>
          <td className={CELL}>
            {[q.material, q.grade].filter(Boolean).join(', ')}
          </td>
          <td className={CELL}>{q.standards.join(', ')}</td>
          <td className={CELL}>{q.test ?? ''}</td>
          <td className={CELL}>{q.frequency ?? ''}</td>
          <td className={CELL}>
            {q.acceptanceCriterion ?? ''}
            {q.notStated.length > 0 && (
              <span className="text-destructive block text-xs">
                Not stated:{' '}
                {q.notStated.map((f) => qualityFieldLabel(f)).join(', ')}
              </span>
            )}
          </td>
          <td className={CELL}>{q.holdOrWitnessPoint ?? ''}</td>
          <td className={CELL}>{q.tradeName ?? ''}</td>
          <td className={CELL}>
            {q.templateId
              ? `Copied${q.templateVersion ? `, version ${q.templateVersion}` : ''}`
              : ''}
          </td>
        </tr>
      ))}
    </RegisterTable>
  );
}

function CopyOutcome({
  result,
  rows,
}: {
  result: CopyToTemplateResult;
  rows: QualityRequirementEntry[];
}) {
  const name = (id: string) => {
    const row = rows.find((q) => q.id === id);
    return row ? rowName(row) : id;
  };
  return (
    <div role="status" className="flex flex-col gap-1 text-sm">
      {result.templates.map((t) => (
        <p key={t.templateId}>
          {t.created ? 'Made' : 'Added to'} {t.templateName} ({t.tradeName}),
          version {t.version}: {t.itemsAdded}{' '}
          {t.itemsAdded === 1 ? 'item' : 'items'} added
          {t.active ? '.' : ', not active yet.'}
        </p>
      ))}
      <ul className="text-muted-foreground text-xs">
        {result.rows.map((r) => (
          <li key={r.requirementId}>
            {name(r.requirementId)}: {outcomeText[r.outcome] ?? r.outcome}
            {r.message ? `. ${r.message}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The applied ITP rows of a package, each of which can be copied to a checklist template. */
export function QualityRegister({ packageId }: { packageId: string }) {
  const { data, isLoading, isError, error } = useQualityRequirements(
    packageId,
    { size: QUALITY_PAGE_SIZE }
  );
  const copy = useCopyQualityRequirementsToTemplate();
  const { allowed: canCopy } = useCan(INGEST_CHECKLIST_ACCESS);
  const trades = useOrgTrades(false, canCopy);
  const [ids, setIds] = useState<string[]>([]);
  const [tradeId, setTradeId] = useState('');
  const [result, setResult] = useState<CopyToTemplateResult | null>(null);

  if (isLoading) return <Loading text="Loading the ITP" />;
  if (isError) return <ErrorLine error={error} />;
  const rows = data?.content ?? [];
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No ITP rows are applied yet. They appear here once you apply the
        accepted ones.
      </p>
    );
  }
  const toggle = (id: string) =>
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="flex flex-col gap-3">
      <QualityRequirementsTable
        rows={rows}
        selection={canCopy ? { ids, toggle } : undefined}
      />
      {canCopy && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={SELECT_CLASS}
            aria-label="Trade"
            value={tradeId}
            onChange={(e) => setTradeId(e.target.value)}
          >
            <option value="">Trade of each row</option>
            {(trades.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            disabled={ids.length === 0 || copy.isPending}
            onClick={() => {
              setResult(null);
              copy
                .mutateAsync({
                  requirementIds: ids,
                  ...(tradeId ? { tradeId } : {}),
                })
                .then((outcome) => {
                  if (outcome) setResult(outcome);
                  setIds([]);
                })
                .catch(() => {});
            }}
          >
            {copy.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ClipboardCopy className="size-4" />
            )}
            Copy {ids.length === 1 ? '1 row' : `${ids.length} rows`} to a
            checklist template
          </Button>
        </div>
      )}
      {copy.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getErrorMessage(copy.error)}
        </p>
      )}
      {result && <CopyOutcome result={result} rows={rows} />}
    </div>
  );
}

/** The project's ITP: every applied quality requirement across its packages. */
export function ProjectItp({ projectId }: { projectId: number }) {
  const { data, isLoading, isError, error } = useProjectQualityRequirements(
    projectId,
    { size: QUALITY_PAGE_SIZE }
  );
  if (isLoading) return <Loading text="Loading the ITP" />;
  if (isError) return <ErrorLine error={error} />;
  const rows = data?.content ?? [];
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No quality requirement of this project came from a document.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2" data-testid="project-itp">
      <QualityRequirementsTable rows={rows} />
      {data && data.totalElements > rows.length && (
        <p className="text-muted-foreground text-xs">
          Showing {rows.length} of {data.totalElements}.
        </p>
      )}
    </div>
  );
}

/** The quality tab: review the ITP rows read from the specification, apply, then copy them on. */
export function QualityReview({
  pkg,
  fileNames,
}: {
  pkg: IngestPackage;
  fileNames: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-6" data-testid="quality">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">ITP rows to review</h3>
        <CandidateReview
          packageId={pkg.id}
          kind="QUALITY_REQUIREMENT"
          fileNames={fileNames}
          columns={COLUMNS}
          editFields={EDIT_FIELDS}
          describe={describe}
          emptyText="No quality requirements yet. They are read from the specification once its class is confirmed."
          testId="quality-review"
        />
        <ApplyButton
          packageId={pkg.id}
          kind="QUALITY_REQUIREMENT"
          label="Apply ITP rows"
        />
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">ITP</h3>
        <QualityRegister packageId={pkg.id} />
      </section>
    </div>
  );
}
