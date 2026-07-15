'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  ListTodo,
  AlertCircle,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';
import { Card } from '@/components/shadcn/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/shadcn/chart';
import {
  ProjectStatus,
  getProjectStatusColor,
  getProjectStatusLabel,
} from '@tornotron/echno-core/project/types';
import type { Project } from '@tornotron/echno-core/project/types';
import { cn } from '@/lib/utils/index';
import { routes } from '@/nav';

interface ProjectOverviewProps {
  projects: Project[];
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.open]: '#4CAF50',
  [ProjectStatus.closed]: '#2A5797',
  [ProjectStatus.upcoming]: '#2196F3',
  [ProjectStatus.completed]: '#9C27B0',
  [ProjectStatus.onHold]: '#FF9800',
  [ProjectStatus.cancelled]: '#9E9E9E',
  [ProjectStatus.dropped]: '#795548',
};

const STATUS_CHART_CONFIG: ChartConfig = Object.fromEntries(
  Object.entries(STATUS_COLORS).map(([status, color]) => [
    status,
    { label: getProjectStatusLabel(status as ProjectStatus), color },
  ])
);

const QUICK_ACTIONS = [
  {
    icon: FolderKanban,
    label: 'All Projects',
    href: routes.portfolio.projects.allProjects.href,
  },
  {
    icon: ListTodo,
    label: 'All Tasks',
    href: routes.portfolio.projects.allTasks,
  },
  {
    icon: AlertCircle,
    label: 'All Issues',
    href: routes.portfolio.projects.allIssues,
  },
];

function deadlineBadge(endDate: Date): { label: string; className: string } {
  const now = new Date();
  const endDay = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = (endDay.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24);
  if (days < 0)
    return {
      label: 'Overdue',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
  if (days === 0)
    return {
      label: 'Today',
      className:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
  if (days <= 30)
    return {
      label: `${days}d`,
      className:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
  return {
    label: `${Math.ceil(days / 7)}w`,
    className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  };
}

export function ProjectOverview({ projects }: ProjectOverviewProps) {
  const total = projects.length;

  const openCount = useMemo(
    () => projects.filter((p) => p.status === ProjectStatus.open).length,
    [projects]
  );

  const pct = total > 0 ? Math.round((openCount / total) * 100) : 0;

  const statusChartData = useMemo(
    () =>
      Object.values(ProjectStatus)
        .map((status) => ({
          key: status,
          value: projects.filter((p) => p.status === status).length,
          fill: `var(--color-${status})`,
        }))
        .filter((item) => item.value > 0),
    [projects]
  );

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const activeStatuses = new Set([
      ProjectStatus.open,
      ProjectStatus.upcoming,
      ProjectStatus.onHold,
    ]);
    return [...projects]
      .filter((p) => p.endDate && activeStatuses.has(p.status))
      .toSorted((a, b) => {
        const da = a.endDate!.getTime() - now.getTime();
        const db = b.endDate!.getTime() - now.getTime();
        // Overdue projects first (negative ms, sort by least negative = closest to now)
        if (da < 0 && db < 0) return db - da;
        // Overdue before upcoming
        if (da < 0) return -1;
        if (db < 0) return 1;
        // Soonest first
        return da - db;
      })
      .slice(0, 4);
  }, [projects]);

  return (
    <Card className="gap-0 p-6">
      <div className="divide-border grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {/* Donut chart — status distribution */}
        <div className="flex items-center justify-center gap-4 py-6 sm:py-0 sm:pr-8">
          <ChartContainer
            config={STATUS_CHART_CONFIG}
            className="h-[120px] w-[120px] shrink-0"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="key" />}
              />
              <Pie
                data={statusChartData}
                dataKey="value"
                nameKey="key"
                innerRadius={34}
                outerRadius={46}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-[13px] font-bold"
                          >
                            {pct}%
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {openCount} of {total}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Projects Active
            </p>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="py-6 sm:px-8 sm:py-0">
          <p className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Upcoming Deadlines
          </p>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No deadlines set
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((project) => {
                const badge = deadlineBadge(project.endDate!);
                return (
                  <Link
                    key={project.id}
                    href={
                      routes.portfolio.projects.allProjects.detail(project.id)
                        .href
                    }
                    className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
                  >
                    <div
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: getProjectStatusColor(project.status),
                      }}
                    />
                    <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
                      {project.projectName}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        badge.className
                      )}
                    >
                      {badge.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="py-6 sm:py-0 sm:pl-8">
          <p className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Quick Actions
          </p>
          <div className="space-y-1">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group hover:bg-muted/60 flex items-center gap-2.5 rounded-md px-3 py-2.5 transition-colors"
              >
                <action.icon className="size-4 shrink-0 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {action.label}
                </span>
                <ChevronRight className="size-3.5 text-zinc-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
