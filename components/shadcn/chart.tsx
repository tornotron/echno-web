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

// ─── ChartCard ────────────────────────────────────────────────────────────────

/**
 * Size variants for ChartCard — maps to a fixed container height.
 * Both width and height become explicit so `aspect-video` from ChartContainer
 * is overridden and the chart renders at exactly the specified height.
 */
const CHART_SIZES = {
  sm: 'h-[160px]',
  md: 'h-[220px]',
  lg: 'h-[280px]',
  xl: 'h-[360px]',
} as const;

export type ChartSize = keyof typeof CHART_SIZES;

interface ChartCardProps {
  title: string;
  description?: string;
  /** Container height — defaults to 'md' (220 px) */
  size?: ChartSize;
  /** Slot for a toggle, select, or action button in the card header */
  headerAction?: React.ReactNode;
  config: ChartConfig;
  /** Must be a single recharts chart element (BarChart, LineChart, etc.) */
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children'];
  /** Applied to the outer Card — use for col-span, extra spacing, etc. */
  className?: string;
  /** Applied to the inner ChartContainer div */
  chartClassName?: string;
  /** When true, renders emptyContent instead of the chart */
  isEmpty?: boolean;
  /** Shown when isEmpty=true — defaults to a "No data" message */
  emptyContent?: React.ReactNode;
}

/**
 * Opinionated wrapper: `Card(variant="panel")` + `CardHeader` + `CardContent` +
 * `ChartContainer` (with CSS-variable injection) in one component.
 *
 * Replaces the repeated boilerplate in every chart file:
 *   Card → CardHeader → CardContent → ResponsiveContainer → <chart>
 */
function ChartCard({
  title,
  description,
  size = 'md',
  headerAction,
  config,
  children,
  className,
  chartClassName,
  isEmpty,
  emptyContent,
}: ChartCardProps) {
  return (
    <Card variant="panel" className={className}>
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
