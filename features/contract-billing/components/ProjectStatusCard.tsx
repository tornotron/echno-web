'use client';

import type { ProjectBillingSummary } from '@tornotron/echno-core/contract-billing/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { cn } from '@/lib/utils/index';
import {
  PROJECT_STATE_LABELS,
  PROJECT_STATE_STROKES,
  projectStateCounts,
  ringSegments,
} from '../lib/projects';

const SIZE = 132;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Surface showing between the arcs, as a length along the ring. */
const GAP = 2;

/**
 * The projects by billing state, as a ring with the total in the middle. The
 * legend under it names every state with its count, so nothing rests on colour
 * alone and it doubles as the table view.
 */
export function ProjectStatusCard({
  projects,
}: {
  projects: Pick<ProjectBillingSummary, 'billingState'>[];
}) {
  const counts = projectStateCounts(projects);
  const segments = ringSegments(counts);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative">
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={counts
              .map((c) => `${PROJECT_STATE_LABELS[c.state]}: ${c.count}`)
              .join(', ')}
          >
            <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
              {segments.length === 0 && (
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={STROKE}
                  className="stroke-muted"
                />
              )}
              {segments.map((segment) => {
                const arc = segment.share * CIRCUMFERENCE;
                const visible = segments.length > 1 ? arc - GAP : arc;
                return (
                  <circle
                    key={segment.state}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    strokeWidth={STROKE}
                    strokeDasharray={`${Math.max(visible, 0)} ${CIRCUMFERENCE}`}
                    strokeDashoffset={-segment.offset * CIRCUMFERENCE}
                    className={PROJECT_STATE_STROKES[segment.state]}
                  >
                    <title>
                      {PROJECT_STATE_LABELS[segment.state]}: {segment.count}
                    </title>
                  </circle>
                );
              })}
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold">{projects.length}</span>
            <span className="text-muted-foreground text-xs">Projects</span>
          </div>
        </div>
        <ul className="w-full space-y-1.5 text-sm">
          {counts.map(({ state, count }) => (
            <li key={state} className="flex items-center gap-2">
              <svg width="10" height="10" aria-hidden="true">
                <circle
                  cx="5"
                  cy="5"
                  r="3"
                  fill="none"
                  strokeWidth="4"
                  className={cn(PROJECT_STATE_STROKES[state])}
                />
              </svg>
              <span>{PROJECT_STATE_LABELS[state]}</span>
              <span className="ml-auto font-medium">{count}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
