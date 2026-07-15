'use client';

import { useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import {
  PolarGrid,
  RadialBar,
  RadialBarChart,
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CHART_PALETTE,
  type ChartConfig,
} from '@/components/shadcn/chart';
import { cn } from '@/lib/utils/tailwind-utils';
import type {
  Material,
  MaterialConsumption,
} from '@tornotron/echno-core/materials/types';

interface MaterialsChartsRowProps {
  materials: Material[];
  consumptions: MaterialConsumption[];
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

export function MaterialsChartsRow({
  materials,
  consumptions,
}: MaterialsChartsRowProps) {
  const [trendPeriod, setTrendPeriod] = useState<'monthly' | 'yearly'>(
    'monthly'
  );

  // ── Composition by unit type ───────────────────────────────────────────────
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

  // ── Consumption trend ──────────────────────────────────────────────────────
  const trendData = useMemo(
    () => buildMonthlyTrend(consumptions, trendPeriod === 'monthly' ? 6 : 12),
    [consumptions, trendPeriod]
  );

  const trendPctChange = useMemo(() => {
    const len = trendData.length;
    if (len < 2 || trendData[len - 2].value === 0) return 0;
    return (
      ((trendData[len - 1].value - trendData[len - 2].value) /
        trendData[len - 2].value) *
      100
    );
  }, [trendData]);

  const trendConfig: ChartConfig = {
    value: { label: 'Qty', color: CHART_PALETTE[0] },
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Composition by Unit */}
      <Card>
        <div className="border-b px-4 py-3">
          <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            Composition by Unit
          </p>
        </div>
        <CardContent className="p-4">
          {compositionData.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No data
            </p>
          ) : (
            <div className="flex items-center gap-6">
              <ChartContainer
                config={compositionConfig}
                className="h-[120px] w-[120px] shrink-0"
              >
                <RadialBarChart
                  data={compositionData}
                  innerRadius={20}
                  outerRadius={52}
                >
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel nameKey="name" />}
                  />
                  <PolarGrid gridType="circle" />
                  <RadialBar dataKey="value" />
                </RadialBarChart>
              </ChartContainer>
              <div className="flex-1 space-y-2 overflow-hidden">
                {compositionData.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <div
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: d.fill }}
                      />
                      <span className="truncate text-zinc-700 dark:text-zinc-300">
                        {d.name}
                      </span>
                    </div>
                    <span className="ml-2 shrink-0 font-medium text-zinc-500 dark:text-zinc-400">
                      {d.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consumption Trend */}
      <Card>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            Trend (Consumption)
          </p>
          <div className="flex shrink-0 overflow-hidden rounded-md border">
            {(['monthly', 'yearly'] as const).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="xs"
                onClick={() => setTrendPeriod(p)}
                className={cn(
                  'rounded-none px-2.5 text-xs',
                  trendPeriod === p &&
                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                )}
              >
                {p === 'monthly' ? 'Monthly' : 'Yearly'}
              </Button>
            ))}
          </div>
        </div>
        <ChartContainer
          config={trendConfig}
          className="h-[120px] w-full px-1 pt-2"
        >
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
              tick={{ fontSize: 10 }}
              tickMargin={4}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={CHART_PALETTE[0]}
              strokeWidth={2}
              dot={{ r: 3, fill: CHART_PALETTE[0], strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
        <div className="flex items-center gap-1.5 px-4 pt-1 pb-3">
          {trendPctChange >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          )}
          <span
            className={`text-xs font-medium ${
              trendPctChange >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {trendPctChange >= 0 ? '+' : ''}
            {trendPctChange.toFixed(1)}% vs last month
          </span>
        </div>
      </Card>
    </div>
  );
}
