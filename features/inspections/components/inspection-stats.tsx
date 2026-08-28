'use client';

import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/index';

export interface InspectionStatItem {
  label: string;
  count: number | string;
  icon: LucideIcon;
  description?: string;
  valueClass?: string;
  iconBg?: string;
  iconClass?: string;
}

/**
 * Summary strip.
 *
 * Deliberately the same divided-card treatment as `IssueStatsCard` so the
 * inspection dashboard sits alongside the rest of the product rather than
 * introducing a second stat style.
 */
/**
 * Column layout per tile count.
 *
 * Five tiles need a later breakpoint than four. At `sm` they would be 128px
 * wide and the labels would clip, so the divider and padding utilities move
 * with the grid rather than being hard-coded to `sm`.
 */
function layoutFor(count: number) {
  if (count >= 5) {
    return {
      grid: 'grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-0',
      divide: 'lg:divide-border lg:divide-x',
      padStart: 'lg:pl-5',
      padEnd: 'lg:pr-5',
    };
  }

  return {
    grid:
      count >= 4
        ? 'grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0'
        : 'grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0',
    divide: 'sm:divide-border sm:divide-x',
    padStart: 'sm:pl-5',
    padEnd: 'sm:pr-5',
  };
}

export function InspectionStats({
  stats,
  isLoading = false,
}: {
  stats: InspectionStatItem[];
  isLoading?: boolean;
}) {
  const layout = layoutFor(stats.length);

  if (isLoading) {
    return (
      <Card className="gap-0 p-6">
        <div className={cn('grid gap-6', layout.grid)}>
          {Array.from({ length: stats.length || 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="gap-0 p-6">
      <div className={cn('grid', layout.grid, layout.divide)}>
        {stats.map(
          (
            {
              label,
              count,
              icon: Icon,
              description,
              valueClass,
              iconBg,
              iconClass,
            },
            index
          ) => (
            <div
              key={label}
              className={cn(
                'flex items-center gap-3',
                index > 0 && layout.padStart,
                index < stats.length - 1 && layout.padEnd
              )}
            >
              <div
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-lg',
                  iconBg ?? 'bg-muted'
                )}
              >
                <Icon
                  className={cn('size-4', iconClass ?? 'text-muted-foreground')}
                />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground truncate text-xs font-medium">
                  {label}
                </p>
                <p
                  className={cn(
                    'text-2xl font-semibold tabular-nums',
                    valueClass ?? 'text-foreground'
                  )}
                >
                  {count}
                </p>
                {description && (
                  <p className="text-muted-foreground truncate text-xs">
                    {description}
                  </p>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </Card>
  );
}
