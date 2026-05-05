'use client';

import * as React from 'react';
import { Treemap } from 'recharts';
import {
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ChartCard, type ChartSize } from '@/components/shadcn/chart';

interface TreeMapProps {
  title: string;
  description?: string;
  config: ChartConfig;
  data: Array<{ name: string; value: number; fill?: string }>;
  dataKey?: string;
  size?: ChartSize;
  className?: string;
  chartClassName?: string;
  isEmpty?: boolean;
  emptyContent?: React.ReactNode;
  content: NonNullable<React.ComponentProps<typeof Treemap>['content']>;
}

/**
 * Reusable themed Treemap chart card variant built on shared ChartCard + UI
 * chart primitives, so it stays consistent with global chart styling/tokens.
 */
export function TreeMap({
  title,
  description,
  config,
  data,
  dataKey = 'value',
  size = 'md',
  className,
  chartClassName,
  isEmpty,
  emptyContent,
  content,
}: TreeMapProps) {
  return (
    <ChartCard
      title={title}
      description={description}
      config={config}
      size={size}
      className={className}
      chartClassName={chartClassName}
      isEmpty={isEmpty}
      emptyContent={emptyContent}
    >
      <Treemap
        data={data}
        dataKey={dataKey}
        aspectRatio={4 / 3}
        stroke="var(--background)"
        content={content}
      >
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
      </Treemap>
    </ChartCard>
  );
}
