'use client';

import { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  Circle,
  AlertTriangle,
  Cloud,
  FileText,
  GitMerge,
  Hammer,
  HelpCircle,
  Package,
  Palette,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { Task, TaskStatus, getTaskStatusLabel } from '@/types/task';
import { Badge } from '@/components/shadcn/badge';
import { getIssueStatusLabel } from '@/types/issue';
import { IssueType } from '@/types/issue/issue-type';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/shadcn/avatar';
import { employeeInitials } from '@/components/shared/employee-avatar';
import { getAvatarColor } from '@/lib/utils/user-profile-utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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

function MiniAssignee({
  name,
  image,
  size = 'task',
}: {
  name: string;
  image?: string;
  size?: 'task' | 'issue';
}) {
  const initials = employeeInitials(name);
  const avatarColor = getAvatarColor(initials);
  const avatarSize = size === 'issue' ? 'size-4' : 'size-5';
  const initialsSize = size === 'issue' ? 'text-[8px]' : 'text-[9px]';

  return (
    <Avatar className={`${avatarSize} shrink-0`}>
      <AvatarImage src={image} alt={name} />
      <AvatarFallback
        className={`${initialsSize} leading-none font-semibold text-white ${avatarColor}`}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function IssueTypeIcon({ type }: { type: IssueType }) {
  const className = 'h-3.5 w-3.5 shrink-0';

  switch (type) {
    case IssueType.technical: {
      return <Wrench className={`${className} text-blue-500`} />;
    }
    case IssueType.design: {
      return <Palette className={`${className} text-purple-500`} />;
    }
    case IssueType.quality: {
      return <ShieldCheck className={`${className} text-emerald-500`} />;
    }
    case IssueType.safety: {
      return <AlertTriangle className={`${className} text-red-500`} />;
    }
    case IssueType.material: {
      return <Package className={`${className} text-amber-700`} />;
    }
    case IssueType.equipment: {
      return <Hammer className={`${className} text-slate-600`} />;
    }
    case IssueType.labour: {
      return <Users className={`${className} text-orange-500`} />;
    }
    case IssueType.weather: {
      return <Cloud className={`${className} text-cyan-500`} />;
    }
    case IssueType.permit: {
      return <FileText className={`${className} text-violet-600`} />;
    }
    case IssueType.coordination: {
      return <GitMerge className={`${className} text-indigo-500`} />;
    }
    default: {
      return <HelpCircle className={`${className} text-zinc-500`} />;
    }
  }
}

function TaskRow({
  task,
  issuesExpanded = false,
  onToggleIssues,
}: {
  task: Task;
  issuesExpanded?: boolean;
  onToggleIssues?: (taskKey: string) => void;
}) {
  const taskKey = String(task.id ?? task.title);
  const issues = task.issues ?? [];
  const primaryAssignee = task.assignees?.[0];
  const assigneeExtraCount = Math.max(0, (task.assignees?.length ?? 0) - 1);

  return (
    <div className="rounded-md">
      <div className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
        {issues.length > 0 ? (
          <button
            className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => onToggleIssues?.(taskKey)}
            type="button"
          >
            {issuesExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="h-4 w-4 shrink-0" />
        )}
        <Circle
          className={`h-2.5 w-2.5 shrink-0 fill-current ${statusDot(task.status)}`}
        />
        <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
          {task.title}
        </span>
        <div className="flex items-center gap-2">
          {primaryAssignee ? (
            <div className="hidden items-center gap-1.5 md:flex">
              <MiniAssignee
                image={primaryAssignee.profilePicture?.file}
                name={primaryAssignee.name}
              />
              <span className="max-w-24 truncate text-xs text-zinc-500">
                {primaryAssignee.name}
                {assigneeExtraCount > 0 ? ` +${assigneeExtraCount}` : ''}
              </span>
            </div>
          ) : (
            <span className="hidden text-xs text-zinc-400 md:inline">
              Unassigned
            </span>
          )}
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

      {issuesExpanded && issues.length > 0 && (
        <div className="space-y-1 pb-1 pl-10">
          {issues.map((issue, index) => (
            <div
              key={issue.id ?? `${task.id ?? task.title}-issue-${index}`}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
            >
              <IssueTypeIcon type={issue.type} />
              <span className="flex-1 truncate">
                {issue.title || 'Untitled issue'}
              </span>
              {issue.assignee ? (
                <div className="hidden items-center gap-1.5 md:flex">
                  <MiniAssignee
                    image={issue.assignee.profilePicture?.file}
                    name={issue.assignee.name}
                    size="issue"
                  />
                  <span className="max-w-24 truncate text-zinc-500">
                    {issue.assignee.name}
                  </span>
                </div>
              ) : (
                <span className="hidden text-zinc-400 md:inline">
                  Unassigned
                </span>
              )}
              <Badge variant="outline" className="text-[10px]">
                {getIssueStatusLabel(issue.status)}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryNode({
  group,
  expanded = true,
  expandedIssueTaskKeys,
  onToggleGroup,
  onToggleTaskIssues,
}: {
  group: CategoryGroup;
  expanded?: boolean;
  expandedIssueTaskKeys: Set<string>;
  onToggleGroup?: (groupId: string) => void;
  onToggleTaskIssues?: (taskKey: string) => void;
}) {
  const allCompleted = group.completedCount === group.tasks.length;
  let progressColor = 'bg-zinc-400';
  if (allCompleted) {
    progressColor = 'bg-green-500';
  } else if (group.totalProgress > 50) {
    progressColor = 'bg-blue-500';
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Category header */}
      <button
        onClick={() => onToggleGroup?.(group.id)}
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
            <TaskRow
              key={task.id ?? i}
              task={task}
              issuesExpanded={expandedIssueTaskKeys.has(
                String(task.id ?? task.title)
              )}
              onToggleIssues={onToggleTaskIssues}
            />
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
  const totalIssueCount = useMemo(
    () => tasks.reduce((sum, task) => sum + (task.issues?.length ?? 0), 0),
    [tasks]
  );

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === TaskStatus.completed
  ).length;
  const overallProgress =
    totalTasks > 0
      ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
      : 0;
  const estimatedTreeRows = groups.length + totalTasks + totalIssueCount;
  const shouldCollapseCategoriesByDefault = estimatedTreeRows > 40;
  const shouldExpandIssuesByDefault = false;
  const allGroupIds = useMemo(() => groups.map((group) => group.id), [groups]);
  const taskKeysWithIssues = useMemo(
    () =>
      tasks
        .filter((task) => (task.issues?.length ?? 0) > 0)
        .map((task) => String(task.id ?? task.title)),
    [tasks]
  );
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    () => (shouldCollapseCategoriesByDefault ? new Set() : new Set(allGroupIds))
  );
  const [expandedIssueTaskKeys, setExpandedIssueTaskKeys] = useState<
    Set<string>
  >(() =>
    shouldExpandIssuesByDefault ? new Set(taskKeysWithIssues) : new Set()
  );

  const toggleGroup = (groupId: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleTaskIssues = (taskKey: string) => {
    setExpandedIssueTaskKeys((prev) => {
      const next = new Set(prev);
      if (next.has(taskKey)) next.delete(taskKey);
      else next.add(taskKey);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategoryIds(new Set(allGroupIds));
    setExpandedIssueTaskKeys(new Set(taskKeysWithIssues));
  };

  const collapseAll = () => {
    setExpandedCategoryIds(new Set());
    setExpandedIssueTaskKeys(new Set());
  };

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
          <button
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={expandAll}
            type="button"
          >
            Expand all
          </button>
          <button
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={collapseAll}
            type="button"
          >
            Collapse all
          </button>
          <span className="text-xs text-zinc-500">
            {completedTasks}/{totalTasks} completed
          </span>
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {overallProgress}%
          </span>
        </div>
      </div>

      <ScrollArea className="h-[70vh] rounded-lg border border-zinc-200 dark:border-zinc-800">
        {/* Column headers */}
        <div className="bg-background sticky top-0 z-10 grid items-center border-b px-3 py-2 text-xs font-medium tracking-wide text-zinc-400 uppercase">
          <div className="flex items-center justify-end gap-3 pr-1">
            <span className="hidden w-28 text-center md:block">Assignee</span>
            <span className="hidden w-24 text-center sm:block">Progress</span>
            <span className="w-16 text-center">Status</span>
          </div>
        </div>

        {/* Category groups */}
        <div className="space-y-2 p-3">
          {groups.map((group) => (
            <CategoryNode
              key={group.id}
              group={group}
              expanded={expandedCategoryIds.has(group.id)}
              expandedIssueTaskKeys={expandedIssueTaskKeys}
              onToggleGroup={toggleGroup}
              onToggleTaskIssues={toggleTaskIssues}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
