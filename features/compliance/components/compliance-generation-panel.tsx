'use client';

import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Progress } from '@/components/shadcn/progress';
import type { ComplianceJobOutcome } from '@/lib/compliance/compliance-job-status';

/**
 * What the last (or current) compliance run did.
 *
 * The three finished states are given a different colour, a different icon and
 * a different heading each. That is the requirement rather than decoration: a
 * run that assessed every rule and found nothing to create, and a run that
 * produced nothing because it broke, used to arrive on this screen looking
 * identical, and the second one is a failure somebody has to act on.
 *
 * It also stays on the page after the toast has gone, because a user who looked
 * away for a minute is exactly the one who needs to be told which of the two
 * happened.
 */
const toneStyles = {
  progress: {
    frame:
      'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50',
    heading: 'text-zinc-900 dark:text-zinc-100',
    body: 'text-zinc-600 dark:text-zinc-400',
  },
  success: {
    frame:
      'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30',
    heading: 'text-emerald-900 dark:text-emerald-200',
    body: 'text-emerald-800 dark:text-emerald-300/90',
  },
  neutral: {
    frame:
      'border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/30',
    heading: 'text-sky-900 dark:text-sky-200',
    body: 'text-sky-800 dark:text-sky-300/90',
  },
  failure: {
    frame:
      'border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30',
    heading: 'text-red-900 dark:text-red-200',
    body: 'text-red-800 dark:text-red-300/90',
  },
} as const;

function ToneIcon({ tone }: { tone: ComplianceJobOutcome['tone'] }) {
  const className = 'mt-0.5 h-4 w-4 shrink-0';
  switch (tone) {
    case 'progress': {
      return <Loader2 className={`${className} animate-spin`} />;
    }
    case 'success': {
      return <CheckCircle2 className={className} />;
    }
    case 'neutral': {
      return <Info className={className} />;
    }
    case 'failure': {
      return <AlertTriangle className={className} />;
    }
  }
}

interface ComplianceGenerationPanelProps {
  outcome: ComplianceJobOutcome;
  /** True while the run is queued or running, which is when the bar is shown. */
  isActive: boolean;
  percent: number;
  progressLabel: string | null;
}

export function ComplianceGenerationPanel({
  outcome,
  isActive,
  percent,
  progressLabel,
}: ComplianceGenerationPanelProps) {
  const styles = toneStyles[outcome.tone];

  return (
    <div className={`rounded-lg border p-4 ${styles.frame}`}>
      <div className="flex items-start gap-3">
        <span className={styles.heading}>
          <ToneIcon tone={outcome.tone} />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className={`text-sm font-medium ${styles.heading}`}>
            {outcome.title}
          </p>
          <p className={`text-sm ${styles.body}`}>{outcome.description}</p>
          {isActive && (
            <div className="space-y-1.5 pt-1">
              {/* The numbers the backend writes after every batch. Minutes of
                  work used to show a bare spinner, so a slow run and a stuck
                  one looked the same. */}
              <Progress value={percent} aria-label="Compliance analysis progress" />
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {progressLabel} · {percent}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
