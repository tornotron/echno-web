/**
 * One compliance generation run, as the backend reports it.
 *
 * Generation used to happen inside the request that asked for it, which stopped
 * working once a jurisdiction had enough rules for the run to outlast the edge
 * timeout. It is now a queued job: the request that starts it returns as soon as
 * the row is written, and the run is watched by polling.
 */

/**
 * The five states a run can be in.
 *
 * The three terminal ones are separate on purpose and must stay that way. A run
 * that assessed every rule and found nothing to create, and a run that produced
 * nothing because it broke, are different facts. They used to arrive here as the
 * same empty list, which is what made a broken analysis look like a clean one,
 * and collapsing them again in this client would put that back one layer further
 * from anyone who could notice it.
 */
export const complianceJobStatuses = [
  'queued',
  'running',
  'succeeded',
  'nothing-to-report',
  'failed',
] as const;

export type ComplianceJobStatus = (typeof complianceJobStatuses)[number];

export interface ComplianceGenerationJob {
  id: string;
  projectId: number;
  status: ComplianceJobStatus;
  /** Candidate rules for the project's jurisdiction, fixed when the job was accepted. */
  rulesTotal: number;
  /** Rules the model has answered on so far. Progress only, never a partial result. */
  rulesAssessed: number;
  /** Model calls the run is split into. */
  batchesTotal: number;
  batchesDone: number;
  /** Compliance inspections created. Meaningful only once the status is terminal. */
  createdCount: number;
  /** Why the last attempt did not finish. Set while retrying as well as on final failure. */
  errorMessage: string | null;
  /** Attempts started so far; zero until a worker picks the job up. */
  attempt: number;
  maxAttempts: number;
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

function isComplianceJobStatus(value: unknown): value is ComplianceJobStatus {
  return (
    typeof value === 'string' &&
    (complianceJobStatuses as readonly string[]).includes(value)
  );
}

function asCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Reads a job off the wire.
 *
 * Counts and timestamps are read leniently, because a missing count is a
 * cosmetic loss on a progress bar. The status is read strictly, because it is
 * the one field the whole screen is decided by: a status this client has not
 * been taught is refused rather than guessed at, since every available guess is
 * a way for a run that broke to be shown as a run that finished.
 */
export function parseComplianceGenerationJob(
  raw: unknown
): ComplianceGenerationJob {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Compliance generation job was not an object');
  }
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== 'string' || row.id.length === 0) {
    throw new Error('Compliance generation job carried no id');
  }
  if (!isComplianceJobStatus(row.status)) {
    throw new Error(
      `Compliance generation job carried an unrecognised status: ${String(row.status)}`
    );
  }
  return {
    id: row.id,
    projectId: asCount(row.projectId),
    status: row.status,
    rulesTotal: asCount(row.rulesTotal),
    rulesAssessed: asCount(row.rulesAssessed),
    batchesTotal: asCount(row.batchesTotal),
    batchesDone: asCount(row.batchesDone),
    createdCount: asCount(row.createdCount),
    errorMessage: asText(row.errorMessage),
    attempt: asCount(row.attempt),
    maxAttempts: asCount(row.maxAttempts),
    createdAt: asText(row.createdAt),
    startedAt: asText(row.startedAt),
    finishedAt: asText(row.finishedAt),
  };
}
