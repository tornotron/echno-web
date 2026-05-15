'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  FileText,
  Settings,
  Users,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Card } from '@/components/shadcn/card';
import {
  LeaveRequest,
  LeavePolicy,
  LeaveStatus,
  getLeaveStatusLabel,
} from '@/types/leave';
import { format, isFuture, isToday, differenceInCalendarDays } from 'date-fns';
import { routes } from '@/nav';

interface LeaveOverviewProps {
  requests: LeaveRequest[];
  policies: LeavePolicy[];
}

const STATUS_SEGMENTS = [
  { status: LeaveStatus.APPROVED, color: '#10b981' },
  { status: LeaveStatus.PENDING_APPROVAL, color: '#f59e0b' },
  { status: LeaveStatus.REJECTED, color: '#ef4444' },
  { status: LeaveStatus.CANCELLED, color: '#f97316' },
  { status: LeaveStatus.WITHDRAWN, color: '#71717a' },
];

const QUICK_ACTIONS = [
  {
    icon: Users,
    label: 'Approvals',
    description: 'Review pending requests',
    href: `${routes.workforce.leaves.manage.requests.href}?tab=approvals`,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
  },
  {
    icon: FileText,
    label: 'All Requests',
    description: 'Browse all submissions',
    href: `${routes.workforce.leaves.manage.requests.href}?tab=all`,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    icon: Settings,
    label: 'Leave Policies',
    description: 'Manage policy rules',
    href: routes.workforce.leaves.manage.policies,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
  },
];

function formatDateRange(start: Date, end: Date) {
  if (start.toDateString() === end.toDateString()) {
    return format(start, 'dd MMM yyyy');
  }
  return `${format(start, 'dd MMM')} – ${format(end, 'dd MMM yyyy')}`;
}

function DaysChip({ startDate }: { startDate: Date }) {
  const diff = differenceInCalendarDays(startDate, new Date());
  if (diff === 0)
    return (
      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
        Today
      </span>
    );
  if (diff === 1)
    return (
      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
        Tomorrow
      </span>
    );
  return (
    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 tabular-nums dark:bg-zinc-800 dark:text-zinc-400">
      in {diff}d
    </span>
  );
}

export function LeaveOverview({ requests, policies }: LeaveOverviewProps) {
  const submitted = useMemo(
    () => requests.filter((r) => r.status !== LeaveStatus.DRAFT),
    [requests]
  );

  const total = submitted.length;

  const segmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const seg of STATUS_SEGMENTS) {
      counts[seg.status] = submitted.filter(
        (r) => r.status === seg.status
      ).length;
    }
    return counts;
  }, [submitted]);

  const approvedCount = segmentCounts[LeaveStatus.APPROVED] ?? 0;
  const pendingCount = segmentCounts[LeaveStatus.PENDING_APPROVAL] ?? 0;
  const pct = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  const upcoming = useMemo(
    () =>
      requests
        .filter(
          (r) =>
            r.status === LeaveStatus.APPROVED &&
            (isFuture(r.startDate) || isToday(r.startDate))
        )
        .toSorted(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )
        .slice(0, 3),
    [requests]
  );

  const activePolicies = policies.filter((p) => p.isActive).length;

  return (
    <Card className="gap-0 p-6">
      <div className="divide-border grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {/* Column 1 — Status breakdown bar */}
        <div className="flex flex-col justify-center gap-4 py-6 sm:py-0 sm:pr-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {pct}%
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {approvedCount} of {total} Approved
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {pendingCount}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pending
              </p>
            </div>
          </div>

          {/* Segmented status bar */}
          <div className="space-y-1.5">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              {STATUS_SEGMENTS.map((seg) => {
                const count = segmentCounts[seg.status] ?? 0;
                const widthPct = total > 0 ? (count / total) * 100 : 0;
                if (widthPct === 0) return null;
                return (
                  <div
                    key={seg.status}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: seg.color,
                    }}
                    title={`${getLeaveStatusLabel(seg.status)}: ${count}`}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {STATUS_SEGMENTS.filter(
                (seg) => (segmentCounts[seg.status] ?? 0) > 0
              ).map((seg) => (
                <div key={seg.status} className="flex items-center gap-1.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="flex-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {getLeaveStatusLabel(seg.status)}
                  </span>
                  <span className="text-xs font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                    {segmentCounts[seg.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-border/50 flex items-center gap-2 border-t pt-3">
            <Calendar className="size-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {activePolicies}
              </span>{' '}
              Active {activePolicies === 1 ? 'Policy' : 'Policies'}
            </span>
          </div>
        </div>

        {/* Column 2 — Upcoming leaves */}
        <div className="py-6 sm:px-8 sm:py-0">
          <p className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Upcoming Leaves
          </p>
          {upcoming.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No upcoming approved leaves
            </p>
          ) : (
            <div className="divide-border/50 divide-y">
              {upcoming.map((req) => (
                <div
                  key={req.id}
                  className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                    <CalendarDays className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {req.employeeName ?? `Employee #${req.employeeId}`}
                      </p>
                      <DaysChip startDate={req.startDate} />
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {req.leaveTypeName} · {req.totalDays}d
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {formatDateRange(req.startDate, req.endDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 3 — Quick Actions (tile cards) */}
        <div className="py-6 sm:py-0 sm:pl-8">
          <p className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Quick Actions
          </p>
          <div className="space-y-1">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group hover:bg-muted/60 flex items-center gap-2.5 rounded-md px-3 py-2.5 transition-colors"
              >
                <action.icon className="size-4 shrink-0 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {action.label}
                </span>
                <ChevronRight className="size-3.5 text-zinc-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
