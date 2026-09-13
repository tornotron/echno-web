'use client';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useBimImportJob } from '@tornotron/echno-core/bim/hooks';
import type { BimImportJob } from '@tornotron/echno-core/bim/types';
import { Progress } from '@/components/shadcn/progress';

const STAGES: Record<BimImportJob['status'], { label: string; percent: number }> = {
  QUEUED: { label: 'Queued for the import worker', percent: 10 },
  RUNNING: { label: 'Parsing the IFC and writing tiles', percent: 55 },
  DONE: { label: 'Imported', percent: 100 },
  FAILED: { label: 'Import failed', percent: 100 },
  UNKNOWN: { label: 'Status not recognised', percent: 0 },
};

export function describeImportJob(job: BimImportJob | undefined) {
  if (!job) return { label: 'Starting', percent: 0 };
  const stage = STAGES[job.status];
  if (job.status === 'RUNNING' && job.ingestedAt) {
    return { label: 'Ingesting elements', percent: 85 };
  }
  return stage;
}

interface ImportJobStatusProps {
  jobId: string | undefined;
  /** Poll interval override, for tests. */
  intervalMs?: number;
}

/** Narrates one import job while the hook polls it, and stops at DONE or FAILED. */
export function ImportJobStatus({ jobId, intervalMs }: ImportJobStatusProps) {
  const { data: job } = useBimImportJob(jobId, intervalMs);
  const { label, percent } = describeImportJob(job);
  const failed = job?.status === 'FAILED';
  const done = job?.status === 'DONE';

  return (
    <div className="space-y-2" data-testid="import-job-status" data-status={job?.status ?? 'loading'}>
      <div className="flex items-center gap-2 text-sm">
        {done ? (
          <CheckCircle2 className="size-4 text-emerald-600" />
        ) : failed ? (
          <XCircle className="size-4 text-red-600" />
        ) : (
          <Loader2 className="size-4 animate-spin text-zinc-500" />
        )}
        <span className={failed ? 'text-red-700 dark:text-red-400' : ''}>{label}</span>
        {job?.attempt && job.maxAttempts > 1 ? (
          <span className="text-xs text-zinc-500">
            attempt {job.attempt} of {job.maxAttempts}
          </span>
        ) : null}
      </div>
      <Progress value={percent} className={failed ? '[&>div]:bg-red-500' : undefined} />
      {done && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {job.elementCount ?? 0} elements across {job.storeyCount ?? 0} storeys.
        </p>
      )}
      {failed && job.error && (
        <p className="text-xs text-red-700 dark:text-red-400">{job.error}</p>
      )}
    </div>
  );
}
