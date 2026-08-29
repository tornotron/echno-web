import type {
  ComplianceGenerationJob,
  ComplianceJobStatus,
} from '@/types/compliance-job';

/** Whether the run is still going, so the screen keeps watching it. */
export function isComplianceJobActive(status: ComplianceJobStatus): boolean {
  return status === 'queued' || status === 'running';
}

/** Whether the run is over and its row will not change again. */
export function isComplianceJobTerminal(status: ComplianceJobStatus): boolean {
  return (
    status === 'succeeded' ||
    status === 'nothing-to-report' ||
    status === 'failed'
  );
}

/**
 * How far the run has got, as a whole percentage.
 *
 * Rules rather than batches, because rules are the unit the user thinks in and
 * the last batch of a run is usually a short one. A job with no rules to assess
 * reports nought rather than dividing by zero.
 */
export function complianceJobPercent(job: ComplianceGenerationJob): number {
  if (job.rulesTotal > 0) {
    return Math.min(100, Math.round((job.rulesAssessed / job.rulesTotal) * 100));
  }
  if (job.batchesTotal > 0) {
    return Math.min(
      100,
      Math.round((job.batchesDone / job.batchesTotal) * 100)
    );
  }
  return 0;
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/**
 * What the run is doing right now, in the units the backend publishes.
 *
 * The old screen showed a spinner and nothing else for what can be minutes of
 * work, so a user could not tell a slow run from a stuck one. These are the
 * numbers that fix that, written after every completed batch.
 */
export function complianceJobProgressLabel(
  job: ComplianceGenerationJob
): string {
  const parts: string[] = [];
  if (job.status === 'queued') {
    parts.push(
      job.rulesTotal > 0
        ? `Queued: ${job.rulesTotal} ${plural(job.rulesTotal, 'rule', 'rules')} to assess`
        : 'Queued'
    );
  } else {
    parts.push(`Assessed ${job.rulesAssessed} of ${job.rulesTotal} rules`);
    if (job.batchesTotal > 0) {
      parts.push(`batch ${Math.max(1, job.batchesDone)} of ${job.batchesTotal}`);
    }
  }
  // A retry is why a bar can sit still or go backwards, so it is named rather
  // than left to look like a stall. A job waiting to be picked up counts the
  // attempt it is about to make; a job in a worker's hands counts the one it is
  // making. Neither is worth saying on a first attempt.
  const attemptNumber =
    job.status === 'queued' ? job.attempt + 1 : job.attempt;
  if (attemptNumber > 1) {
    parts.push(`attempt ${attemptNumber} of ${job.maxAttempts}`);
  }
  return parts.join(' · ');
}

/**
 * How an outcome is worded and coloured.
 *
 * Four tones for five statuses: the two in-flight ones share `progress`, and the
 * three terminal ones each get their own. That split is the requirement, not a
 * styling preference.
 */
export type ComplianceJobTone = 'progress' | 'success' | 'neutral' | 'failure';

export interface ComplianceJobOutcome {
  tone: ComplianceJobTone;
  title: string;
  description: string;
}

/**
 * What to show for a run in the state it is in.
 *
 * `succeeded`, `nothing-to-report` and `failed` are given a different tone, a
 * different title and a different description each. A finished run that created
 * nothing says so and says it assessed everything, because that is a complete
 * answer. A failed run says nothing was saved, because the alternative wording
 * (nothing was required) is exactly the misreading this module exists to stop.
 */
export function complianceJobOutcome(
  job: ComplianceGenerationJob
): ComplianceJobOutcome {
  switch (job.status) {
    case 'queued':
    case 'running': {
      return {
        tone: 'progress',
        title:
          job.status === 'queued'
            ? 'Compliance analysis queued'
            : 'Compliance analysis running',
        description: complianceJobProgressLabel(job),
      };
    }

    case 'succeeded': {
      return {
        tone: 'success',
        title: 'Compliance analysis complete',
        description: `${job.createdCount} ${plural(
          job.createdCount,
          'compliance',
          'compliances'
        )} created from ${job.rulesAssessed} ${plural(
          job.rulesAssessed,
          'rule',
          'rules'
        )} assessed.`,
      };
    }

    case 'nothing-to-report': {
      return {
        tone: 'neutral',
        title: 'Compliance analysis found nothing to add',
        description: `The run covered every rule for this project's jurisdiction (${job.rulesAssessed} of ${job.rulesTotal}) and none needed a new compliance. This is a complete result, not a run that stopped early.`,
      };
    }

    case 'failed': {
      const reason = job.errorMessage ? ` ${job.errorMessage}` : '';
      return {
        tone: 'failure',
        title: 'Compliance analysis could not be completed',
        description: `The run stopped after ${job.rulesAssessed} of ${job.rulesTotal} rules, so nothing was saved for it. This is not the same as finding no compliances: none were recorded, and the rules it did not reach have not been assessed.${reason}`,
      };
    }
  }
}
