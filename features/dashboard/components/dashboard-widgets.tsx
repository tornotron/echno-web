'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import type { BreakdownItem } from '../lib/dashboard-metrics';

/** A titled dashboard card. */
export function WidgetCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-xs sm:text-sm">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** The empty state a widget shows when the organization has nothing to chart yet. */
export function WidgetEmpty({
  title = 'No data yet',
  description,
  icon: Icon = Inbox,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <Empty className="p-4 md:p-6" data-testid="widget-empty">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-6" />
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
    </Empty>
  );
}

/** Shown while a widget's data loads, so it never flashes an empty state first. */
export function WidgetLoading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
        />
      ))}
    </div>
  );
}

/** Shown when a widget's request failed. */
export function WidgetError({ what }: { what: string }) {
  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">
      Could not load {what}. Try refreshing the page.
    </p>
  );
}

const BAR_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-orange-500',
];

/**
 * A labelled horizontal bar per item, scaled to the largest. Each row shows
 * its value (formatted by the caller) and share of the total.
 */
export function BreakdownBars({
  items,
  format = String,
  limit = 8,
}: {
  items: BreakdownItem[];
  format?: (value: number) => string;
  limit?: number;
}) {
  const shown = items.slice(0, limit);
  const total = items.reduce((sum, i) => sum + i.value, 0);
  const max = Math.max(...shown.map((i) => i.value), 0);
  return (
    <ul className="space-y-3">
      {shown.map((item, index) => {
        const width = max > 0 ? Math.max((item.value / max) * 100, 2) : 0;
        const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <li key={item.key} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-zinc-700 dark:text-zinc-300">
                {item.label}
              </span>
              <span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-100">
                {format(item.value)}
                <span className="ml-1 text-xs font-normal text-zinc-500">
                  ({share}%)
                </span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={`h-2 rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** One figure in a metrics grid. */
export function MetricTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <Icon className="mb-2 h-5 w-5 text-zinc-500" />
      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
      <div className="text-xs text-zinc-600 dark:text-zinc-400">{label}</div>
      {hint ? (
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
