'use client';

import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Employee,
  EmployeeStatus,
  Department,
  getDepartmentLabel,
  getEmployeeStatusLabel,
} from '@/types/employee';
import { cn } from '@/lib/utils/index';

// ─── Colour palette ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  [EmployeeStatus.active]: '#10b981',
  [EmployeeStatus.inactive]: '#71717a',
  [EmployeeStatus.onLeave]: '#f59e0b',
  [EmployeeStatus.probation]: '#6366f1',
  [EmployeeStatus.terminated]: '#ef4444',
  [EmployeeStatus.resigned]: '#ec4899',
  [EmployeeStatus.suspended]: '#8b5cf6',
};

const DEPT_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#8b5cf6',
  '#14b8a6',
];

type Period = 'day' | 'week' | 'month' | 'year';

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildHiringTrend(employees: Employee[], period: Period) {
  const withDates = employees.filter((e) => e.joiningDate);
  if (withDates.length === 0) return [];

  const now = new Date();
  type Bucket = { key: string; start: Date; end: Date };
  let buckets: Bucket[] = [];

  switch (period) {
    case 'day': {
      buckets = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (29 - i));
        d.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        return {
          key: d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          }),
          start: d,
          end,
        };
      });

      break;
    }
    case 'week': {
      buckets = Array.from({ length: 12 }, (_, i) => {
        const start = new Date(now);
        start.setDate(now.getDate() - (11 - i) * 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return {
          key: start.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          }),
          start,
          end,
        };
      });

      break;
    }
    case 'month': {
      buckets = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const end = new Date(
          d.getFullYear(),
          d.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        return {
          key: d.toLocaleDateString('en-GB', {
            month: 'short',
            year: '2-digit',
          }),
          start: d,
          end,
        };
      });

      break;
    }
    default: {
      const years = withDates.map((e) =>
        new Date(e.joiningDate!).getFullYear()
      );
      const minYear = Math.min(...years);
      buckets = Array.from(
        { length: now.getFullYear() - minYear + 1 },
        (_, i) => {
          const y = minYear + i;
          return {
            key: String(y),
            start: new Date(y, 0, 1),
            end: new Date(y, 11, 31, 23, 59, 59),
          };
        }
      );
    }
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

function buildDeptHistogram(employees: Employee[]) {
  const map = new Map<
    string,
    { active: number; inactive: number; other: number }
  >();
  for (const emp of employees) {
    const label = emp.department
      ? getDepartmentLabel(emp.department as Department)
      : 'Unknown';
    const entry = map.get(label) ?? { active: 0, inactive: 0, other: 0 };
    if (emp.status === EmployeeStatus.active) entry.active++;
    else if (
      emp.status === EmployeeStatus.inactive ||
      emp.status === EmployeeStatus.terminated ||
      emp.status === EmployeeStatus.resigned
    )
      entry.inactive++;
    else entry.other++;
    map.set(label, entry);
  }
  return [...map.entries()]
    .map(([dept, c]) => ({
      dept,
      ...c,
      total: c.active + c.inactive + c.other,
    }))
    .toSorted((a, b) => b.total - a.total)
    .slice(0, 10);
}

// Department distribution as pie data
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

// ─── Shared tooltip style ─────────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    fontSize: '12px',
    color: 'var(--popover-foreground)',
  },
  itemStyle: { color: 'var(--popover-foreground)' },
  labelStyle: { fontWeight: 600, color: 'var(--popover-foreground)' },
};

// ─── Period toggle ────────────────────────────────────────────────────────────

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

// ─── Main export ──────────────────────────────────────────────────────────────

interface EmployeeChartsProps {
  employees: Employee[];
}

export function EmployeeCharts({ employees = [] }: EmployeeChartsProps) {
  const [period, setPeriod] = useState<Period>('month');

  const availableYears = useMemo(
    () => getAvailableYears(employees),
    [employees]
  );
  const [selectedYear, setSelectedYear] = useState<number>(() =>
    new Date().getFullYear()
  );

  const hiringTrend = useMemo(
    () => buildHiringTrend(employees, period),
    [employees, period]
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

  return (
    <div className="space-y-4">
      {/* Row 1 — Status Trend + Status Distribution Area */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Status Trend Line Chart */}
        <Card variant="panel" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4 px-5 pt-5 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold">
                Employee Status Trend
              </CardTitle>
              <CardDescription className="text-xs">
                New hires per period by current status
              </CardDescription>
            </div>
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
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={220}>
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
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {activeStatuses.map((s) => (
                  <Line
                    key={s}
                    type="monotone"
                    dataKey={s}
                    name={getEmployeeStatusLabel(s)}
                    stroke={STATUS_COLORS[s]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution — Pie Chart */}
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
              {/* Pie */}
              <div className="shrink-0" style={{ width: 180, height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ value }) => value}
                      labelLine={false}
                    >
                      {deptDist.map((_, i) => (
                        <Cell
                          key={i}
                          fill={DEPT_COLORS[i % DEPT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value, name) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Custom right legend */}
              <div
                className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-y-auto"
                style={{ maxHeight: 220 }}
              >
                {deptDist.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length],
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

      {/* Row 3 — Workforce Growth Area + Tenure */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card variant="panel">
          <CardHeader className="flex flex-row items-start justify-between gap-4 px-5 pt-5 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold">
                Workforce Growth
              </CardTitle>
              <CardDescription className="text-xs">
                Cumulative headcount by status — {selectedYear}
              </CardDescription>
            </div>
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
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={workforceByYear}
                margin={{ left: -10, right: 8 }}
              >
                <defs>
                  {activeStatuses.map((s) => (
                    <linearGradient
                      key={s}
                      id={`grad-${s}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={STATUS_COLORS[s]}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={STATUS_COLORS[s]}
                        stopOpacity={0.03}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
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
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {activeStatuses.map((s) => (
                  <Area
                    key={s}
                    type="monotone"
                    dataKey={s}
                    name={getEmployeeStatusLabel(s)}
                    stroke={STATUS_COLORS[s]}
                    strokeWidth={2}
                    fill={`url(#grad-${s})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card variant="panel">
          <CardHeader className="px-5 pt-5 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold">
                Tenure Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                How long employees have been with the organization
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={220}>
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
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Employees" radius={[0, 3, 3, 0]}>
                  {tenure.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
