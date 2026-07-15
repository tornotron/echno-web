'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
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
import {
  IssueStatus,
  getIssueStatusLabel,
} from '@tornotron/echno-core/issue/types';
import {
  IssueType,
  getIssueTypeColor,
  getIssueTypeLabel,
} from '@tornotron/echno-core/issue/types';
import type { Issue } from '@tornotron/echno-core/issue/types';

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

const RESOLVED_STATUSES = new Set([IssueStatus.resolved, IssueStatus.closed]);
const ACTIVE_STATUSES = new Set([
  IssueStatus.open,
  IssueStatus.inProgress,
  IssueStatus.pending,
  IssueStatus.reOpened,
]);

const TREND_CONFIG: ChartConfig = {
  opened: { label: 'Opened', color: CHART_PALETTE[3] },
  resolved: { label: 'Resolved', color: CHART_PALETTE[1] },
};

const HEALTH_CONFIG: ChartConfig = {
  value: { label: 'Score', color: CHART_PALETTE[1] },
};

// ─── Period helpers ───────────────────────────────────────────────────────────

function getAvailableYears(issues: Issue[]): number[] {
  const years = new Set<number>();
  const now = new Date().getFullYear();
  for (const i of issues) years.add(i.createdAt.getFullYear());
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

function buildTrend(
  issues: Issue[],
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
    period: key,
    opened: issues.filter((i) => i.createdAt >= start && i.createdAt <= end)
      .length,
    resolved: issues.filter((i) => {
      if (!RESOLVED_STATUSES.has(i.status)) return false;
      const d = i.updatedAt ?? i.createdAt;
      return d >= start && d <= end;
    }).length,
  }));
}

function buildStatusRadial(issues: Issue[]) {
  return Object.values(IssueStatus)
    .map((s, i) => ({
      name: getIssueStatusLabel(s),
      value: issues.filter((issue) => issue.status === s).length,
      fill: CHART_PALETTE[i % CHART_PALETTE.length],
    }))
    .filter((d) => d.value > 0)
    .toSorted((a, b) => b.value - a.value)
    .slice(0, 6);
}

function buildHealthRadar(issues: Issue[]) {
  if (issues.length === 0) return [];
  const n = issues.length;

  const resolvedPct = Math.round(
    (issues.filter((i) => RESOLVED_STATUSES.has(i.status)).length / n) * 100
  );
  const assignedPct = Math.round(
    (issues.filter((i) => !!i.assigneeId || !!i.assignee).length / n) * 100
  );
  const reviewedPct = Math.round(
    (issues.filter((i) => i.status === IssueStatus.inReview).length / n) * 100
  );
  const activePct = Math.round(
    (issues.filter((i) => ACTIVE_STATUSES.has(i.status)).length / n) * 100
  );
  const withCommentsPct = Math.round(
    (issues.filter((i) => (i.comments?.length ?? 0) > 0).length / n) * 100
  );

  return [
    { metric: 'Resolved', value: resolvedPct },
    { metric: 'Assigned', value: assignedPct },
    { metric: 'In Review', value: reviewedPct },
    { metric: 'Active', value: activePct },
    { metric: 'Discussed', value: withCommentsPct },
  ];
}

function buildTypeMap(issues: Issue[]) {
  return Object.values(IssueType)
    .map((t) => ({
      name: getIssueTypeLabel(t),
      value: issues.filter((i) => i.type === t).length,
      fill: getIssueTypeColor(t),
    }))
    .filter((d) => d.value > 0)
    .toSorted((a, b) => b.value - a.value);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface IssueChartsProps {
  issues: Issue[];
}

export function IssueCharts({ issues = [] }: IssueChartsProps) {
  const [period, setPeriod] = useState<Period>('year');
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [month, setMonth] = useState<number>(() => new Date().getMonth());

  const availableYears = useMemo(() => getAvailableYears(issues), [issues]);
  const availableMonths = useMemo(() => getAvailableMonths(year), [year]);

  const trendData = useMemo(
    () => buildTrend(issues, period, year, month),
    [issues, period, year, month]
  );
  const radialData = useMemo(() => buildStatusRadial(issues), [issues]);
  const healthData = useMemo(() => buildHealthRadar(issues), [issues]);
  const typeMapData = useMemo(() => buildTypeMap(issues), [issues]);

  const radialConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        radialData.map((d) => [d.name, { label: d.name, color: d.fill }])
      ),
    [radialData]
  );
  const typeMapConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        typeMapData.map((d) => [d.name, { label: d.name, color: d.fill }])
      ),
    [typeMapData]
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
      {/* Row 1 — Trend Line (2/3) + Resolution Radar (1/3) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Issue Trend"
          description={
            period === 'month'
              ? `Issues opened and resolved — ${MONTHS[month]} ${year}`
              : `Issues opened and resolved — ${year}`
          }
          config={TREND_CONFIG}
          headerAction={periodSelector}
          className="lg:col-span-2"
        >
          <LineChart data={trendData} margin={{ left: -8, right: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="period"
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
            <Line
              type="step"
              dataKey="opened"
              stroke={CHART_PALETTE[3]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Line
              type="step"
              dataKey="resolved"
              stroke={CHART_PALETTE[1]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ChartCard>

        <ChartCard
          title="Resolution Health"
          description="Pipeline quality metrics across all issues"
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
      </div>

      {/* Row 2 — Status Breakdown (1/3) + Issue Type Map (2/3) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Status Breakdown"
          description="Issue count by current workflow status"
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

        <TreeMap
          title="Issue Type Map"
          description="Issues by category — area proportional to count"
          config={typeMapConfig}
          data={typeMapData}
          className="lg:col-span-2"
          isEmpty={typeMapData.length === 0}
          chartClassName="px-1"
        />
      </div>
    </div>
  );
}
