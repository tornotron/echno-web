'use client';

import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChartCard,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  CHART_PALETTE,
  type ChartConfig,
} from '@/components/shadcn/chart';
import { TreeMap } from '@/components/shadcn/tree-map';
import { Button } from '@/components/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { cn } from '@/lib/utils/index';
import { TaskStatus } from '@tornotron/echno-core/task/types';
import type { Task } from '@tornotron/echno-core/task/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

type Period = 'month' | 'year';

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const ACTIVITY_CONFIG: ChartConfig = {
  created: { label: 'Created', color: CHART_PALETTE[0] },
  completed: { label: 'Completed', color: CHART_PALETTE[1] },
};

const HEALTH_CONFIG: ChartConfig = {
  value: { label: 'Score', color: CHART_PALETTE[0] },
};

// ─── Period helpers ───────────────────────────────────────────────────────────

function getAvailableYears(tasks: Task[]): number[] {
  const years = new Set<number>();
  const now = new Date().getFullYear();
  for (const t of tasks) {
    const d = t.createdAt ?? t.startDate;
    if (d) years.add(d.getFullYear());
  }
  years.add(now);
  return [...years].toSorted((a, b) => b - a);
}

function getAvailableMonths(year: number): { value: number; label: string }[] {
  const now = new Date();
  const maxMonth = year === now.getFullYear() ? now.getMonth() : 11;
  return Array.from({ length: maxMonth + 1 }, (_, i) => ({
    value: i,
    label: `${MONTHS[i]} ${year}`,
  }));
}

// ─── Data builders ────────────────────────────────────────────────────────────

function buildActivityTimeline(
  tasks: Task[],
  period: Period,
  year: number,
  month: number
) {
  const now = new Date();
  type Bucket = { key: string; start: Date; end: Date };
  let buckets: Bucket[] = [];

  if (period === 'month') {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weekRanges = [
      { start: 1, end: 7 },
      { start: 8, end: 14 },
      { start: 15, end: 21 },
      { start: 22, end: 28 },
    ];
    if (daysInMonth > 28) weekRanges.push({ start: 29, end: daysInMonth });
    buckets = weekRanges.map(({ start, end }, i) => ({
      key: `Wk ${i + 1}`,
      start: new Date(year, month, start, 0, 0, 0, 0),
      end: new Date(year, month, end, 23, 59, 59, 999),
    }));
  } else {
    buckets = MONTHS.map((label, mi) => ({
      key: label,
      start: new Date(year, mi, 1, 0, 0, 0, 0),
      end: new Date(year, mi + 1, 0, 23, 59, 59, 999),
    })).filter(({ end }) => end <= now);
  }

  return buckets.map(({ key, start, end }) => ({
    month: key,
    created: tasks.filter((t) => {
      const d = t.createdAt ?? t.startDate;
      return d ? d >= start && d <= end : false;
    }).length,
    completed: tasks.filter((t) => {
      if (t.status !== TaskStatus.completed) return false;
      const d = t.updatedAt ?? t.endDate;
      return d ? d >= start && d <= end : false;
    }).length,
  }));
}

function buildRadialData(tasks: Task[]) {
  return [...tasks]
    .filter((t) => t.progress > 0)
    .toSorted((a, b) => b.progress - a.progress)
    .slice(0, 6)
    .map((t, i) => ({
      name: t.title.length > 14 ? `${t.title.slice(0, 14)}…` : t.title,
      value: t.progress,
      fill: CHART_PALETTE[i % CHART_PALETTE.length],
    }));
}

function buildHealthRadar(tasks: Task[]) {
  if (tasks.length === 0) return [];
  const now = new Date();
  const n = tasks.length;

  const completedPct = Math.round(
    (tasks.filter((t) => t.status === TaskStatus.completed).length / n) * 100
  );
  const staffedPct = Math.round(
    (tasks.filter((t) => (t.assignees?.length ?? 0) > 0).length / n) * 100
  );
  const withEnd = tasks.filter((t) => t.endDate);
  const onTrackPct =
    withEnd.length > 0
      ? Math.round(
          (withEnd.filter((t) => t.endDate! > now).length / withEnd.length) *
            100
        )
      : 0;
  const noIssuesPct = Math.round(
    (tasks.filter((t) => (t.issues?.length ?? 0) === 0).length / n) * 100
  );
  const avgProgress = Math.round(tasks.reduce((s, t) => s + t.progress, 0) / n);

  return [
    { metric: 'Completed', value: completedPct },
    { metric: 'Staffed', value: staffedPct },
    { metric: 'On Track', value: onTrackPct },
    { metric: 'No Issues', value: noIssuesPct },
    { metric: 'Progress', value: avgProgress },
  ];
}

function buildCategoryMap(tasks: Task[]) {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    const name = t.category?.name ?? 'Uncategorised';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, value], i) => ({
      name,
      value,
      fill: CHART_PALETTE[i % CHART_PALETTE.length],
    }))
    .toSorted((a, b) => b.value - a.value)
    .slice(0, 14);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TaskChartsProps {
  tasks: Task[];
}

export function TaskCharts({ tasks = [] }: TaskChartsProps) {
  const [period, setPeriod] = useState<Period>('year');
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [month, setMonth] = useState<number>(() => new Date().getMonth());

  const availableYears = useMemo(() => getAvailableYears(tasks), [tasks]);
  const availableMonths = useMemo(() => getAvailableMonths(year), [year]);

  const activityData = useMemo(
    () => buildActivityTimeline(tasks, period, year, month),
    [tasks, period, year, month]
  );
  const radialData = useMemo(() => buildRadialData(tasks), [tasks]);
  const healthData = useMemo(() => buildHealthRadar(tasks), [tasks]);
  const categoryData = useMemo(() => buildCategoryMap(tasks), [tasks]);

  const radialConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        radialData.map((d) => [d.name, { label: d.name, color: d.fill }])
      ),
    [radialData]
  );
  const categoryConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        categoryData.map((d) => [d.name, { label: d.name, color: d.fill }])
      ),
    [categoryData]
  );

  const periodSelector = (
    <div className="flex shrink-0 items-center gap-2">
      {period === 'month' ? (
        <Select
          value={String(month)}
          onValueChange={(v) => setMonth(Number(v))}
        >
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((m) => (
              <SelectItem
                key={m.value}
                value={String(m.value)}
                className="text-xs"
              >
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="h-7 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={String(y)} className="text-xs">
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex shrink-0 overflow-hidden rounded-md border">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant="ghost"
            size="xs"
            onClick={() => setPeriod(p.value)}
            className={cn(
              'rounded-none px-2.5 text-xs',
              period === p.value &&
                'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
            )}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Row 1 — Activity Timeline (2/3) + Task Progress (1/3) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Task Activity"
          description={
            period === 'month'
              ? `Tasks created and completed — ${MONTHS[month]} ${year}`
              : `Tasks created and completed — ${year}`
          }
          config={ACTIVITY_CONFIG}
          headerAction={periodSelector}
          className="lg:col-span-2"
        >
          <AreaChart data={activityData} margin={{ left: -8, right: 8 }}>
            <defs>
              <linearGradient id="taskCreated" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={CHART_PALETTE[0]}
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_PALETTE[0]}
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="taskCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={CHART_PALETTE[1]}
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_PALETTE[1]}
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="created"
              stroke={CHART_PALETTE[0]}
              strokeWidth={2}
              fill="url(#taskCreated)"
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke={CHART_PALETTE[1]}
              strokeWidth={2}
              fill="url(#taskCompleted)"
              dot={false}
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ChartCard>

        <ChartCard
          title="Task Progress"
          description="Top tasks ranked by completion %"
          config={radialConfig}
          isEmpty={radialData.length === 0}
        >
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="15%"
            outerRadius="85%"
            data={radialData}
            startAngle={90}
            endAngle={-270}
            barSize={14}
          >
            <RadialBar
              dataKey="value"
              background={{ fill: 'var(--muted)' }}
              cornerRadius={4}
              label={{
                position: 'insideStart',
                fill: '#fff',
                fontSize: 9,
                fontWeight: 600,
              }}
            />
            <ChartLegend
              content={<ChartLegendContent />}
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          </RadialBarChart>
        </ChartCard>
      </div>

      {/* Row 2 — Health Radar (1/3) + Category Map (2/3) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Task Health"
          description="Key metrics across all tasks (0–100 scale)"
          config={HEALTH_CONFIG}
          isEmpty={healthData.length === 0}
        >
          <RadarChart
            data={healthData}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fontSize: 11, fontWeight: 500 }}
            />
            <PolarGrid />
            <Radar
              dataKey="value"
              fill="var(--color-value)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ChartCard>

        <TreeMap
          title="Work Category Map"
          description="Tasks per work category — area proportional to count"
          config={categoryConfig}
          data={categoryData}
          className="lg:col-span-2"
          isEmpty={categoryData.length === 0}
          chartClassName="px-1"
        />
      </div>
    </div>
  );
}
