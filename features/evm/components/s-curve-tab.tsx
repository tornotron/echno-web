'use client';

import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  addMonths,
  format,
  differenceInDays,
  isAfter,
  startOfMonth,
} from 'date-fns';
import { TaskStatus } from '@/types/task';
import type { Project } from '@/types/project';

function generateSCurveData(project: Project) {
  if (!project.startDate || !project.endDate) return [];
  const tasks = project.tasks ?? [];
  const projectStart = project.startDate;
  const projectEnd = project.endDate;
  const totalDuration = differenceInDays(projectEnd, projectStart);
  if (totalDuration <= 0) return [];

  const today = new Date();
  const points: {
    date: string;
    planned: number;
    actual: number | null;
    forecast: number | null;
  }[] = [];
  let cursor = startOfMonth(projectStart);
  const endCursor = addMonths(startOfMonth(projectEnd), 1);

  while (!isAfter(cursor, endCursor)) {
    const elapsed = differenceInDays(cursor, projectStart);
    const t = Math.max(0, Math.min(1, elapsed / totalDuration));
    // S-shaped cubic ease-in-out
    const planned = Math.round(
      (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) * 100
    );

    let actual: number | null = null;
    if (!isAfter(cursor, today)) {
      const completedByDate = tasks.filter(
        (t) =>
          t.status === TaskStatus.completed &&
          t.endDate &&
          !isAfter(t.endDate, cursor)
      ).length;
      let partialProgress = 0;
      for (const t of tasks) {
        if (t.status === TaskStatus.completed || !t.startDate || !t.endDate)
          continue;
        if (isAfter(t.startDate, cursor)) continue;
        partialProgress += t.progress;
      }
      actual =
        tasks.length > 0
          ? Math.round(
              Math.min(
                100,
                (completedByDate / tasks.length) * 100 +
                  partialProgress / tasks.length
              )
            )
          : 0;
    }

    let forecast: number | null = null;
    if (
      isAfter(cursor, today) ||
      Math.abs(differenceInDays(cursor, today)) <= 15
    ) {
      const currentActual =
        tasks.length > 0
          ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
          : 0;
      const daysFromNow = differenceInDays(cursor, today);
      const daysToEnd = differenceInDays(projectEnd, today);
      forecast =
        daysToEnd > 0
          ? Math.round(
              currentActual +
                (100 - currentActual) *
                  Math.max(0, Math.min(1, daysFromNow / daysToEnd))
            )
          : currentActual;
    }

    points.push({ date: format(cursor, 'MMM yy'), planned, actual, forecast });
    cursor = addMonths(cursor, 1);
  }
  return points;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-1 text-xs font-semibold text-zinc-500">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name === 'planned'
            ? 'Planned'
            : p.name === 'actual'
              ? 'Actual'
              : 'Forecast'}
          : {p.value}%
        </p>
      ))}
    </div>
  );
}

interface SCurveTabProps {
  project: Project;
}

export function SCurveTab({ project }: SCurveTabProps) {
  const tasks = project.tasks ?? [];
  const chartData = generateSCurveData(project);
  const today = new Date();
  const todayLabel = format(today, 'MMM yy');
  const avgProgress =
    tasks.length > 0
      ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
      : 0;
  const completedCount = tasks.filter(
    (t) => t.status === TaskStatus.completed
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Overall Progress',
            value: `${Math.round(project.progress)}%`,
            color: 'blue',
          },
          {
            label: 'Avg Task Progress',
            value: `${avgProgress}%`,
            color: 'blue',
          },
          {
            label: 'Completed Tasks',
            value: `${completedCount}/${tasks.length}`,
            color: 'green',
          },
          {
            label: 'Days Remaining',
            value: project.endDate
              ? `${Math.max(0, differenceInDays(project.endDate, today))}d`
              : '—',
            color: 'zinc',
          },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-zinc-500">{k.label}</p>
              <p
                className={`text-xl font-bold ${k.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : k.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-100'}`}
              >
                {k.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {chartData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="mx-auto mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            <p className="text-zinc-500">
              Set a project start and end date to generate the S-Curve.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Progress Curve — Planned vs Actual vs Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gPlanned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="#94A3B8"
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11 }}
                  stroke="#94A3B8"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(v) =>
                    v === 'planned'
                      ? 'Planned'
                      : v === 'actual'
                        ? 'Actual'
                        : 'Forecast'
                  }
                />
                <ReferenceLine
                  x={todayLabel}
                  stroke="#F43F5E"
                  strokeDasharray="4 3"
                  label={{
                    value: 'Today',
                    position: 'insideTopRight',
                    fontSize: 10,
                    fill: '#F43F5E',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="planned"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#gPlanned)"
                  connectNulls
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#22C55E"
                  strokeWidth={2.5}
                  fill="url(#gActual)"
                  connectNulls
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  fill="url(#gForecast)"
                  connectNulls
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
