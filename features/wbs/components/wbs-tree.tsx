'use client';

import { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  Circle,
} from 'lucide-react';
import { Task, TaskStatus, getTaskStatusLabel } from '@/types/task';
import { Badge } from '@/components/shadcn/badge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryGroup {
  id: string;
  name: string;
  tasks: Task[];
  completedCount: number;
  totalProgress: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByCategory(tasks: Task[]): CategoryGroup[] {
  const map = new Map<string, Task[]>();

  for (const task of tasks) {
    const key = task.category?.name ?? 'Uncategorised';
    const existing = map.get(key);
    if (existing) {
      existing.push(task);
    } else {
      map.set(key, [task]);
    }
  }

  return [...map.entries()].map(([name, groupTasks]) => ({
    id: name,
    name,
    tasks: groupTasks,
    completedCount: groupTasks.filter((t) => t.status === TaskStatus.completed)
      .length,
    totalProgress:
      groupTasks.length > 0
        ? Math.round(
            groupTasks.reduce((sum, t) => sum + t.progress, 0) /
              groupTasks.length
          )
        : 0,
  }));
}

function statusDot(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.completed: {
      return 'text-green-500';
    }
    case TaskStatus.onGoing: {
      return 'text-blue-500';
    }
    case TaskStatus.onHold: {
      return 'text-orange-500';
    }
    default: {
      return 'text-zinc-400';
    }
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const taskBadgeClasses: Partial<Record<TaskStatus, string>> = {
  [TaskStatus.completed]:
    'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400',
  [TaskStatus.onGoing]:
    'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400',
  [TaskStatus.onHold]:
    'border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400',
};

function taskBadgeClass(status: TaskStatus): string {
  return taskBadgeClasses[status] ?? 'border-zinc-200 text-zinc-500';
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      <Circle
        className={`h-2.5 w-2.5 shrink-0 fill-current ${statusDot(task.status)}`}
      />
      <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
        {task.title}
      </span>
      <div className="flex items-center gap-2">
        {/* Progress bar */}
        <div className="hidden w-20 sm:block">
          <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
        <span className="w-8 text-right text-xs text-zinc-500">
          {task.progress}%
        </span>
        <Badge
          variant="outline"
          className={`hidden text-[10px] sm:inline-flex ${taskBadgeClass(task.status)}`}
        >
          {getTaskStatusLabel(task.status)}
        </Badge>
      </div>
    </div>
  );
}

function CategoryNode({ group }: { group: CategoryGroup }) {
  const [expanded, setExpanded] = useState(true);

  const allCompleted = group.completedCount === group.tasks.length;
  const progressColor = allCompleted
    ? 'bg-green-500'
    : group.totalProgress > 50
      ? 'bg-blue-500'
      : 'bg-zinc-400';

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Category header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 rounded-t-lg px-3 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
        )}
        {expanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-amber-500" />
        )}
        <span className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {group.name}
        </span>
        <div className="flex items-center gap-3">
          {/* Mini progress bar */}
          <div className="hidden w-24 sm:block">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className={`h-2 rounded-full transition-all ${progressColor}`}
                style={{ width: `${group.totalProgress}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-zinc-500">
            {group.completedCount}/{group.tasks.length} done
          </span>
          <span
            className={`text-sm font-bold ${
              allCompleted
                ? 'text-green-600'
                : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {group.totalProgress}%
          </span>
        </div>
      </button>

      {/* Task rows */}
      {expanded && (
        <div className="border-t border-zinc-100 px-2 py-1 dark:border-zinc-800">
          {group.tasks.map((task, i) => (
            <TaskRow key={task.id ?? i} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WBSTree ──────────────────────────────────────────────────────────────────

interface WBSTreeProps {
  tasks: Task[];
}

export function WBSTree({ tasks }: WBSTreeProps) {
  const groups = useMemo(() => groupByCategory(tasks), [tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === TaskStatus.completed
  ).length;
  const overallProgress =
    totalTasks > 0
      ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
      : 0;

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
        No tasks found. Create tasks to build the WBS.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Project WBS
          </span>
          <span className="ml-2 text-xs text-zinc-500">
            {groups.length} {groups.length === 1 ? 'category' : 'categories'} ·{' '}
            {totalTasks} tasks
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {completedTasks}/{totalTasks} completed
          </span>
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {overallProgress}%
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid items-center px-3 text-xs font-medium tracking-wide text-zinc-400 uppercase">
        <div className="flex items-center justify-end gap-3 pr-1">
          <span className="hidden w-24 text-center sm:block">Progress</span>
          <span className="w-16 text-center">Status</span>
        </div>
      </div>

      {/* Category groups */}
      <div className="space-y-2">
        {groups.map((group) => (
          <CategoryNode key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
