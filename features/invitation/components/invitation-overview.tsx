'use client';

import { useMemo } from 'react';
import { Card } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import {
  Invitation,
  InvitationStatus,
  getInvitationStatus,
} from '@/types/invitation';
import { cn } from '@/lib/utils/index';

interface InvitationOverviewProps {
  invitations: Invitation[];
}

const STATUS_COLORS: Record<InvitationStatus, string> = {
  [InvitationStatus.pending]: '#f59e0b',
  [InvitationStatus.accepted]: '#10b981',
  [InvitationStatus.rejected]: '#ef4444',
  [InvitationStatus.expired]: '#71717a',
};

const STATUS_DOT: Record<InvitationStatus, string> = {
  [InvitationStatus.pending]: 'bg-amber-500',
  [InvitationStatus.accepted]: 'bg-emerald-500',
  [InvitationStatus.rejected]: 'bg-red-500',
  [InvitationStatus.expired]: 'bg-zinc-400',
};

const STATUS_BADGE_VARIANT: Record<
  InvitationStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  [InvitationStatus.pending]: 'secondary',
  [InvitationStatus.accepted]: 'default',
  [InvitationStatus.rejected]: 'destructive',
  [InvitationStatus.expired]: 'outline',
};

const DEPT_DOT = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-indigo-500',
];

function formatDate(date: Date | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Build SVG donut arc path data
function buildDonutSegments(
  slices: { value: number; color: string }[],
  r = 45,
  cx = 50,
  cy = 50
) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return [];

  const segments: { d: string; color: string }[] = [];
  let startAngle = -Math.PI / 2;

  for (const slice of slices) {
    if (slice.value === 0) continue;
    const angle = (slice.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    segments.push({
      d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      color: slice.color,
    });

    startAngle = endAngle;
  }

  return segments;
}

export function InvitationOverview({ invitations }: InvitationOverviewProps) {
  const total = invitations.length;

  const statusCounts = useMemo(() => {
    const counts: Record<InvitationStatus, number> = {
      [InvitationStatus.pending]: 0,
      [InvitationStatus.accepted]: 0,
      [InvitationStatus.rejected]: 0,
      [InvitationStatus.expired]: 0,
    };
    for (const inv of invitations) counts[getInvitationStatus(inv)]++;
    return counts;
  }, [invitations]);

  const acceptedPct =
    total > 0
      ? Math.round((statusCounts[InvitationStatus.accepted] / total) * 100)
      : 0;

  const donutSegments = useMemo(
    () =>
      buildDonutSegments(
        Object.entries(statusCounts).map(([status, value]) => ({
          value,
          color: STATUS_COLORS[status as InvitationStatus],
        }))
      ),
    [statusCounts]
  );

  const recentInvitations = useMemo(
    () =>
      [...invitations]
        .filter((inv) => inv.employeeDetails.joiningDate ?? inv.expiryDate)
        .toSorted((a, b) => {
          const da = new Date(
            a.employeeDetails.joiningDate ?? a.expiryDate!
          ).getTime();
          const db = new Date(
            b.employeeDetails.joiningDate ?? b.expiryDate!
          ).getTime();
          return db - da;
        })
        .slice(0, 4),
    [invitations]
  );

  return (
    <Card className="gap-0 p-6">
      <div className="sm:divide-border grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-0 sm:divide-x">
        {/* Donut chart + legend */}
        <div className="flex items-center gap-6 sm:pr-8">
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            className="shrink-0"
          >
            {donutSegments.length > 0 ? (
              donutSegments.map((seg, i) => (
                <path
                  key={i}
                  d={seg.d}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="10"
                  strokeLinecap="butt"
                />
              ))
            ) : (
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-muted/25"
              />
            )}
            <text
              x="50"
              y="48"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="13"
              fontWeight="700"
              fill="currentColor"
            >
              {acceptedPct}%
            </text>
            <text
              x="50"
              y="62"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fill="currentColor"
              className="fill-zinc-500"
            >
              accepted
            </text>
          </svg>

          {/* Legend — right of donut */}
          <div className="space-y-1.5">
            {(Object.entries(statusCounts) as [InvitationStatus, number][]).map(
              ([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      STATUS_DOT[status]
                    )}
                  />
                  <span className="flex-1 truncate text-xs text-zinc-600 capitalize dark:text-zinc-400">
                    {status}
                  </span>
                  <span className="text-xs font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                    {count}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Recent Invitations */}
        <div className="sm:px-8">
          <p className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Recent Invitations
          </p>
          {recentInvitations.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No invitations yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentInvitations.map((inv, i) => {
                const status = getInvitationStatus(inv);
                const name =
                  inv.employeeDetails.employeeName ??
                  inv.employeeDetails.email ??
                  inv.inviteCode;
                const date = inv.employeeDetails.joiningDate ?? inv.expiryDate;
                return (
                  <div key={inv.id} className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white',
                        DEPT_DOT[i % DEPT_DOT.length]
                      )}
                    >
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {name}
                      </span>
                      <span className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                        {inv.employeeDetails.designation}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <Badge
                        variant={STATUS_BADGE_VARIANT[status]}
                        className="px-1.5 py-0 text-[9px]"
                      >
                        {status}
                      </Badge>
                      <span className="text-[10px] text-zinc-400">
                        {formatDate(date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
