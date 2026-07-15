'use client';

import { useMemo } from 'react';
import { Layers, WarehouseIcon, Ruler } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/shadcn/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CHART_PALETTE,
  type ChartConfig,
} from '@/components/shadcn/chart';
import type {
  Material,
  MaterialConsumption,
} from '@tornotron/echno-core/materials/types';

interface MaterialsKpiStripProps {
  materials: Material[];
  consumptions: MaterialConsumption[];
}

function formatStockValue(v: number): string {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function buildMonthlyTrend(consumptions: MaterialConsumption[], count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const value = consumptions
      .filter((c) => {
        const cd = new Date(c.consumptionDate);
        return cd.getFullYear() === year && cd.getMonth() === month;
      })
      .reduce((sum, c) => sum + c.quantity, 0);
    return { month: d.toLocaleDateString('en-US', { month: 'short' }), value };
  });
}

export function MaterialsKpiStrip({
  materials,
  consumptions,
}: MaterialsKpiStripProps) {
  const totalMaterials = materials.length;
  const totalStockValue = materials.reduce(
    (s, m) => s + (m.stockValue ?? 0),
    0
  );
  const uniqueUnits = new Set(materials.map((m) => m.unit).filter(Boolean))
    .size;

  const compositionData = useMemo(() => {
    const groups = new Map<string, number>();
    for (const m of materials) {
      groups.set(m.unit, (groups.get(m.unit) ?? 0) + 1);
    }
    const total = materials.length;
    return [...groups.entries()]
      .map(([name, count], i) => ({
        name,
        value: count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        fill: CHART_PALETTE[i % CHART_PALETTE.length],
      }))
      .toSorted((a, b) => b.value - a.value);
  }, [materials]);

  const compositionConfig: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        compositionData.map((d) => [d.name, { label: d.name, color: d.fill }])
      ),
    [compositionData]
  );

  const trendData = useMemo(
    () => buildMonthlyTrend(consumptions, 6),
    [consumptions]
  );

  const trendConfig: ChartConfig = {
    value: { label: 'Qty', color: CHART_PALETTE[0] },
  };

  return (
    <Card className="gap-0 p-6">
      <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-0 sm:divide-x">
        {/* Total Materials */}
        <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Total Materials
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {totalMaterials}
            </p>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Layers className="size-4 text-zinc-600 dark:text-zinc-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            across all categories
          </p>
        </div>

        {/* Total Stock Value */}
        <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Total Stock Value
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {totalStockValue > 0 ? formatStockValue(totalStockValue) : '—'}
            </p>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <WarehouseIcon className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            current inventory value
          </p>
        </div>

        {/* Unique Units */}
        <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Unique Units
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
              {uniqueUnits}
            </p>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
              <Ruler className="size-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            material unit types
          </p>
        </div>

        {/* Composition by Unit */}
        <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
          <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            Composition by Unit
          </p>
          {compositionData.length === 0 ? (
            <p className="py-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
              No data
            </p>
          ) : (
            <div className="flex min-h-0 flex-1 items-center gap-3">
              <ChartContainer
                config={compositionConfig}
                className="h-[60px] w-[60px] shrink-0"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel nameKey="name" />}
                  />
                  <Pie
                    data={compositionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={14}
                    outerRadius={26}
                    strokeWidth={0}
                  >
                    {compositionData.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex-1 space-y-1 overflow-hidden">
                {compositionData.slice(0, 3).map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <div
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: d.fill }}
                      />
                      <span className="truncate text-zinc-600 dark:text-zinc-400">
                        {d.name}
                      </span>
                    </div>
                    <span className="ml-1 shrink-0 font-medium text-zinc-500 dark:text-zinc-400">
                      {d.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trend (Consumption) */}
        <div className="col-span-2 flex flex-col gap-1 rounded-lg p-3 sm:col-span-1 sm:rounded-none sm:pl-6">
          <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            Trend (Consumption)
          </p>
          <ChartContainer config={trendConfig} className="h-[60px] w-full">
            <LineChart data={trendData} margin={{ left: 0, right: 4 }}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 8 }}
                tickMargin={2}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={CHART_PALETTE[0]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </div>
    </Card>
  );
}
