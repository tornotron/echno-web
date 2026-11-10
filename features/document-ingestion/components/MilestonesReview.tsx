'use client';

import type {
  Candidate,
  IngestPackage,
} from '@tornotron/echno-core/document-ingestion/types';
import {
  hasFlag,
  INGEST_FLAG,
  milestoneOf,
} from '@tornotron/echno-core/document-ingestion/types';
import { percentTotal } from '../lib/review';
import { ApplyButton } from './ApplyButton';
import { CandidateReview, type ReviewColumn } from './CandidateReview';

function describe(c: Candidate): string {
  return milestoneOf(c).name ?? 'milestone';
}

const COLUMNS: ReviewColumn[] = [
  {
    header: 'Milestone',
    className: 'min-w-48',
    cell: (c) => (
      <span className="whitespace-pre-wrap">{milestoneOf(c).name ?? ''}</span>
    ),
  },
  {
    header: 'Date or time',
    cell: (c) => {
      const time = milestoneOf(c).time;
      return (
        <div className="flex flex-col">
          <span>{time ?? ''}</span>
          {hasFlag(c, INGEST_FLAG.RELATIVE_TIME) && (
            <span className="text-muted-foreground text-xs">
              Counted from the project start date
            </span>
          )}
        </div>
      );
    },
  },
  {
    header: 'Payment %',
    className: 'text-right tabular-nums',
    cell: (c) => milestoneOf(c).percent ?? '',
  },
  {
    header: 'Amount',
    className: 'text-right tabular-nums',
    cell: (c) => milestoneOf(c).amount ?? '',
  },
];

const EDIT_FIELDS = [
  {
    key: 'name',
    label: 'Milestone',
    value: (c: Candidate) => milestoneOf(c).name,
  },
  {
    key: 'time',
    label: 'Date or time',
    value: (c: Candidate) => milestoneOf(c).time,
  },
  {
    key: 'percent',
    label: 'Payment %',
    value: (c: Candidate) => milestoneOf(c).percent,
  },
  {
    key: 'amount',
    label: 'Amount',
    value: (c: Candidate) => milestoneOf(c).amount,
  },
];

/** What the checks on a schedule found, said in full above the rows. */
function ScheduleChecks({ rows }: { rows: Candidate[] }) {
  const standing = rows.filter(
    (c) => c.status !== 'REJECTED' && c.status !== 'SUPERSEDED'
  );
  const { total, counted, unread } = percentTotal(
    standing.map((c) => milestoneOf(c).percent)
  );
  const percentFlag = standing.some((c) =>
    hasFlag(c, INGEST_FLAG.PERCENT_TOTAL)
  );
  const outOfOrder = standing.filter((c) =>
    hasFlag(c, INGEST_FLAG.DATE_ORDER)
  ).length;
  const relative = standing.filter((c) =>
    hasFlag(c, INGEST_FLAG.RELATIVE_TIME)
  ).length;
  if (standing.length === 0) return null;
  return (
    <ul
      className="flex flex-col gap-1 rounded-md border p-3 text-sm"
      data-testid="schedule-checks"
    >
      {counted > 0 && (
        <li className={percentFlag ? 'text-destructive' : undefined}>
          The payment percentages on this page add up to {total}%
          {percentFlag
            ? ', not 100. Check the schedule before accepting.'
            : '.'}
          {unread > 0 &&
            ` ${unread} ${unread === 1 ? 'percentage is' : 'percentages are'} not plain numbers and not counted.`}
        </li>
      )}
      {outOfOrder > 0 && (
        <li className="text-destructive">
          {outOfOrder === 1
            ? '1 milestone falls before the one above it.'
            : `${outOfOrder} milestones fall before the one above them.`}
        </li>
      )}
      {relative > 0 && (
        <li>
          {relative === 1 ? '1 milestone is' : `${relative} milestones are`}{' '}
          printed as a time from the start, such as &quot;Month 4&quot;. The
          date is counted from the project start date when applied; with no
          start date it stays empty and the printed text is kept.
        </li>
      )}
    </ul>
  );
}

/**
 * The milestone schedule read from the tender. Applying writes each accepted
 * row as a schedule milestone on the package's project and, when the package
 * names a contract, as a payment milestone on it.
 */
export function MilestonesReview({
  pkg,
  fileNames,
}: {
  pkg: IngestPackage;
  fileNames: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-6" data-testid="milestones">
      <CandidateReview
        packageId={pkg.id}
        kind="MILESTONE"
        fileNames={fileNames}
        columns={COLUMNS}
        editFields={EDIT_FIELDS}
        describe={describe}
        emptyText="No milestones yet. They are read from a milestone schedule once its class is confirmed."
        header={(rows) => <ScheduleChecks rows={rows} />}
      />
      <div className="flex flex-col gap-2">
        <p className="text-sm">
          {pkg.projectId === undefined
            ? 'The package has no project yet. Create it from the project fields first, then apply the milestones.'
            : pkg.subContractId === undefined
              ? 'Accepted milestones go to the project schedule. Pick a contract on the BOQ tab to also make them payment milestones.'
              : 'Accepted milestones go to the project schedule and become payment milestones on the picked contract.'}
        </p>
        <ApplyButton
          packageId={pkg.id}
          kind="MILESTONE"
          label="Apply milestones"
        />
      </div>
    </div>
  );
}
