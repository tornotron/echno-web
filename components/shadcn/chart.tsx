'use client';

// ─── Re-export base primitives ────────────────────────────────────────────────
export * from '@/components/ui/chart';

// ─── Variant additions ────────────────────────────────────────────────────────
import * as React from 'react';
import { cn } from '@/lib/utils/index';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/shadcn/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import type * as RechartsPrimitive from 'recharts';

// ─── Shared palette ───────────────────────────────────────────────────────────

/**
 * 10-colour categorical palette shared across all chart modules.
 * Index-stable — add new colours at the end only.
 */
export const CHART_PALETTE = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#8b5cf6', // violet
  '#14b8a6', // teal
] as const;

export type ChartPaletteColor = (typeof CHART_PALETTE)[number];

// ─── Size + variant maps ──────────────────────────────────────────────────────

/**
 * Size variants — maps to a fixed container height.
 * `xs`  = sparklines / mini embeds  (100 px)
 * `sm`  = compact cards             (160 px)
 * `md`  = standard card (default)   (220 px)
 * `lg`  = large card                (280 px)
 * `xl`  = full-section chart        (360 px)
 * `2xl` = hero / full-height        (480 px)
 */
const CHART_SIZES = {
  xs: 'h-[100px]',
  sm: 'h-[160px]',
  md: 'h-[220px]',
  lg: 'h-[280px]',
  xl: 'h-[360px]',
  '2xl': 'h-[480px]',
} as const;

export type ChartSize = keyof typeof CHART_SIZES;

/**
 * Visual variant for ChartCard.
 *
 * `default` – bordered panel card (Card variant="panel").
 * `ghost`   – no card border/background; floats inside a parent container.
 * `outline` – thin border ring, no panel elevation.
 */
export type ChartVariant = 'default' | 'ghost' | 'outline';

// ─── ChartCard ────────────────────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  description?: string;
  /** Container height — defaults to 'md' (220 px) */
  size?: ChartSize;
  /** Visual style — defaults to 'default' (bordered panel card) */
  variant?: ChartVariant;
  /** Slot for a toggle, select, or action button in the card header */
  headerAction?: React.ReactNode;
  config: ChartConfig;
  /** Must be a single recharts chart element (BarChart, LineChart, etc.) */
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children'];
  /** Applied to the outer wrapper — use for col-span, extra spacing, etc. */
  className?: string;
  /** Applied to the inner ChartContainer div */
  chartClassName?: string;
  /** When true, renders emptyContent instead of the chart */
  isEmpty?: boolean;
  /** Shown when isEmpty=true — defaults to a "No data" message */
  emptyContent?: React.ReactNode;
}

/**
 * Opinionated wrapper: header (title + description + optional action) +
 * ChartContainer in one component.
 *
 * Three visual variants:
 *  - `default`  → Card variant="panel" (border + subtle background)
 *  - `ghost`    → no Card wrapper; floats inside parent
 *  - `outline`  → thin ring border, no background
 */
function ChartCard({
  title,
  description,
  size = 'md',
  variant = 'default',
  headerAction,
  config,
  children,
  className,
  chartClassName,
  isEmpty,
  emptyContent,
}: ChartCardProps) {
  const header = (
    <div className="flex flex-row items-start justify-between gap-4 px-5 pt-5 pb-4">
      <div className="space-y-1">
        <p className="text-sm leading-none font-semibold tracking-tight">
          {title}
        </p>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      {headerAction}
    </div>
  );

  const body = isEmpty ? (
    <div
      className={cn(
        'flex items-center justify-center px-2 pb-4',
        CHART_SIZES[size],
        chartClassName
      )}
    >
      {emptyContent ?? <p className="text-muted-foreground text-xs">No data</p>}
    </div>
  ) : (
    <div className="px-2 pb-4">
      <ChartContainer
        config={config}
        className={cn('w-full', CHART_SIZES[size], chartClassName)}
      >
        {children}
      </ChartContainer>
    </div>
  );

  if (variant === 'ghost') {
    return (
      <div className={cn('flex flex-col', className)}>
        {header}
        {body}
      </div>
    );
  }

  if (variant === 'outline') {
    return (
      <div
        className={cn(
          'flex flex-col rounded-xl border bg-transparent',
          className
        )}
      >
        {header}
        {body}
      </div>
    );
  }

  // default — panel card
  return (
    <Card variant="panel" className={cn('flex flex-col', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        {headerAction}
      </CardHeader>
      <CardContent className="px-2 pb-4">
        {isEmpty ? (
          <div
            className={cn(
              'flex items-center justify-center',
              CHART_SIZES[size],
              chartClassName
            )}
          >
            {emptyContent ?? (
              <p className="text-muted-foreground text-xs">No data</p>
            )}
          </div>
        ) : (
          <ChartContainer
            config={config}
            className={cn('w-full', CHART_SIZES[size], chartClassName)}
          >
            {children}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export { ChartCard };
