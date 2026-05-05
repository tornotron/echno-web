'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
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
import { LeaveRequest, LeaveStatus, getLeaveStatusLabel } from '@/types/leave';
import { Department, getDepartmentLabel } from '@/types/employee';
import { Button } from '@/components/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { cn } from '@/lib/utils/index';

interface LeaveChartsProps {
  requests: LeaveRequest[];
}

// ─── Status colours + static ChartConfig ─────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  [LeaveStatus.APPROVED]: '#10b981',
  [LeaveStatus.PENDING_APPROVAL]: '#f59e0b',
  [LeaveStatus.REJECTED]: '#ef4444',
  [LeaveStatus.CANCELLED]: '#f97316',
  [LeaveStatus.WITHDRAWN]: '#71717a',
  [LeaveStatus.DRAFT]: '#a1a1aa',
};

/**
 * Static config for the AreaChart — injects CSS vars like --color-APPROVED.
 * Series use `stroke="var(--color-APPROVED)"` to pick up these values.
 */
const LEAVE_STATUS_CONFIG: ChartConfig = Object.fromEntries(
  Object.entries(STATUS_COLORS).map(([status, color]) => [
    status,
    { label: getLeaveStatusLabel(status as LeaveStatus), color },
  ])
);

/** Approval pipeline — each stage is a data point on the x-axis. */
const PIPELINE_CONFIG: ChartConfig = {
  value: { label: 'Requests', color: '#6366f1' },
};

// ─── Period selector ──────────────────────────────────────────────────────────

type Period = 'month' | 'year';

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

// ─── Data helpers ─────────────────────────────────────────────────────────────

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

function getAvailableYears(requests: LeaveRequest[]): number[] {
  const years = new Set<number>();
  const now = new Date().getFullYear();
  for (const req of requests) {
    const sub = req.submittedAt ?? req.createdAt;
    if (sub) years.add(new Date(sub).getFullYear());
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

function buildMonthlyTrend(
  requests: LeaveRequest[],
  period: Period,
  trendYear: number,
  trendMonth: number
) {
  const now = new Date();
  type Bucket = { key: string; start: Date; end: Date };
  let buckets: Bucket[] = [];

  if (period === 'month') {
    const daysInMonth = new Date(trendYear, trendMonth + 1, 0).getDate();
    const weekRanges: { start: number; end: number }[] = [
      { start: 1, end: 7 },
      { start: 8, end: 14 },
      { start: 15, end: 21 },
      { start: 22, end: 28 },
    ];
    if (daysInMonth > 28) weekRanges.push({ start: 29, end: daysInMonth });
    buckets = weekRanges.map(({ start, end }, i) => ({
      key: `Wk ${i + 1}`,
      start: new Date(trendYear, trendMonth, start, 0, 0, 0, 0),
      end: new Date(trendYear, trendMonth, end, 23, 59, 59, 999),
    }));
  } else {
    buckets = MONTHS.map((label, mi) => ({
      key: label,
      start: new Date(trendYear, mi, 1, 0, 0, 0, 0),
      end: new Date(trendYear, mi + 1, 0, 23, 59, 59, 999),
    })).filter(({ end }) => end <= now);
  }

  return buckets.map(({ key, start, end }) => {
    const inBucket = requests.filter((r) => {
      const sub = r.submittedAt ?? r.createdAt;
      if (!sub) return false;
      const date = new Date(sub);
      return date >= start && date <= end;
    });
    const counts: Record<string, number> = {};
    for (const s of Object.values(LeaveStatus)) {
      counts[s] = inBucket.filter((r) => r.status === s).length;
    }
    return { month: key, ...counts };
  });
}

function buildLeaveTypeDist(requests: LeaveRequest[]) {
  const counts = new Map<string, number>();
  for (const r of requests) {
    const name = r.leaveTypeName ?? 'Unknown';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .toSorted((a, b) => b.value - a.value);
}

function buildApprovalFunnel(requests: LeaveRequest[]) {
  const submitted = requests.filter((r) => r.status !== LeaveStatus.DRAFT);
  const active = submitted.filter(
    (r) =>
      r.status === LeaveStatus.PENDING_APPROVAL ||
      r.status === LeaveStatus.APPROVED
  );
  const approved = submitted.filter((r) => r.status === LeaveStatus.APPROVED);
  return [
    { name: 'Total', value: requests.length },
    { name: 'Submitted', value: submitted.length },
    { name: 'Active', value: active.length },
    { name: 'Approved', value: approved.length },
  ].filter((d) => d.value > 0);
}

function buildDeptBreakdown(requests: LeaveRequest[]) {
  const counts = new Map<string, number>();
  for (const r of requests) {
    const dept =
      getDepartmentLabel(r.department as Department | undefined) ||
      r.department ||
      'Unknown';
    counts.set(dept, (counts.get(dept) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, value], i) => ({
      name,
      value,
      fill: CHART_PALETTE[i % CHART_PALETTE.length],
    }))
    .toSorted((a, b) => b.value - a.value)
    .slice(0, 10);
}

// ─── Custom Treemap tile ──────────────────────────────────────────────────────

interface TreemapTileProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  fill?: string;
}

function TreemapTile(props: TreemapTileProps) {
  const { x, y, width, height, name, value, fill } = props;
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

  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={height - 2}
        fill={safeFill}
        rx={4}
      />
      {width > 48 && height > 32 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - (height > 48 ? 8 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.95)"
            fontSize={Math.min(11, Math.floor(width / 7))}
            fontWeight={600}
          >
            {safeName.length > 12 ? `${safeName.slice(0, 10)}…` : safeName}
          </text>
          {height > 48 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.7)"
              fontSize={10}
            >
              {safeValue}
            </text>
          )}
        </>
      )}
    </g>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LeaveCharts({ requests }: LeaveChartsProps) {
  const [trendPeriod, setTrendPeriod] = useState<Period>('month');
  const [trendYear, setTrendYear] = useState<number>(() =>
    new Date().getFullYear()
  );
  const [trendMonth, setTrendMonth] = useState<number>(() =>
    new Date().getMonth()
  );
  const availableYears = useMemo(() => getAvailableYears(requests), [requests]);
  const availableMonths = useMemo(
    () => getAvailableMonths(trendYear),
    [trendYear]
  );

  const monthlyTrend = useMemo(
    () => buildMonthlyTrend(requests, trendPeriod, trendYear, trendMonth),
    [requests, trendPeriod, trendYear, trendMonth]
  );
  const leaveTypeDist = useMemo(() => buildLeaveTypeDist(requests), [requests]);
  const approvalFunnel = useMemo(
    () => buildApprovalFunnel(requests),
    [requests]
  );
  const deptBreakdown = useMemo(() => buildDeptBreakdown(requests), [requests]);

  const activeStatuses = useMemo(
    () =>
      Object.values(LeaveStatus).filter((s) =>
        requests.some((r) => r.status === s)
      ),
    [requests]
  );

  const radialData = useMemo(
    () =>
      leaveTypeDist.slice(0, 6).map((d, i) => ({
        ...d,
        fill: CHART_PALETTE[i % CHART_PALETTE.length],
      })),
    [leaveTypeDist]
  );

  // Dynamic configs for charts with data-driven series
  const radialConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        radialData.map((d) => [d.name, { label: d.name, color: d.fill }])
      ),
    [radialData]
  );
  const deptConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        deptBreakdown.map((d) => [d.name, { label: d.name, color: d.fill }])
      ),
    [deptBreakdown]
  );

  const trendHeaderAction = (
    <div className="flex shrink-0 items-center gap-2">
      {trendPeriod === 'month' ? (
        <Select
          value={String(trendMonth)}
          onValueChange={(v) => setTrendMonth(Number(v))}
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
        <Select
          value={String(trendYear)}
          onValueChange={(v) => setTrendYear(Number(v))}
        >
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
            onClick={() => setTrendPeriod(p.value)}
            className={cn(
              'rounded-none px-2.5 text-xs',
              trendPeriod === p.value &&
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
      {/* Row 1 — Request Volume (1/2) + Approval Pipeline (1/2) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Request Volume"
          description={
            trendPeriod === 'month'
              ? `Weekly leave requests by status — ${MONTHS[trendMonth]} ${trendYear}`
              : `Monthly leave requests by status — ${trendYear}`
          }
          config={LEAVE_STATUS_CONFIG}
          headerAction={trendHeaderAction}
        >
          <LineChart data={monthlyTrend} margin={{ left: 12, right: 12 }}>
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
            {activeStatuses.map((s) => (
              <Line
                key={s}
                type="step"
                dataKey={s}
                stroke={`var(--color-${s})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ChartCard>

        <ChartCard
          title="Approval Pipeline"
          description="Request volume at each stage of the approval flow"
          config={PIPELINE_CONFIG}
          isEmpty={approvalFunnel.length === 0}
        >
          <RadarChart
            data={approvalFunnel}
            margin={{
              top: 10,
              right: 10,
              bottom: 10,
              left: 10,
            }}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fontSize: 12, fontWeight: 500 }}
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

      {/* Row 2 — Radial bar (1/3) + Treemap (2/3)  [inverted asymmetry from row 1] */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Leave Types"
          description="Request count by leave category"
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
          title="Department Leave Map"
          description="Leave request volume across departments — area proportional to count"
          config={deptConfig}
          data={deptBreakdown}
          className="lg:col-span-2"
          isEmpty={deptBreakdown.length === 0}
          chartClassName="px-1"
          content={(props: unknown) => (
            <TreemapTile {...(props as TreemapTileProps)} />
          )}
        />
      </div>
    </div>
  );
}
