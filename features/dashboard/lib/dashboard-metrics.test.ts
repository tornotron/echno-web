import { describe, expect, test } from 'bun:test';
import {
  ProjectStatus,
  type Project,
} from '@tornotron/echno-core/project/types';
import { TaskStatus, type Task } from '@tornotron/echno-core/task/types';
import {
  IssuePriority,
  IssueStatus,
  type Issue,
} from '@tornotron/echno-core/issue/types';
import {
  LeaveStatus,
  type LeaveRequest,
} from '@tornotron/echno-core/leave/types';
import {
  expenseBreakdown,
  formatRupeesFull,
  formatRupeesShort,
  itemsNeedingAttention,
  leaveDaysByType,
  openIssuesByPriority,
  percentChange,
  projectCounts,
  projectsByStatus,
  recentLeaveRequests,
  recentProjects,
  reportRanges,
  taskIssueMetrics,
  tasksByStatus,
} from './dashboard-metrics';

const project = (id: number, status: ProjectStatus, createdAt?: string) =>
  ({
    id,
    projectName: `P${id}`,
    status,
    progress: 0,
    createdAt: createdAt ? new Date(createdAt) : undefined,
  }) as unknown as Project;

const task = (id: number, status: TaskStatus, endDate?: string) =>
  ({
    id,
    title: `T${id}`,
    status,
    progress: 0,
    endDate: endDate ? new Date(endDate) : undefined,
  }) as unknown as Task;

const issue = (id: number, status: IssueStatus, priority?: IssuePriority) =>
  ({
    id,
    title: `I${id}`,
    status,
    priority,
    createdAt: new Date('2026-09-01'),
  }) as unknown as Issue;

describe('an organization with no records', () => {
  // A brand-new organization must see empty widgets, never sample figures.
  test('every breakdown and list is empty', () => {
    expect(projectsByStatus([])).toEqual([]);
    expect(tasksByStatus([])).toEqual([]);
    expect(openIssuesByPriority([])).toEqual([]);
    expect(recentProjects([])).toEqual([]);
    expect(itemsNeedingAttention([], [])).toEqual([]);
    expect(expenseBreakdown([])).toEqual([]);
    expect(leaveDaysByType([])).toEqual([]);
    expect(recentLeaveRequests([])).toEqual([]);
  });

  test('counts are zero and the resolution rate is absent', () => {
    expect(projectCounts([])).toEqual({
      active: 0,
      upcoming: 0,
      onHold: 0,
      completed: 0,
    });
    expect(taskIssueMetrics([], [])).toEqual({
      completedTasks: 0,
      ongoingTasks: 0,
      openCriticalIssues: 0,
      resolutionRate: undefined,
    });
  });

  test('a change from nothing is not a percentage', () => {
    expect(percentChange(0, 0)).toBeUndefined();
    expect(percentChange(5000, 0)).toBeUndefined();
    expect(percentChange(undefined, 100)).toBeUndefined();
  });
});

describe('figures from real records', () => {
  test('projects are counted by status and stage', () => {
    const projects = [
      project(1, ProjectStatus.open),
      project(2, ProjectStatus.open),
      project(3, ProjectStatus.upcoming),
      project(4, ProjectStatus.completed),
    ];
    expect(projectsByStatus(projects)[0]).toMatchObject({
      key: ProjectStatus.open,
      value: 2,
    });
    expect(projectCounts(projects)).toEqual({
      active: 2,
      upcoming: 1,
      onHold: 0,
      completed: 1,
    });
  });

  test('recent projects are newest first', () => {
    const ids = recentProjects([
      project(1, ProjectStatus.open, '2026-01-01'),
      project(2, ProjectStatus.open, '2026-06-01'),
      project(3, ProjectStatus.open, '2026-03-01'),
    ]).map((p) => p.id);
    expect(ids).toEqual([2, 3, 1]);
  });

  test('only open issues with a priority are grouped', () => {
    const groups = openIssuesByPriority([
      issue(1, IssueStatus.open, IssuePriority.high),
      issue(2, IssueStatus.resolved, IssuePriority.high),
      issue(3, IssueStatus.inProgress, IssuePriority.critical),
      issue(4, IssueStatus.open),
    ]);
    expect(groups.map((g) => [g.key, g.value])).toEqual([
      [IssuePriority.high, 1],
      [IssuePriority.critical, 1],
    ]);
  });

  test('overdue tasks come before urgent issues', () => {
    const items = itemsNeedingAttention(
      [
        task(1, TaskStatus.onGoing, '2026-09-01'),
        task(2, TaskStatus.completed, '2026-09-01'),
        task(3, TaskStatus.onGoing, '2026-12-01'),
      ],
      [
        issue(9, IssueStatus.open, IssuePriority.critical),
        issue(10, IssueStatus.open, IssuePriority.low),
      ],
      new Date('2026-09-27T10:00:00')
    );
    expect(items.map((i) => `${i.kind}-${i.id}`)).toEqual([
      'task-1',
      'issue-9',
    ]);
  });

  test('resolution rate counts resolved and closed issues', () => {
    const m = taskIssueMetrics(
      [task(1, TaskStatus.completed), task(2, TaskStatus.onGoing)],
      [
        issue(1, IssueStatus.resolved),
        issue(2, IssueStatus.closed),
        issue(3, IssueStatus.open, IssuePriority.critical),
        issue(4, IssueStatus.open),
      ]
    );
    expect(m).toEqual({
      completedTasks: 1,
      ongoingTasks: 1,
      openCriticalIssues: 1,
      resolutionRate: 50,
    });
  });

  test('expense accounts drop zero lines and sort by amount', () => {
    const items = expenseBreakdown([
      { accountCode: '5100', accountName: 'Materials', amount: 1000 },
      { accountCode: '5200', accountName: 'Labour', amount: 4000 },
      { accountCode: '5300', accountName: 'Rent', amount: 0 },
    ]);
    expect(items.map((i) => i.label)).toEqual(['Labour', 'Materials']);
  });

  test('leave days total approved requests by type', () => {
    const req = (
      id: number,
      status: LeaveStatus,
      leaveTypeName: string,
      totalDays: number
    ) =>
      ({
        id,
        status,
        leaveTypeName,
        totalDays,
        startDate: new Date('2026-09-01'),
      }) as unknown as LeaveRequest;
    const byType = leaveDaysByType([
      req(1, LeaveStatus.APPROVED, 'Casual', 2),
      req(2, LeaveStatus.APPROVED, 'Casual', 1),
      req(3, LeaveStatus.REJECTED, 'Sick', 4),
      req(4, LeaveStatus.APPROVED, 'Sick', 1),
    ]);
    expect(byType.map((b) => [b.label, b.value])).toEqual([
      ['Casual', 3],
      ['Sick', 1],
    ]);
    expect(
      recentLeaveRequests([req(5, LeaveStatus.DRAFT, 'Casual', 1)])
    ).toEqual([]);
  });

  test('month-on-month change is rounded to one decimal', () => {
    expect(percentChange(105, 100)).toBe(5);
    expect(percentChange(90, 120)).toBe(-25);
  });
});

describe('report windows and money', () => {
  test('windows cover this month, last month and six months', () => {
    expect(reportRanges(new Date(2026, 0, 15))).toEqual({
      thisMonth: { from: '2026-01-01', to: '2026-01-15' },
      lastMonth: { from: '2025-12-01', to: '2025-12-31' },
      lastSixMonths: { from: '2025-08-01', to: '2026-01-15' },
    });
  });

  test('amounts are in rupees, never dollars', () => {
    expect(formatRupeesFull(0)).toBe('₹0');
    expect(formatRupeesShort(45_000)).toBe('₹45,000');
    expect(formatRupeesShort(620_000)).toBe('₹6.2L');
    expect(formatRupeesShort(15_000_000)).toBe('₹1.5Cr');
    expect(formatRupeesShort(620_000)).not.toContain('$');
  });
});
