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
import { ProjectStatus } from '@tornotron/echno-core/project/types';
import { TaskStatus } from '@tornotron/echno-core/task/types';
import type { Project } from '@tornotron/echno-core/project/types';

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

const STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.open]: '#4CAF50',
  [ProjectStatus.closed]: '#2A5797',
  [ProjectStatus.upcoming]: '#2196F3',
  [ProjectStatus.completed]: '#9C27B0',
  [ProjectStatus.onHold]: '#FF9800',
  [ProjectStatus.cancelled]: '#9E9E9E',
  [ProjectStatus.dropped]: '#795548',
};

type Period = 'month' | 'year';

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const ACTIVITY_CONFIG: ChartConfig = {
  started: { label: 'Started', color: CHART_PALETTE[0] },
  completed: { label: 'Completed', color: CHART_PALETTE[2] },
};

const HEALTH_CONFIG: ChartConfig = {
  value: { label: 'Score', color: CHART_PALETTE[1] },
};

// ─── Period helpers ───────────────────────────────────────────────────────────

function getAvailableYears(projects: Project[]): number[] {
  const years = new Set<number>();
  const now = new Date().getFullYear();
  for (const p of projects) {
    const d = p.startDate ?? p.createdAt;
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
  projects: Project[],
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
    started: projects.filter((p) => {
      const d = p.startDate ?? p.createdAt;
      if (!d) return false;
      return d >= start && d <= end;
    }).length,
    completed: projects.filter((p) => {
      if (!p.endDate || p.status !== ProjectStatus.completed) return false;
      return p.endDate >= start && p.endDate <= end;
    }).length,
  }));
}

function buildRadialData(projects: Project[]) {
  return [...projects]
    .filter((p) => p.tasks.length > 0 || p.progress > 0)
    .toSorted((a, b) => b.progress - a.progress)
    .slice(0, 6)
    .map((p, i) => ({
      name:
        p.projectName.length > 14
          ? `${p.projectName.slice(0, 14)}…`
          : p.projectName,
      value: p.progress,
      fill: CHART_PALETTE[i % CHART_PALETTE.length],
    }));
}

function buildHealthRadar(projects: Project[]) {
  if (projects.length === 0) return [];
  const now = new Date();

  const avgProgress = Math.round(
    projects.reduce((s, p) => s + p.progress, 0) / projects.length
  );

  const withTasks = projects.filter((p) => p.tasks.length > 0);
  let completionSum = 0;
  for (const p of withTasks) {
    const done = p.tasks.filter(
      (t) => t.status === TaskStatus.completed
    ).length;
    completionSum += (done / p.tasks.length) * 100;
  }
  const taskCompletion =
    withTasks.length > 0 ? Math.round(completionSum / withTasks.length) : 0;

  const activePct = Math.round(
    (projects.filter((p) => p.status === ProjectStatus.open).length /
      projects.length) *
      100
  );

  const withEnd = projects.filter((p) => p.endDate);
  const onTrackPct =
    withEnd.length > 0
      ? Math.round(
          (withEnd.filter((p) => p.endDate! > now).length / withEnd.length) *
            100
        )
      : 0;

  const staffedPct = Math.round(
    (projects.filter((p) => p.members.length > 0).length / projects.length) *
      100
  );

  return [
    { metric: 'Progress', value: avgProgress },
    { metric: 'Tasks Done', value: taskCompletion },
    { metric: 'Active', value: activePct },
    { metric: 'On Track', value: onTrackPct },
    { metric: 'Staffed', value: staffedPct },
  ];
}

function buildTreeMapData(projects: Project[]) {
  return projects
    .map((p) => ({
      name: p.projectName,
      value: Math.max(1, p.tasks.length + p.members.length * 2),
      fill: STATUS_COLORS[p.status],
    }))
    .toSorted((a, b) => b.value - a.value)
    .slice(0, 14);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ProjectChartsProps {
  projects: Project[];
}

export function ProjectCharts({ projects = [] }: ProjectChartsProps) {
  const [period, setPeriod] = useState<Period>('year');
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [month, setMonth] = useState<number>(() => new Date().getMonth());

  const availableYears = useMemo(() => getAvailableYears(projects), [projects]);
  const availableMonths = useMemo(() => getAvailableMonths(year), [year]);

  const activityData = useMemo(
    () => buildActivityTimeline(projects, period, year, month),
    [projects, period, year, month]
  );
  const radialData = useMemo(() => buildRadialData(projects), [projects]);
  const healthData = useMemo(() => buildHealthRadar(projects), [projects]);
  const treeMapData = useMemo(() => buildTreeMapData(projects), [projects]);

  const radialConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        radialData.map((d) => [d.name, { label: d.name, color: d.fill }])
      ),
    [radialData]
  );

  const treeMapConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        treeMapData.map((d) => [d.name, { label: d.name, color: d.fill }])
      ),
    [treeMapData]
  );

  const activityHeaderAction = (
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
      {/* Row 1 — Activity Timeline (2/3) + Project Progress (1/3) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Activity Timeline"
          description={
            period === 'month'
              ? `Projects started and completed — ${MONTHS[month]} ${year}`
              : `Projects started and completed — ${year}`
          }
          config={ACTIVITY_CONFIG}
          headerAction={activityHeaderAction}
          className="lg:col-span-2"
        >
          <AreaChart data={activityData} margin={{ left: -8, right: 8 }}>
            <defs>
              <linearGradient id="fillStarted" x1="0" y1="0" x2="0" y2="1">
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
              <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={CHART_PALETTE[2]}
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_PALETTE[2]}
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
              dataKey="started"
              stroke={CHART_PALETTE[0]}
              strokeWidth={2}
              fill="url(#fillStarted)"
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke={CHART_PALETTE[2]}
              strokeWidth={2}
              fill="url(#fillCompleted)"
              dot={false}
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ChartCard>

        <ChartCard
          title="Project Progress"
          description="Top projects ranked by completion"
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
                formatter: (value: unknown) =>
                  `${typeof value === 'number' ? value : String(value)}%`,
              }}
            />
            <ChartLegend
              content={<ChartLegendContent />}
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <div className="flex min-w-[10rem] items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {String(name)}
                      </span>
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {`${typeof value === 'number' ? value : String(value)}%`}
                      </span>
                    </div>
                  )}
                />
              }
            />
          </RadialBarChart>
        </ChartCard>
      </div>

      {/* Row 2 — Health Radar (1/3) + Project Size Map (2/3) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Portfolio Health"
          description="Key performance indicators across all projects"
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
              fill={`var(--color-value)`}
              fillOpacity={0.6}
            />
          </RadarChart>
        </ChartCard>

        <TreeMap
          title="Project Size Map"
          description="Projects sized by activity (tasks + team) — colour by status"
          config={treeMapConfig}
          data={treeMapData}
          className="lg:col-span-2"
          isEmpty={treeMapData.length === 0}
          chartClassName="px-1"
        />
      </div>
    </div>
  );
}
