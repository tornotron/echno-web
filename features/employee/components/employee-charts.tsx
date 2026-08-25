'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  ChartCard,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  CHART_PALETTE,
  type ChartConfig,
} from '@/components/shadcn/chart';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Department,
  Employee,
  EmployeeStatus,
  getDepartmentLabel,
  getEmployeeStatusLabel,
} from '@tornotron/echno-core/employee/types';
import { cn } from '@/lib/utils/index';

// ─── Status colours + static ChartConfig ─────────────────────────────────────

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  [EmployeeStatus.active]: '#10b981',
  [EmployeeStatus.inactive]: '#71717a',
  [EmployeeStatus.onLeave]: '#f59e0b',
  [EmployeeStatus.probation]: '#6366f1',
  [EmployeeStatus.terminated]: '#ef4444',
  [EmployeeStatus.resigned]: '#ec4899',
  [EmployeeStatus.suspended]: '#8b5cf6',
};

/**
 * Static config for status-based series — injects CSS vars like --color-active.
 * Line/Area series use `stroke="var(--color-active)"` to pick them up.
 */
const EMPLOYEE_STATUS_CONFIG: ChartConfig = Object.fromEntries(
  Object.entries(STATUS_COLORS).map(([status, color]) => [
    status,
    { label: getEmployeeStatusLabel(status as EmployeeStatus), color },
  ])
);

const TENURE_CONFIG: ChartConfig = {
  count: { label: 'Employees', color: CHART_PALETTE[0] },
};

// ─── Period selector ──────────────────────────────────────────────────────────

type Period = 'month' | 'year';

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

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

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildHiringTrend(
  employees: Employee[],
  period: Period,
  trendYear: number,
  trendMonth: number
) {
  const withDates = employees.filter((e) => e.joiningDate);
  if (withDates.length === 0) return [];

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
    const bucket = withDates.filter((e) => {
      const d = new Date(e.joiningDate!);
      return d >= start && d <= end;
    });
    const counts: Record<string, number> = {};
    for (const s of Object.values(EmployeeStatus)) {
      counts[s] = bucket.filter((e) => e.status === s).length;
    }
    return { period: key, ...counts, total: bucket.length };
  });
}

function getAvailableMonths(year: number): { value: number; label: string }[] {
  const now = new Date();
  const maxMonth = year === now.getFullYear() ? now.getMonth() : 11;
  return Array.from({ length: maxMonth + 1 }, (_, i) => ({
    value: i,
    label: `${MONTHS[i]} ${year}`,
  }));
}

function getAvailableYears(employees: Employee[]): number[] {
  const years = new Set<number>();
  const now = new Date().getFullYear();
  for (const emp of employees) {
    if (emp.joiningDate) years.add(new Date(emp.joiningDate).getFullYear());
  }
  years.add(now);
  return [...years].toSorted((a, b) => b - a);
}

function buildWorkforceByYear(employees: Employee[], year: number) {
  const now = new Date();
  return MONTHS.map((month, mi) => {
    const monthEnd = new Date(year, mi + 1, 0, 23, 59, 59, 999);
    if (monthEnd > now) return null;
    const counts: Record<EmployeeStatus, number> = {
      [EmployeeStatus.active]: 0,
      [EmployeeStatus.inactive]: 0,
      [EmployeeStatus.onLeave]: 0,
      [EmployeeStatus.probation]: 0,
      [EmployeeStatus.terminated]: 0,
      [EmployeeStatus.resigned]: 0,
      [EmployeeStatus.suspended]: 0,
    };
    for (const emp of employees) {
      if (!emp.joiningDate) continue;
      const joined = new Date(emp.joiningDate);
      if (joined <= monthEnd) counts[emp.status]++;
    }
    return { month, ...counts };
  }).filter(Boolean) as ({ month: string } & Record<EmployeeStatus, number>)[];
}

function buildDeptDist(employees: Employee[]) {
  const counts = new Map<string, number>();
  for (const emp of employees) {
    const label = emp.department
      ? getDepartmentLabel(emp.department as Department)
      : 'Unknown';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .toSorted((a, b) => b.value - a.value);
}

function buildTenure(employees: Employee[]) {
  const now = Date.now();
  const DAY = 86_400_000;
  const buckets = [
    { label: '< 6 mo', min: 0, max: 180 * DAY },
    { label: '6–12 mo', min: 180 * DAY, max: 365 * DAY },
    { label: '1–2 yr', min: 365 * DAY, max: 730 * DAY },
    { label: '2–5 yr', min: 730 * DAY, max: 1825 * DAY },
    { label: '5 yr+', min: 1825 * DAY, max: Infinity },
  ];
  return buckets.map(({ label, min, max }) => ({
    tenure: label,
    count: employees.filter((e) => {
      if (!e.joiningDate) return false;
      const t = now - new Date(e.joiningDate).getTime();
      return t >= min && t < max;
    }).length,
  }));
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface EmployeeChartsProps {
  employees: Employee[];
}

export function EmployeeCharts({ employees = [] }: EmployeeChartsProps) {
  const [trendPeriod, setTrendPeriod] = useState<Period>('month');
  const [trendYear, setTrendYear] = useState<number>(() =>
    new Date().getFullYear()
  );
  const [trendMonth, setTrendMonth] = useState<number>(() =>
    new Date().getMonth()
  );
  const availableYears = useMemo(
    () => getAvailableYears(employees),
    [employees]
  );
  const availableMonths = useMemo(
    () => getAvailableMonths(trendYear),
    [trendYear]
  );

  // Compute effective trendMonth: clamp to valid value if needed
  const effectiveTrendMonth = useMemo(() => {
    const monthValues = availableMonths.map((m) => m.value);
    if (monthValues.includes(trendMonth)) {
      return trendMonth;
    }
    // If invalid, use the maximum (last) valid month
    return monthValues.length > 0 ? Math.max(...monthValues) : trendMonth;
  }, [availableMonths, trendMonth]);
  const [selectedYear, setSelectedYear] = useState<number>(() =>
    new Date().getFullYear()
  );

  const hiringTrend = useMemo(
    () =>
      buildHiringTrend(employees, trendPeriod, trendYear, effectiveTrendMonth),
    [employees, trendPeriod, trendYear, effectiveTrendMonth]
  );
  const workforceByYear = useMemo(
    () => buildWorkforceByYear(employees, selectedYear),
    [employees, selectedYear]
  );
  const deptDist = useMemo(() => buildDeptDist(employees), [employees]);
  const tenure = useMemo(() => buildTenure(employees), [employees]);

  const activeStatuses = useMemo(
    () =>
      Object.values(EmployeeStatus).filter((s) =>
        employees.some((e) => e.status === s)
      ),
    [employees]
  );

  // Dynamic config for the pie chart (dept names are not compile-time constants)
  const deptConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        deptDist.map((d, i) => [
          d.name,
          { label: d.name, color: CHART_PALETTE[i % CHART_PALETTE.length] },
        ])
      ),
    [deptDist]
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

  const yearSelect = (
    <Select
      value={String(selectedYear)}
      onValueChange={(v) => setSelectedYear(Number(v))}
    >
      <SelectTrigger className="h-7 w-24 text-xs">
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
  );

  return (
    <div className="space-y-4">
      {/* Row 1 — Status Trend (1/2) + Department Distribution (1/2) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Hiring trend — LineChart */}
        <ChartCard
          title="Employee Status Trend"
          description={
            trendPeriod === 'month'
              ? `Weekly new hires by status — ${MONTHS[trendMonth]} ${trendYear}`
              : `Monthly new hires by status — ${trendYear}`
          }
          config={EMPLOYEE_STATUS_CONFIG}
          headerAction={trendHeaderAction}
        >
          <LineChart data={hiringTrend} margin={{ left: -10, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
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
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {activeStatuses.map((s) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={`var(--color-${s})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ChartCard>

        {/*
         * Department Distribution — PieChart with side legend.
         * Uses a custom two-column layout inside CardContent, so we render the
         * card shell manually and use ChartContainer directly for the pie.
         */}
        <Card variant="panel">
          <CardHeader className="px-5 pt-5 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold">
                Department Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Employees per department
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-2">
              <ChartContainer
                config={deptConfig}
                className="h-[220px] w-[180px] shrink-0"
              >
                <PieChart>
                  <Pie
                    data={deptDist}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {deptDist.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel nameKey="name" />}
                  />
                </PieChart>
              </ChartContainer>
              {/* Side legend — kept custom for the two-column pie layout */}
              <div
                className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-y-auto"
                style={{ maxHeight: 220 }}
              >
                {deptDist.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_PALETTE[i % CHART_PALETTE.length],
                      }}
                    />
                    <span className="flex-1 truncate text-xs text-zinc-600 dark:text-zinc-400">
                      {entry.name}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 — Workforce Growth (1/2) + Tenure (1/2) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Tenure Distribution"
          description="How long employees have been with the organization"
          config={TENURE_CONFIG}
        >
          <BarChart
            data={tenure}
            layout="vertical"
            margin={{ left: 8, right: 16 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="tenure"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
              {tenure.map((_, i) => (
                <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Workforce Growth"
          description={`Cumulative headcount by status — ${selectedYear}`}
          config={EMPLOYEE_STATUS_CONFIG}
          headerAction={yearSelect}
        >
          <LineChart data={workforceByYear} margin={{ left: 12, right: 12 }}>
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
                type="linear"
                dataKey={s}
                stroke={`var(--color-${s})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartCard>
      </div>
    </div>
  );
}
