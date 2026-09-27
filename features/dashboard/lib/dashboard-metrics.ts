/**
 * Figures for the Home dashboard, worked out from records the organization
 * actually holds. Every function here returns an empty result for an empty
 * input, so a new organization sees an empty state and never a sample figure.
 */
import {
  ProjectStatus,
  getProjectStatusLabel,
  type Project,
} from '@tornotron/echno-core/project/types';
import {
  TaskStatus,
  getTaskStatusLabel,
  type Task,
} from '@tornotron/echno-core/task/types';
import {
  IssuePriority,
  IssueStatus,
  getIssuePriorityLabel,
  type Issue,
} from '@tornotron/echno-core/issue/types';
import {
  LeaveStatus,
  type LeaveRequest,
} from '@tornotron/echno-core/leave/types';
import type { AccountLine } from '@tornotron/echno-core/finance/types';

/** One labelled count or amount, the unit every breakdown widget renders. */
export interface BreakdownItem {
  key: string;
  label: string;
  value: number;
}

const OPEN_ISSUE_STATUSES = new Set<IssueStatus>([
  IssueStatus.open,
  IssueStatus.inProgress,
  IssueStatus.pending,
  IssueStatus.inReview,
  IssueStatus.blocked,
  IssueStatus.reOpened,
]);

const RESOLVED_ISSUE_STATUSES = new Set<IssueStatus>([
  IssueStatus.resolved,
  IssueStatus.closed,
]);

/** Whether an issue still needs work (anything short of resolved or closed). */
export function isOpenIssue(issue: Pick<Issue, 'status'>): boolean {
  return OPEN_ISSUE_STATUSES.has(issue.status);
}

/** Counts items by a key, keeps only non-zero groups, largest first. */
function countBy<T, K extends string>(
  items: readonly T[],
  keyOf: (item: T) => K | undefined,
  labelOf: (key: K) => string
): BreakdownItem[] {
  const counts = new Map<K, number>();
  for (const item of items) {
    const key = keyOf(item);
    if (key === undefined) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, value]) => ({ key, label: labelOf(key), value }))
    .toSorted((a, b) => b.value - a.value);
}

export function projectsByStatus(
  projects: readonly Project[]
): BreakdownItem[] {
  return countBy(projects, (p) => p.status, getProjectStatusLabel);
}

export function tasksByStatus(tasks: readonly Task[]): BreakdownItem[] {
  return countBy(tasks, (t) => t.status, getTaskStatusLabel);
}

/** Open issues grouped by priority. An issue with no priority is left out. */
export function openIssuesByPriority(
  issues: readonly Issue[]
): BreakdownItem[] {
  return countBy(
    issues.filter((i) => isOpenIssue(i)),
    (i) => i.priority,
    getIssuePriorityLabel
  );
}

export interface ProjectCounts {
  active: number;
  upcoming: number;
  onHold: number;
  completed: number;
}

export function projectCounts(projects: readonly Project[]): ProjectCounts {
  const count = (...statuses: ProjectStatus[]) =>
    projects.filter((p) => statuses.includes(p.status)).length;
  return {
    active: count(ProjectStatus.open, ProjectStatus.approved),
    upcoming: count(ProjectStatus.upcoming),
    onHold: count(ProjectStatus.onHold),
    completed: count(ProjectStatus.completed, ProjectStatus.closed),
  };
}

function time(date: Date | undefined): number {
  return date instanceof Date && !Number.isNaN(date.getTime())
    ? date.getTime()
    : 0;
}

/** The most recently created projects, newest first. */
export function recentProjects(
  projects: readonly Project[],
  limit = 5
): Project[] {
  return projects
    .toSorted(
      (a, b) =>
        time(b.createdAt ?? b.startDate) - time(a.createdAt ?? a.startDate)
    )
    .slice(0, limit);
}

export interface TaskIssueMetrics {
  completedTasks: number;
  ongoingTasks: number;
  openCriticalIssues: number;
  /** Share of issues resolved or closed, 0 to 100. Absent when there are no issues. */
  resolutionRate?: number;
}

export function taskIssueMetrics(
  tasks: readonly Task[],
  issues: readonly Issue[]
): TaskIssueMetrics {
  const resolved = issues.filter((i) =>
    RESOLVED_ISSUE_STATUSES.has(i.status)
  ).length;
  return {
    completedTasks: tasks.filter((t) => t.status === TaskStatus.completed)
      .length,
    ongoingTasks: tasks.filter((t) => t.status === TaskStatus.onGoing).length,
    openCriticalIssues: issues.filter(
      (i) => isOpenIssue(i) && i.priority === IssuePriority.critical
    ).length,
    resolutionRate:
      issues.length === 0
        ? undefined
        : Math.round((resolved / issues.length) * 100),
  };
}

export type AttentionItem =
  | { kind: 'task'; id: number; title: string; reason: string; dueAt: number }
  | { kind: 'issue'; id: number; title: string; reason: string; dueAt: number };

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
}

/**
 * Tasks past their end date and not completed, then open high or critical
 * issues, oldest first within each group.
 */
export function itemsNeedingAttention(
  tasks: readonly Task[],
  issues: readonly Issue[],
  today: Date = new Date(),
  limit = 6
): AttentionItem[] {
  const todayStart = startOfDay(today);
  const overdue: AttentionItem[] = tasks
    .filter(
      (t) =>
        t.status !== TaskStatus.completed &&
        t.endDate instanceof Date &&
        time(t.endDate) > 0 &&
        time(t.endDate) < todayStart
    )
    .map((t) => ({
      kind: 'task' as const,
      id: t.id,
      title: t.title,
      reason: 'Overdue task',
      dueAt: time(t.endDate),
    }))
    .toSorted((a, b) => a.dueAt - b.dueAt);

  const urgent: AttentionItem[] = issues
    .filter(
      (i) =>
        isOpenIssue(i) &&
        (i.priority === IssuePriority.critical ||
          i.priority === IssuePriority.high)
    )
    .map((i) => ({
      kind: 'issue' as const,
      id: i.id,
      title: i.title,
      reason: `${getIssuePriorityLabel(i.priority as IssuePriority)} priority issue`,
      dueAt: time(i.createdAt),
    }))
    .toSorted((a, b) => a.dueAt - b.dueAt);

  return [...overdue, ...urgent].slice(0, limit);
}

/** A `YYYY-MM-DD` date in local time, the form the finance reports take. */
export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface DateRange {
  from: string;
  to: string;
}

/**
 * The report windows the dashboard reads: this month to date, the whole of
 * last month, and the last six months (this one included) to date.
 */
export function reportRanges(today: Date = new Date()): {
  thisMonth: DateRange;
  lastMonth: DateRange;
  lastSixMonths: DateRange;
} {
  const y = today.getFullYear();
  const m = today.getMonth();
  return {
    thisMonth: { from: isoDate(new Date(y, m, 1)), to: isoDate(today) },
    lastMonth: {
      from: isoDate(new Date(y, m - 1, 1)),
      to: isoDate(new Date(y, m, 0)),
    },
    lastSixMonths: { from: isoDate(new Date(y, m - 5, 1)), to: isoDate(today) },
  };
}

/**
 * Month-on-month change in percent, rounded to one decimal. Absent when the
 * earlier figure is zero or missing, because a change from nothing is not a
 * percentage anyone can read.
 */
export function percentChange(
  current: number | undefined,
  previous: number | undefined
): number | undefined {
  if (current === undefined || previous === undefined || previous === 0) {
    return undefined;
  }
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

/** Expense accounts with a non-zero amount, largest first. */
export function expenseBreakdown(
  lines: readonly AccountLine[]
): BreakdownItem[] {
  return lines
    .filter((l) => Number.isFinite(l.amount) && l.amount !== 0)
    .map((l) => ({
      key: l.accountCode || l.accountName,
      label: l.accountName || l.accountCode || 'Unnamed account',
      value: l.amount,
    }))
    .toSorted((a, b) => b.value - a.value);
}

/** Days of approved leave grouped by leave type. */
export function leaveDaysByType(
  requests: readonly LeaveRequest[]
): BreakdownItem[] {
  const days = new Map<string, number>();
  for (const r of requests) {
    if (r.status !== LeaveStatus.APPROVED) continue;
    const type = r.leaveTypeName?.trim() || 'Other';
    days.set(type, (days.get(type) ?? 0) + (r.totalDays || 0));
  }
  return [...days.entries()]
    .filter(([, value]) => value > 0)
    .map(([label, value]) => ({ key: label, label, value }))
    .toSorted((a, b) => b.value - a.value);
}

/** The newest leave requests that were actually submitted (drafts left out). */
export function recentLeaveRequests(
  requests: readonly LeaveRequest[],
  limit = 5
): LeaveRequest[] {
  return requests
    .filter((r) => r.status !== LeaveStatus.DRAFT)
    .toSorted(
      (a, b) =>
        time(b.submittedAt ?? b.createdAt ?? b.startDate) -
        time(a.submittedAt ?? a.createdAt ?? a.startDate)
    )
    .slice(0, limit);
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** A rupee amount, compact (₹6.2L, ₹1.5Cr) from a lakh upward. */
export function formatRupeesShort(amount: number): string {
  return Math.abs(amount) >= 100_000
    ? inrCompact.format(amount)
    : inr.format(amount);
}

export function formatRupeesFull(amount: number): string {
  return inr.format(amount);
}
