import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { complianceJobService } from '@/services/compliance-job-service';
import { toast } from '@/lib/styles/toast-styles';
import {
  complianceJobOutcome,
  complianceJobPercent,
  complianceJobProgressLabel,
  isComplianceJobActive,
  isComplianceJobTerminal,
  type ComplianceJobOutcome,
} from '@/lib/compliance/compliance-job-status';
import type { ComplianceGenerationJob } from '@/types/compliance-job';
import { inspectionKeys } from './inspection-keys';

/**
 * How often a run in flight is read again.
 *
 * The backend writes progress after every completed batch, and a batch is about
 * twenty seconds, so two seconds is far more often than the numbers change. That
 * is deliberate: the cost is one indexed single-row read, and the benefit is that
 * the moment a run finishes is the moment the screen says so.
 */
export const COMPLIANCE_JOB_POLL_INTERVAL_MS = 2000;

const OUTCOME_TOAST_DURATION_MS = 12_000;

/**
 * A failure has to stay up longest. It is the outcome a user is most likely to
 * mistake for a clean run, and the one that needs acting on.
 */
const FAILURE_TOAST_DURATION_MS = 20_000;

export const complianceJobKeys = {
  all: ['compliance-generation-jobs'] as const,
  watched: (projectId: number, jobId: string | null) =>
    [...complianceJobKeys.all, projectId, jobId] as const,
};

/**
 * True when the job handed back by a start request was not started by it.
 *
 * The backend answers 200 with the run already in flight instead of 202 with a
 * new one, but the shared API client hands back a parsed body and no status
 * code, so the join is recognised from the job itself. A run that a worker has
 * already claimed, already made progress on, or already retried cannot be the
 * one this click just queued.
 */
function wasAlreadyUnderway(job: ComplianceGenerationJob): boolean {
  return (
    job.status === 'running' ||
    job.startedAt !== null ||
    job.attempt > 0 ||
    job.batchesDone > 0
  );
}

export interface ComplianceGenerationState {
  /** Starts a run for this project, or joins the one already in flight. */
  start: () => void;
  isStarting: boolean;
  /** The run being watched, or null when this project has never had one. */
  job: ComplianceGenerationJob | null;
  /** True while the run is queued or running. */
  isActive: boolean;
  /** Whole percent of the candidate rules assessed so far. */
  percent: number;
  /** What the run is doing, in rules and batches. Null when there is no run. */
  progressLabel: string | null;
  /** How the current state should be worded and coloured. */
  outcome: ComplianceJobOutcome | null;
  /** True when the last start joined a run that was already going. */
  joinedExistingRun: boolean;
  /** Reads the run again now, rather than waiting for the next poll. */
  refetch: () => void;
}

/**
 * Runs, watches and reports AI compliance generation for one project.
 *
 * Generation is a queued job rather than a request that waits: starting it
 * returns as soon as the row is written, and this hook polls the run until it
 * ends. Three things follow from that and are the reason this hook exists at
 * all rather than a plain mutation.
 *
 * A page reloaded during a run has lost the job id it was holding, so on mount
 * the latest run for the project is read and adopted. Without that the screen
 * would go quiet halfway through minutes of work.
 *
 * A second click on a project that already has a run in flight joins that run,
 * which the backend enforces with a partial unique index. That is a normal
 * outcome and is reported as information, not as a refusal.
 *
 * The three terminal states are reported on three different channels with three
 * different wordings, and that is the part not to simplify. A run that assessed
 * everything and found nothing to create is a complete answer; a run that
 * produced nothing because it broke is not. They reached the old screen as the
 * same empty list, which is the bug the backend's status set exists to close,
 * and collapsing them here would reopen it further from anyone who would notice.
 */
export function useComplianceGeneration(
  projectId: number
): ComplianceGenerationState {
  const queryClient = useQueryClient();
  const [watchedJobId, setWatchedJobId] = useState<string | null>(null);
  const [joinedExistingRun, setJoinedExistingRun] = useState(false);

  // Runs this session is responsible for: ones it started or joined, and ones it
  // found still going. A finished run read off the server on page load is shown
  // but never announced, because its toast would be news from an hour ago.
  const watchedRef = useRef<Set<string>>(new Set());
  const announcedRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: complianceJobKeys.watched(projectId, watchedJobId),
    queryFn: () =>
      watchedJobId
        ? complianceJobService.getById(watchedJobId)
        : complianceJobService.getLatestForProject(projectId),
    enabled: Number.isFinite(projectId) && projectId > 0,
    // Polling stops the moment the run is over, so a finished job costs nothing.
    refetchInterval: (q) => {
      const current = q.state.data as ComplianceGenerationJob | null | undefined;
      return current && isComplianceJobActive(current.status)
        ? COMPLIANCE_JOB_POLL_INTERVAL_MS
        : false;
    },
    refetchOnWindowFocus: false,
  });

  const job = query.data ?? null;

  const startMutation = useMutation({
    mutationFn: () => complianceJobService.start(projectId),
    onSuccess: (accepted) => {
      const joined = wasAlreadyUnderway(accepted);
      setJoinedExistingRun(joined);
      watchedRef.current.add(accepted.id);
      setWatchedJobId(accepted.id);
      // Seeded so the progress panel appears on the click rather than one poll
      // later; the next poll overwrites it with the server's own view.
      queryClient.setQueryData(
        complianceJobKeys.watched(projectId, accepted.id),
        accepted
      );
      if (joined) {
        toast.info('Compliance analysis is already running', {
          description:
            'A run for this project was already in progress, so this one joined it rather than starting a second. Its progress is shown here.',
          duration: OUTCOME_TOAST_DURATION_MS,
        });
      }
    },
    onError: (error) => {
      // Everything decidable without the model is checked before the job is
      // accepted, so a refusal here is a precondition the user has to fix and
      // the backend's own wording is the useful part.
      toast.error(getErrorTitle(error, 'Could not start the compliance analysis'), {
        description: getErrorMessage(error),
      });
    },
  });

  // A run found still going on page load is this session's to report on, even
  // though this session did not start it.
  useEffect(() => {
    if (job && isComplianceJobActive(job.status)) {
      watchedRef.current.add(job.id);
    }
  }, [job]);

  useEffect(() => {
    if (!job || !isComplianceJobTerminal(job.status)) return;
    if (!watchedRef.current.has(job.id)) return;

    const announcement = `${job.id}:${job.status}`;
    if (announcedRef.current === announcement) return;
    announcedRef.current = announcement;

    const outcome = complianceJobOutcome(job);
    if (job.status === 'succeeded') {
      // The only outcome that wrote anything, so the only one whose lists moved.
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      toast.success(outcome.title, {
        description: outcome.description,
        duration: OUTCOME_TOAST_DURATION_MS,
      });
      return;
    }
    if (job.status === 'nothing-to-report') {
      toast.info(outcome.title, {
        description: outcome.description,
        duration: OUTCOME_TOAST_DURATION_MS,
      });
      return;
    }
    toast.error(outcome.title, {
      description: outcome.description,
      duration: FAILURE_TOAST_DURATION_MS,
    });
  }, [job, queryClient]);

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  const start = useCallback(() => {
    setJoinedExistingRun(false);
    startMutation.mutate();
  }, [startMutation]);

  return {
    start,
    isStarting: startMutation.isPending,
    job,
    isActive: job !== null && isComplianceJobActive(job.status),
    percent: job ? complianceJobPercent(job) : 0,
    progressLabel: job ? complianceJobProgressLabel(job) : null,
    outcome: job ? complianceJobOutcome(job) : null,
    joinedExistingRun,
    refetch,
  };
}
