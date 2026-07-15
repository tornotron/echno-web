'use client';

import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { TaskStatus } from '@tornotron/echno-core/task/types';
import { ProjectStatus } from '@tornotron/echno-core/project/types';
import { differenceInDays, format } from 'date-fns';
import type { Project } from '@tornotron/echno-core/project/types';

type RAGStatus = 'green' | 'amber' | 'red' | 'grey';

function ragClass(status: RAGStatus) {
  switch (status) {
    case 'green': {
      return {
        bg: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
        dot: 'bg-green-500',
        text: 'text-green-700 dark:text-green-300',
        badge:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      };
    }
    case 'amber': {
      return {
        bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
        dot: 'bg-amber-500',
        text: 'text-amber-700 dark:text-amber-300',
        badge:
          'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      };
    }
    case 'red': {
      return {
        bg: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
        dot: 'bg-red-500',
        text: 'text-red-700 dark:text-red-300',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      };
    }
    default: {
      return {
        bg: 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800',
        dot: 'bg-zinc-400',
        text: 'text-zinc-500',
        badge: 'bg-zinc-100 text-zinc-600',
      };
    }
  }
}

function ragLabel(status: RAGStatus) {
  switch (status) {
    case 'green': {
      return 'On Track';
    }
    case 'amber': {
      return 'At Risk';
    }
    case 'red': {
      return 'Off Track';
    }
    default: {
      return 'Not Started';
    }
  }
}

function worstOf(statuses: RAGStatus[]): RAGStatus {
  if (statuses.includes('red')) return 'red';
  if (statuses.includes('amber')) return 'amber';
  if (statuses.includes('green')) return 'green';
  return 'grey';
}

interface HealthTabProps {
  project: Project;
}

export function HealthTab({ project }: HealthTabProps) {
  const tasks = project.tasks ?? [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === TaskStatus.completed
  ).length;
  const onHoldTasks = tasks.filter(
    (t) => t.status === TaskStatus.onHold
  ).length;
  const totalIssues = tasks.reduce((n, t) => n + (t.issues?.length ?? 0), 0);
  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const now = new Date();

  // Schedule health
  let scheduleStatus: RAGStatus = 'grey';
  let scheduleValue = '—';
  let scheduleDetail = 'No end date set';

  if (project.startDate && project.endDate) {
    const totalDuration = differenceInDays(project.endDate, project.startDate);
    const elapsed = differenceInDays(now, project.startDate);
    const expectedProgress =
      totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 0;
    const daysRemaining = differenceInDays(project.endDate, now);
    const progressGap = project.progress - expectedProgress;

    scheduleValue =
      daysRemaining < 0
        ? `${Math.abs(daysRemaining)}d overdue`
        : `${daysRemaining}d left`;
    scheduleDetail = `Expected ${Math.round(expectedProgress)}% · Actual ${Math.round(project.progress)}%`;

    if (project.status === ProjectStatus.completed) {
      scheduleStatus = 'green';
    } else if (daysRemaining < 0) {
      scheduleStatus = 'red';
    } else if (progressGap >= -10) {
      scheduleStatus = 'green';
    } else if (progressGap >= -25) {
      scheduleStatus = 'amber';
    } else {
      scheduleStatus = 'red';
    }
  }

  // Task health
  let taskStatus: RAGStatus = 'grey';
  let taskValue = '0%';
  let taskDetail = 'No tasks yet';
  if (totalTasks > 0) {
    taskValue = `${Math.round(completionRate)}%`;
    taskDetail = `${completedTasks} of ${totalTasks} complete · ${onHoldTasks} on hold`;
    taskStatus =
      completionRate >= 70 ? 'green' : completionRate >= 30 ? 'amber' : 'red';
  }

  // Issue health
  let issueStatus: RAGStatus = totalTasks === 0 ? 'grey' : 'green';
  if (totalIssues > 3) issueStatus = 'red';
  else if (totalIssues > 0) issueStatus = 'amber';

  // Progress health
  const progressStatus: RAGStatus =
    project.progress >= 70
      ? 'green'
      : project.progress >= 30
        ? 'amber'
        : 'grey';

  const indicators = [
    {
      label: 'Schedule',
      status: scheduleStatus,
      value: scheduleValue,
      detail: scheduleDetail,
      icon: Calendar,
    },
    {
      label: 'Task Completion',
      status: taskStatus,
      value: taskValue,
      detail: taskDetail,
      icon: CheckCircle2,
    },
    {
      label: 'Issues',
      status: issueStatus,
      value: String(totalIssues),
      detail:
        totalIssues === 0
          ? 'No open issues'
          : `${totalIssues} issue${totalIssues > 1 ? 's' : ''} across tasks`,
      icon: AlertTriangle,
    },
    {
      label: 'Progress',
      status: progressStatus,
      value: `${Math.round(project.progress)}%`,
      detail: 'Overall project progress',
      icon: Activity,
    },
  ];

  const overall = worstOf(indicators.map((i) => i.status));
  const overallColors = ragClass(overall);

  return (
    <div className="space-y-6">
      {/* Overall banner */}
      <div
        className={`flex items-center gap-4 rounded-xl border p-4 ${overallColors.bg}`}
      >
        <div className={`h-4 w-4 rounded-full ${overallColors.dot}`} />
        <div>
          <p className={`font-bold ${overallColors.text}`}>
            {ragLabel(overall)}
          </p>
          <p className="text-sm text-zinc-500">
            As of {format(now, 'dd MMM yyyy')}
          </p>
        </div>
        <span
          className={`ml-auto rounded-full px-3 py-1 text-sm font-semibold ${overallColors.badge}`}
        >
          {ragLabel(overall)}
        </span>
      </div>

      {/* RAG cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {indicators.map((ind) => {
          const colors = ragClass(ind.status);
          return (
            <div
              key={ind.label}
              className={`rounded-xl border p-4 ${colors.bg}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <ind.icon className={`h-5 w-5 ${colors.text}`} />
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${colors.badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                  {ragLabel(ind.status)}
                </span>
              </div>
              <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                {ind.label}
              </p>
              <p className={`mt-1 text-2xl font-bold ${colors.text}`}>
                {ind.value}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{ind.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Detail cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-zinc-400" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <DetailRow
              label="Start date"
              value={
                project.startDate
                  ? format(project.startDate, 'dd MMM yyyy')
                  : '—'
              }
            />
            <DetailRow
              label="End date"
              value={
                project.endDate ? format(project.endDate, 'dd MMM yyyy') : '—'
              }
            />
            <DetailRow
              label="Duration"
              value={
                project.startDate && project.endDate
                  ? `${differenceInDays(project.endDate, project.startDate)} days`
                  : '—'
              }
            />
            <DetailRow label="Status" value={project.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-zinc-400" />
              Task Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <DetailRow label="Total tasks" value={String(totalTasks)} />
            <DetailRow
              label="Completed"
              value={String(completedTasks)}
              color="green"
            />
            <DetailRow
              label="In progress"
              value={String(
                tasks.filter((t) => t.status === TaskStatus.onGoing).length
              )}
              color="blue"
            />
            <DetailRow
              label="On hold"
              value={String(onHoldTasks)}
              color="orange"
            />
            <DetailRow
              label="Total issues"
              value={String(totalIssues)}
              color={totalIssues > 0 ? 'red' : undefined}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const detailColorMap: Record<string, string> = {
  green: 'text-green-600 dark:text-green-400',
  blue: 'text-blue-600 dark:text-blue-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
};

function DetailRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: 'green' | 'blue' | 'orange' | 'red';
}) {
  const textColor =
    (color && detailColorMap[color]) || 'text-zinc-900 dark:text-zinc-100';
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-medium ${textColor}`}>{value}</span>
    </div>
  );
}
