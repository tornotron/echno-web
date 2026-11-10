'use client';

import { useState } from 'react';
import {
  useComplianceMatrix,
  useSetQualificationStatus,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  Candidate,
  ComplianceMatrixRow,
  IngestPackage,
  MatrixStatus,
} from '@tornotron/echno-core/document-ingestion/types';
import {
  isQualificationSetByPerson,
  MATRIX_STATUSES,
  qualificationRequirementOf,
} from '@tornotron/echno-core/document-ingestion/types';
import { Badge } from '@/components/shadcn/badge';
import { useCan } from '@/hooks/use-can';
import { INGEST_QUALIFICATION_ACCESS } from '../lib/access';
import {
  matrixBasisLabel,
  matrixStatusLabels,
  qualificationLabel,
} from '../lib/labels';
import { SELECT_CLASS } from '../lib/styles';
import { ApplyButton } from './ApplyButton';
import {
  CandidateReview,
  type EditField,
  type ReviewColumn,
} from './CandidateReview';
import { CELL, ErrorLine, Loading, RegisterTable } from './RegisterParts';

function requirementOf(c: Candidate): string | undefined {
  return qualificationRequirementOf(c).requirement;
}

const COLUMNS: ReviewColumn[] = [
  {
    header: 'Requirement',
    cell: (c) => qualificationLabel(requirementOf(c)),
  },
  {
    header: 'As the tender states it',
    className: 'min-w-48',
    cell: (c) => (
      <span className="whitespace-pre-wrap">
        {qualificationRequirementOf(c).value}
      </span>
    ),
  },
  {
    header: 'Minimum',
    cell: (c) => qualificationRequirementOf(c).minValue ?? '',
  },
  { header: 'Period', cell: (c) => qualificationRequirementOf(c).period ?? '' },
];

const EDIT_FIELDS: EditField[] = [
  {
    key: 'value',
    label: 'As the tender states it',
    multiline: true,
    value: (c) => qualificationRequirementOf(c).value,
  },
  {
    key: 'min_value',
    label: 'Minimum',
    value: (c) => qualificationRequirementOf(c).minValue,
  },
  {
    key: 'period',
    label: 'Period',
    value: (c) => qualificationRequirementOf(c).period,
  },
];

const statusVariant: Record<
  MatrixStatus,
  'secondary' | 'destructive' | 'amber'
> = {
  MATCH: 'secondary',
  GAP: 'destructive',
  UNKNOWN: 'amber',
};

/**
 * A person's judgement on a requirement the backend does not compare by
 * itself (equipment and personnel). Choosing the blank option
 * clears it. Hidden from a role that may not apply.
 */
function StatusPicker({ row }: { row: ComplianceMatrixRow }) {
  const set = useSetQualificationStatus();
  const { allowed } = useCan(INGEST_QUALIFICATION_ACCESS);
  const [error, setError] = useState<unknown>(null);
  if (!allowed) return null;
  const value = row.basis === 'SET_BY_PERSON' ? row.status : '';
  return (
    <div className="flex flex-col gap-1">
      <select
        className={SELECT_CLASS}
        aria-label={`Judgement: ${row.label || qualificationLabel(row.requirement)}`}
        value={value}
        disabled={set.isPending}
        onChange={(e) => {
          setError(null);
          const status = (e.target.value || null) as MatrixStatus | null;
          set
            .mutateAsync({ requirementId: row.requirementId, req: { status } })
            .catch((error_: unknown) => setError(error_));
        }}
      >
        <option value="">Not judged</option>
        {MATRIX_STATUSES.map((s) => (
          <option key={s} value={s}>
            {matrixStatusLabels[s]}
          </option>
        ))}
      </select>
      {error !== null && <ErrorLine error={error} />}
    </div>
  );
}

/**
 * The compliance matrix: each qualification the tender asks for beside what
 * the company profile holds, and whether it meets it. Turnover, similar
 * projects and experience are compared by the backend; the rest wait for a person's
 * judgement. The matrix is shown only for a tender package.
 */
export function ComplianceMatrixView({ packageId }: { packageId: string }) {
  const { data, isLoading, isError, error } = useComplianceMatrix(packageId);
  if (isLoading) return <Loading text="Loading the compliance matrix" />;
  if (isError) return <ErrorLine error={error} />;
  if (!data) return null;
  if (!data.shown) {
    return (
      <p className="text-muted-foreground text-sm">
        {data.notice ??
          'The compliance matrix is shown for a package still at tender.'}
      </p>
    );
  }
  if (data.rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No qualification requirements are applied yet. They appear here once you
        apply the accepted ones.
      </p>
    );
  }
  const count = (s: MatrixStatus) =>
    data.rows.filter((r) => r.status === s).length;
  return (
    <div className="flex flex-col gap-3" data-testid="compliance-matrix">
      {data.notice && <p className="text-sm">{data.notice}</p>}
      <p className="text-sm" data-testid="matrix-summary">
        Meets {count('MATCH')}, gaps {count('GAP')}, not known{' '}
        {count('UNKNOWN')}.
      </p>
      <RegisterTable
        headers={[
          'Requirement',
          'Tender asks for',
          'Company has',
          'Status',
          'Why',
          'Evidence',
          'Judgement',
        ]}
      >
        {data.rows.map((row) => (
          <tr
            key={row.requirementId}
            className="border-t"
            data-testid={`matrix-${row.requirementId}`}
          >
            <td className={CELL}>
              {row.label || qualificationLabel(row.requirement)}
            </td>
            <td className={`${CELL} whitespace-pre-wrap`}>{row.tenderValue}</td>
            <td className={`${CELL} whitespace-pre-wrap`}>
              {row.companyValue ?? ''}
            </td>
            <td className={CELL}>
              <Badge variant={statusVariant[row.status] ?? 'amber'}>
                {matrixStatusLabels[row.status] ?? row.status}
              </Badge>
            </td>
            <td className={CELL}>
              <span>{matrixBasisLabel(row.basis)}</span>
              {row.reason && (
                <span className="text-muted-foreground block text-xs">
                  {row.reason}
                </span>
              )}
              {row.statusNote && (
                <span className="text-muted-foreground block text-xs">
                  {row.statusNote}
                </span>
              )}
            </td>
            <td className={CELL}>
              {row.evidence.map((e) => e.label ?? e.fileName).join(', ')}
            </td>
            <td className={CELL}>
              {isQualificationSetByPerson(row.requirement) && (
                <StatusPicker row={row} />
              )}
            </td>
          </tr>
        ))}
      </RegisterTable>
    </div>
  );
}

/** The qualification tab: review the eligibility requirements, apply, then read the matrix. */
export function QualificationReview({
  pkg,
  fileNames,
}: {
  pkg: IngestPackage;
  fileNames: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-6" data-testid="qualification">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Requirements to review</h3>
        <CandidateReview
          packageId={pkg.id}
          kind="QUALIFICATION_REQUIREMENT"
          fileNames={fileNames}
          columns={COLUMNS}
          editFields={EDIT_FIELDS}
          describe={(c) => qualificationLabel(requirementOf(c))}
          emptyText="No qualification requirements yet. They are read from the eligibility criteria once their class is confirmed."
          testId="qualification-review"
        />
        <ApplyButton
          packageId={pkg.id}
          kind="QUALIFICATION_REQUIREMENT"
          label="Apply requirements"
        />
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Compliance matrix</h3>
        <ComplianceMatrixView packageId={pkg.id} />
      </section>
    </div>
  );
}
