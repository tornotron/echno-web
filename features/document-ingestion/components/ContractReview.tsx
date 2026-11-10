'use client';

import { useMemo } from 'react';
import {
  useContractTermCoverage,
  useContractTerms,
  useObligations,
  useRaiseContractTermRisk,
  useRaiseObligationRisk,
} from '@tornotron/echno-core/document-ingestion/hooks';
import type {
  Candidate,
  ContractTermEntry,
  IngestPackage,
  ObligationEntry,
  TermCoverage,
} from '@tornotron/echno-core/document-ingestion/types';
import {
  contractTermOf,
  hasFlag,
  INGEST_FLAG,
  obligationOf,
} from '@tornotron/echno-core/document-ingestion/types';
import { Badge } from '@/components/shadcn/badge';
import {
  contractTermLabel,
  docClassLabel,
  termCoverageLabels,
} from '../lib/labels';
import { ApplyButton } from './ApplyButton';
import {
  CandidateReview,
  type EditField,
  type ReviewColumn,
} from './CandidateReview';
import {
  CELL,
  ErrorLine,
  Loading,
  RaiseRiskButton,
  RegisterTable,
} from './RegisterParts';

/** Obligations are listed this many to a page; a contract rarely holds more. */
export const OBLIGATION_PAGE_SIZE = 200;

function termOf(c: Candidate): string | undefined {
  return contractTermOf(c).term ?? c.naturalKey;
}

const TERM_COLUMNS: ReviewColumn[] = [
  {
    header: 'Term',
    className: 'min-w-40',
    cell: (c) => (
      <div className="flex flex-col">
        <span>{contractTermLabel(termOf(c))}</span>
        {hasFlag(c, INGEST_FLAG.OVERRIDDEN_BY_SCC) && (
          <span className="text-muted-foreground text-xs">
            The special conditions change this value
          </span>
        )}
      </div>
    ),
  },
  {
    header: 'Value',
    className: 'min-w-48',
    cell: (c) => (
      <span className="whitespace-pre-wrap">{contractTermOf(c).value}</span>
    ),
  },
  { header: 'Clause', cell: (c) => contractTermOf(c).clause ?? '' },
];

const TERM_EDIT: EditField[] = [
  {
    key: 'value',
    label: 'Value',
    multiline: true,
    value: (c) => contractTermOf(c).value,
  },
  { key: 'clause', label: 'Clause', value: (c) => contractTermOf(c).clause },
];

const OBLIGATION_COLUMNS: ReviewColumn[] = [
  { header: 'Clause', cell: (c) => obligationOf(c).clause ?? '' },
  {
    header: 'Deadline',
    className: 'min-w-40',
    cell: (c) => (
      <span className="whitespace-pre-wrap">{obligationOf(c).deadline}</span>
    ),
  },
  { header: 'Who', cell: (c) => obligationOf(c).responsibleParty ?? '' },
  {
    header: 'Document to give',
    cell: (c) => obligationOf(c).requiredDocument ?? '',
  },
  {
    header: 'Money at stake',
    cell: (c) => obligationOf(c).financialImpact ?? '',
  },
];

const OBLIGATION_EDIT: EditField[] = [
  {
    key: 'deadline',
    label: 'Deadline',
    value: (c) => obligationOf(c).deadline,
  },
  {
    key: 'responsible_party',
    label: 'Who',
    value: (c) => obligationOf(c).responsibleParty,
  },
  {
    key: 'required_document',
    label: 'Document to give',
    value: (c) => obligationOf(c).requiredDocument,
  },
  {
    key: 'financial_impact',
    label: 'Money at stake',
    value: (c) => obligationOf(c).financialImpact,
  },
];

const coverageVariant = {
  FOUND: 'secondary',
  NOT_FOUND: 'amber',
  NOT_READ: 'destructive',
} as const;

function CoverageRow({
  coverage,
  entry,
}: {
  coverage: TermCoverage;
  entry?: ContractTermEntry;
}) {
  const raise = useRaiseContractTermRisk();
  const variant =
    coverageVariant[coverage.status as keyof typeof coverageVariant] ??
    'outline';
  return (
    <tr className="border-t" data-testid={`term-${coverage.term}`}>
      <td className={CELL}>
        {coverage.label || contractTermLabel(coverage.term)}
      </td>
      <td className={CELL}>
        <Badge variant={variant}>
          {termCoverageLabels[coverage.status] ?? coverage.status}
        </Badge>
      </td>
      <td className={CELL}>
        {entry ? (
          <div className="flex flex-col">
            <span className="whitespace-pre-wrap">{entry.value}</span>
            {entry.clause && (
              <span className="text-muted-foreground text-xs">
                Clause {entry.clause}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">Not applied</span>
        )}
      </td>
      <td className={CELL}>
        {coverage.found.length > 0 && (
          <ul className="flex flex-col gap-1">
            {coverage.found.map((found) => (
              <li key={found.candidateId} className="flex flex-col">
                <span
                  className={
                    found.overridden
                      ? 'text-muted-foreground line-through'
                      : undefined
                  }
                >
                  {found.value}
                </span>
                <span className="text-muted-foreground text-xs">
                  {docClassLabel(found.docClass)}
                  {found.clause ? `, clause ${found.clause}` : ''}
                  {found.overridden
                    ? ', replaced by the special conditions'
                    : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
        {coverage.message && (
          <span className="text-muted-foreground text-xs">
            {coverage.message}
          </span>
        )}
      </td>
      <td className={CELL}>
        {entry && (
          <RaiseRiskButton
            riskId={entry.riskId}
            label={entry.label || contractTermLabel(entry.term)}
            pending={raise.isPending}
            raise={() => raise.mutateAsync({ termId: entry.id })}
          />
        )}
      </td>
    </tr>
  );
}

/**
 * Every one of the contract terms the reader looks for, whether it was found
 * and in which part, with the value applied to the register. A term found in
 * both the general and the special conditions shows both, the general one
 * struck through. A term not found says which pages were searched.
 */
export function ContractTermsRegister({ packageId }: { packageId: string }) {
  const coverage = useContractTermCoverage(packageId);
  const terms = useContractTerms(packageId);
  const byTerm = useMemo(
    () => new Map((terms.data ?? []).map((t) => [t.term, t])),
    [terms.data]
  );

  if (coverage.isLoading) return <Loading text="Loading the contract terms" />;
  if (coverage.isError) return <ErrorLine error={coverage.error} />;
  const data = coverage.data;
  if (!data) return null;
  return (
    <div className="flex flex-col gap-3" data-testid="contract-terms">
      {data.notice && <p className="text-sm">{data.notice}</p>}
      {terms.isError && <ErrorLine error={terms.error} />}
      {data.read.length > 0 && (
        <ul className="text-muted-foreground flex flex-col gap-0.5 text-xs">
          {data.read.map((part) => (
            <li key={part.segmentId}>
              {part.fileName}
              {part.pagesSearched
                ? `, pages ${part.pagesSearched} searched`
                : ''}
              {part.pagesNotRead.length > 0 &&
                `, pages ${part.pagesNotRead.join(', ')} not read`}
            </li>
          ))}
        </ul>
      )}
      <RegisterTable
        headers={['Term', 'Found', 'Applied value', 'Read from', 'Risk']}
      >
        {data.terms.map((term) => (
          <CoverageRow
            key={term.term}
            coverage={term}
            entry={byTerm.get(term.term)}
          />
        ))}
      </RegisterTable>
    </div>
  );
}

function ObligationRow({ obligation }: { obligation: ObligationEntry }) {
  const raise = useRaiseObligationRisk();
  return (
    <tr className="border-t">
      <td className={CELL}>{obligation.clause ?? ''}</td>
      <td className={`${CELL} whitespace-pre-wrap`}>{obligation.deadline}</td>
      <td className={CELL}>{obligation.responsibleParty ?? ''}</td>
      <td className={CELL}>{obligation.requiredDocument ?? ''}</td>
      <td className={CELL}>{obligation.financialImpact ?? ''}</td>
      <td className={CELL}>
        <RaiseRiskButton
          riskId={obligation.riskId}
          label={obligation.clause ?? obligation.deadline}
          pending={raise.isPending}
          raise={() => raise.mutateAsync({ obligationId: obligation.id })}
        />
      </td>
    </tr>
  );
}

/** The applied obligations: each deadline, who owes it, and what it costs to miss. */
export function ObligationsRegister({ packageId }: { packageId: string }) {
  const { data, isLoading, isError, error } = useObligations(packageId, {
    size: OBLIGATION_PAGE_SIZE,
  });
  if (isLoading) return <Loading text="Loading the obligations" />;
  if (isError) return <ErrorLine error={error} />;
  const rows = data?.content ?? [];
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No obligations are applied yet. They appear here once you apply the
        accepted ones.
      </p>
    );
  }
  return (
    <RegisterTable
      testId="obligations"
      headers={[
        'Clause',
        'Deadline',
        'Who',
        'Document to give',
        'Money at stake',
        'Risk',
      ]}
    >
      {rows.map((o) => (
        <ObligationRow key={o.id} obligation={o} />
      ))}
    </RegisterTable>
  );
}

/**
 * The contract tab: review the terms and the obligations read from the
 * general and special conditions and the contract data, apply them, then
 * read the registers they land in.
 */
export function ContractReview({
  pkg,
  fileNames,
}: {
  pkg: IngestPackage;
  fileNames: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-6" data-testid="contract-review">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Contract terms to review</h3>
        <CandidateReview
          packageId={pkg.id}
          kind="CONTRACT_TERM"
          fileNames={fileNames}
          columns={TERM_COLUMNS}
          editFields={TERM_EDIT}
          describe={(c) => contractTermLabel(termOf(c))}
          emptyText="No contract terms yet. They are read from the general and special conditions and the contract data once their classes are confirmed."
          testId="contract-term-review"
        />
        <ApplyButton
          packageId={pkg.id}
          kind="CONTRACT_TERM"
          label="Apply contract terms"
        />
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Contract terms register</h3>
        <ContractTermsRegister packageId={pkg.id} />
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Obligations to review</h3>
        <CandidateReview
          packageId={pkg.id}
          kind="OBLIGATION"
          fileNames={fileNames}
          columns={OBLIGATION_COLUMNS}
          editFields={OBLIGATION_EDIT}
          describe={(c) => obligationOf(c).clause ?? 'obligation'}
          emptyText="No obligations yet. They are read from the conditions of contract once their classes are confirmed."
          testId="obligation-review"
        />
        <ApplyButton
          packageId={pkg.id}
          kind="OBLIGATION"
          label="Apply obligations"
        />
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Obligations register</h3>
        <ObligationsRegister packageId={pkg.id} />
      </section>
    </div>
  );
}
