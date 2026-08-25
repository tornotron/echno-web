'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Checkbox } from '@/components/shadcn/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Plus, AlertCircle, Calendar, ListTodo, Search } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import Link from 'next/link';
import { format } from 'date-fns';
import { Task, TaskStatus } from '@tornotron/echno-core/task/types';
import { Project } from '@tornotron/echno-core/project/types';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';
import { routes } from '@/nav';
import { usePrefetchTask } from '@tornotron/echno-core/task/hooks';
import { TaskStatsCard } from './task-stats-card';

interface TasksListProps {
  tasks: Task[];
  projects: Project[];
}

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.upcoming: {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
    case TaskStatus.onGoing: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case TaskStatus.completed: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case TaskStatus.onHold: {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
}

function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.upcoming: {
      return 'Upcoming';
    }
    case TaskStatus.onGoing: {
      return 'On Going';
    }
    case TaskStatus.completed: {
      return 'Completed';
    }
    case TaskStatus.onHold: {
      return 'On Hold';
    }
    default: {
      return status;
    }
  }
}

export function TasksList({ tasks, projects }: TasksListProps) {
  const router = useRouter();
  const prefetchTask = usePrefetchTask();

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const selectedProjectId =
    projectFilter === 'all' ? undefined : Number(projectFilter);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesProject =
        !selectedProjectId || task.projectId === selectedProjectId;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchLower) ||
        task.tags?.some((tag) => tag.toLowerCase().includes(searchLower));
      const matchesStatus =
        statusFilter === 'all' || task.status === statusFilter;
      return matchesProject && matchesSearch && matchesStatus;
    });
  }, [tasks, selectedProjectId, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedTasks = filteredTasks.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTasks.length);

  const isAllSelected =
    paginatedTasks.length > 0 &&
    paginatedTasks.every((t) => selectedIds.includes(t.id));
  const isSomeSelected =
    !isAllSelected && paginatedTasks.some((t) => selectedIds.includes(t.id));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? paginatedTasks.map((t) => t.id) : []);
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.projectName])),
    [projects]
  );

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'all' || projectFilter !== 'all'
  );

  const totalTasks = filteredTasks.length;
  const upcomingTasks = filteredTasks.filter(
    (t) => t.status === TaskStatus.upcoming
  ).length;
  const onGoingTasks = filteredTasks.filter(
    (t) => t.status === TaskStatus.onGoing
  ).length;
  const completedTasks = filteredTasks.filter(
    (t) => t.status === TaskStatus.completed
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <TaskStatsCard
        totalTasks={totalTasks}
        upcomingTasks={upcomingTasks}
        onGoingTasks={onGoingTasks}
        completedTasks={completedTasks}
        totalDescription="across all projects"
      />

      {/* ── Desktop Table (md+) ─────────────────────────────────────── */}
      <Card className="hidden md:block">
        <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-1">
          {/* Project select */}
          <Select
            value={projectFilter}
            onValueChange={(v) => {
              setProjectFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search tasks…"
              className="h-8 pl-8 text-sm"
            />
          </div>

          {/* Status */}
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={TaskStatus.upcoming}>Upcoming</SelectItem>
              <SelectItem value={TaskStatus.onGoing}>On Going</SelectItem>
              <SelectItem value={TaskStatus.completed}>Completed</SelectItem>
              <SelectItem value={TaskStatus.onHold}>On Hold</SelectItem>
            </SelectContent>
          </Select>

          {/* Rows per page */}
          <div className="ml-auto flex items-center gap-2 border-l pl-3">
            <span className="text-xs whitespace-nowrap text-zinc-500">
              Rows per page
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => {
                setItemsPerPage(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Task — only visible when a project is selected */}
          {selectedProjectId && (
            <Button asChild size="sm">
              <Link
                href={
                  routes.projects.allProjects.detail(
                    selectedProjectId
                  ).tasks.new
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Link>
            </Button>
          )}
        </CardHeader>

        {paginatedTasks.length > 0 ? (
          <>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 pl-5">
                      <Checkbox
                        checked={
                          isSomeSelected ? 'indeterminate' : isAllSelected
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Task</TableHead>
                    {!selectedProjectId && <TableHead>Project</TableHead>}
                    <TableHead>Assignees</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.map((task) => {
                    const taskIssues = task.issues || [];
                    const openIssuesCount = taskIssues.filter(
                      (i) => i.status !== 'closed' && i.status !== 'resolved'
                    ).length;

                    return (
                      <TableRow
                        key={task.id}
                        onClick={() =>
                          router.push(
                            routes.projects.allProjects
                              .detail(task.projectId)
                              .tasks.detail(task.id).href
                          )
                        }
                        onMouseEnter={() => prefetchTask(task.id)}
                        onFocus={() => prefetchTask(task.id)}
                        className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <TableCell
                          className="pl-5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedIds.includes(task.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(task.id, checked as boolean)
                            }
                            aria-label={`Select ${task.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {task.title}
                            </p>
                            {task.tags && task.tags.length > 0 && (
                              <div className="mt-1 flex gap-1">
                                {task.tags.slice(0, 2).map((tag, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {task.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{task.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {!selectedProjectId && (
                          <TableCell>
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {projectMap.get(task.projectId) ?? '—'}
                            </span>
                          </TableCell>
                        )}

                        <TableCell>
                          {task.assignees && task.assignees.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {task.assignees
                                  .slice(0, 3)
                                  .map((assignee, i) => (
                                    <EmployeeAvatar
                                      key={i}
                                      employee={assignee}
                                      size="sm"
                                      className="!size-8 ring-2 ring-white dark:ring-zinc-900"
                                    />
                                  ))}
                                {task.assignees.length > 3 && (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 ring-2 ring-white dark:bg-zinc-700 dark:ring-zinc-900">
                                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                      +{task.assignees.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                {task.assignees.length === 1
                                  ? task.assignees[0].name
                                  : `${task.assignees[0].name} +${task.assignees.length - 1}`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-400">
                              Unassigned
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {task.category?.name || 'N/A'}
                          </span>
                        </TableCell>

                        <TableCell>
                          {task.endDate ? (
                            <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                              <Calendar className="h-3 w-3" />
                              <span>{format(task.endDate, 'MMM d, yyyy')}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-400">
                              No due date
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                              <div
                                className="h-full bg-blue-600 dark:bg-blue-500"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">
                              {task.progress}%
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {taskIssues.length > 0 ? (
                            <div className="flex items-center space-x-1">
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                {taskIssues.length}
                              </span>
                              {openIssuesCount > 0 && (
                                <Badge
                                  variant="outline"
                                  className="bg-red-50 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                >
                                  {openIssuesCount} open
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-400">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            {getStatusLabel(task.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
            <div className="flex items-center justify-between border-t px-4 py-2">
              <span className="text-sm text-zinc-500">
                {filteredTasks.length === 0 ? 0 : startIndex + 1}–{endIndex} of{' '}
                {filteredTasks.length} tasks
              </span>
              <Pagination
                currentPage={validCurrentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <CardContent>
            <Empty variant="inline">
              <EmptyMedia variant="icon">
                <ListTodo className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No tasks found</EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? 'Try adjusting your search or filters'
                    : 'No tasks exist yet across your projects'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        )}
      </Card>

      {/* ── Mobile (<md) ────────────────────────────────────────────── */}
      <div className="md:hidden">
        {/* Mobile filter bar */}
        <div className="mb-3 space-y-2">
          <Select
            value={projectFilter}
            onValueChange={(v) => {
              setProjectFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search tasks…"
                className="h-8 pl-8 text-sm"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={TaskStatus.upcoming}>Upcoming</SelectItem>
                <SelectItem value={TaskStatus.onGoing}>On Going</SelectItem>
                <SelectItem value={TaskStatus.completed}>Completed</SelectItem>
                <SelectItem value={TaskStatus.onHold}>On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {paginatedTasks.length > 0 ? (
          <>
            <div className="flex flex-col gap-3">
              {paginatedTasks.map((task) => {
                const taskIssues = task.issues || [];
                const openIssuesCount = taskIssues.filter(
                  (i) => i.status !== 'closed' && i.status !== 'resolved'
                ).length;

                return (
                  <Card
                    key={task.id}
                    className="cursor-pointer transition-shadow hover:shadow-md active:opacity-80"
                    onClick={() =>
                      router.push(
                        routes.projects.allProjects
                          .detail(task.projectId)
                          .tasks.detail(task.id).href
                      )
                    }
                    onMouseEnter={() => prefetchTask(task.id)}
                    onFocus={() => prefetchTask(task.id)}
                  >
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="text-sm leading-snug font-medium text-zinc-900 dark:text-zinc-100">
                          {task.title}
                        </p>
                        <Badge
                          className={`shrink-0 ${getStatusColor(task.status)}`}
                        >
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>

                      {!selectedProjectId && (
                        <p className="mb-2 text-xs text-zinc-400">
                          {projectMap.get(task.projectId) ?? '—'}
                        </p>
                      )}

                      {task.tags && task.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {task.tags.slice(0, 3).map((tag, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{task.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div
                          className="h-full bg-blue-600 dark:bg-blue-500"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {task.endDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(task.endDate, 'MMM d, yyyy')}
                          </span>
                        )}
                        {task.category?.name && (
                          <span>{task.category.name}</span>
                        )}
                        {taskIssues.length > 0 && (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            {taskIssues.length} issue
                            {taskIssues.length === 1 ? '' : 's'}
                            {openIssuesCount > 0 && (
                              <span className="font-medium text-red-600 dark:text-red-400">
                                ({openIssuesCount} open)
                              </span>
                            )}
                          </span>
                        )}
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {task.progress}%
                        </span>
                      </div>

                      {task.assignees && task.assignees.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                            {task.assignees.slice(0, 4).map((assignee, i) => (
                              <EmployeeAvatar
                                key={i}
                                employee={assignee}
                                size="sm"
                                className="!size-6 ring-2 ring-white dark:ring-zinc-900"
                              />
                            ))}
                            {task.assignees.length > 4 && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-medium text-zinc-600 ring-2 ring-white dark:bg-zinc-700 dark:text-zinc-400 dark:ring-zinc-900">
                                +{task.assignees.length - 4}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {task.assignees.length === 1
                              ? task.assignees[0].name
                              : `${task.assignees[0].name} +${task.assignees.length - 1}`}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <Pagination
              currentPage={validCurrentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <Empty variant="default">
            <EmptyMedia variant="icon">
              <ListTodo className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No tasks found</EmptyTitle>
              <EmptyDescription>
                {hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'No tasks exist yet across your projects'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}
