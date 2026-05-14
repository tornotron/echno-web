'use client';

import * as React from 'react';
import { Treemap } from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ChartCard, type ChartSize } from '@/components/shadcn/chart';
import { cn } from '@/lib/utils/index';

interface TreeMapTileProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  fill?: string;
}

export function TreeMapTile({
  x,
  y,
  width,
  height,
  name,
  value,
  fill,
}: TreeMapTileProps) {
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number'
  ) {
    return <g />;
  }

  const safeName = typeof name === 'string' ? name : '';
  const safeValue = typeof value === 'number' ? value : 0;
  const safeFill = typeof fill === 'string' ? fill : 'var(--muted)';
  const canShowLabel = width > 64 && height > 36;
  const canShowValue = width > 80 && height > 52;

  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={Math.max(0, width - 2)}
        height={Math.max(0, height - 2)}
        fill={safeFill}
        fillOpacity={0.92}
        stroke="var(--background)"
        strokeWidth={1.25}
        rx={8}
      />
      {canShowLabel && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - (canShowValue ? 8 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.98)"
            fontSize={Math.min(11, Math.floor(width / 7))}
            fontWeight={600}
          >
            {safeName.length > 18 ? `${safeName.slice(0, 16)}…` : safeName}
          </text>
          {canShowValue && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.8)"
              fontSize={10}
              fontWeight={500}
            >
              {safeValue.toLocaleString()}
            </text>
          )}
        </>
      )}
    </g>
  );
}

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
  content?: NonNullable<React.ComponentProps<typeof Treemap>['content']>;
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
  content = (props: unknown) => (
    <TreeMapTile {...(props as TreeMapTileProps)} />
  ),
}: TreeMapProps) {
  const itemCount = data.length;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartCard
      title={title}
      description={description}
      config={config}
      size={size}
      className={className}
      chartClassName={cn(
        '[&_.recharts-rectangle]:transition-opacity',
        chartClassName
      )}
      isEmpty={isEmpty}
      emptyContent={emptyContent}
      headerAction={
        itemCount > 0 ? (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {itemCount} items
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Total {total.toLocaleString()}
            </Badge>
          </div>
        ) : null
      }
    >
      <Treemap
        data={data}
        dataKey={dataKey}
        aspectRatio={4 / 3}
        stroke="var(--background)"
        animationDuration={450}
        animationEasing="ease-out"
        content={content}
      >
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name) => (
                <div className="flex min-w-[12rem] items-center justify-between gap-3">
                  <span className="text-muted-foreground truncate">
                    {String(name)}
                  </span>
                  <span className="text-foreground font-mono font-medium tabular-nums">
                    {typeof value === 'number'
                      ? value.toLocaleString()
                      : String(value)}
                  </span>
                </div>
              )}
            />
          }
        />
      </Treemap>
    </ChartCard>
  );
}
