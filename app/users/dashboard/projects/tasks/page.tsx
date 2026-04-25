'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTasks } from '@/hooks/task';
import { useProjects } from '@/hooks/project/use-projects';
import { SearchAndFilter } from '@/components/common';
import { Pagination } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ListTodo, Plus, AlertCircle, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { TaskStatus } from '@/types/task';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';

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

export default function AllTasksPage() {
  const router = useRouter();
  const { data: allTasks = [], isLoading: isTasksLoading } = useTasks();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isLoading = isTasksLoading || isProjectsLoading;

  const selectedProjectId =
    projectFilter === 'all' ? undefined : Number(projectFilter);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
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
  }, [allTasks, selectedProjectId, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedTasks = filteredTasks.slice(
    startIndex,
    startIndex + itemsPerPage
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

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'all' || projectFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setProjectFilter('all');
    setCurrentPage(1);
  };

  const projectMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p.projectName]));
  }, [projects]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Tasks
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            View and manage tasks across all projects
          </p>
        </div>
        {selectedProjectId && (
          <Link
            href={`/users/dashboard/projects/${selectedProjectId}/tasks/new`}
          >
            <Button className="mt-4 md:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </Link>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(
          [
            {
              label: 'Total Tasks',
              count: totalTasks,
              color: 'blue',
              filter: 'all',
            },
            {
              label: 'Upcoming',
              count: upcomingTasks,
              color: 'gray',
              filter: TaskStatus.upcoming,
            },
            {
              label: 'On Going',
              count: onGoingTasks,
              color: 'blue',
              filter: TaskStatus.onGoing,
            },
            {
              label: 'Completed',
              count: completedTasks,
              color: 'green',
              filter: TaskStatus.completed,
            },
          ] as const
        ).map(({ label, count, color, filter }) => {
          const isActive = statusFilter === filter;
          const colorClasses = {
            blue: {
              bg: 'bg-blue-100 dark:bg-blue-900/20',
              text: 'text-blue-600 dark:text-blue-400',
            },
            gray: {
              bg: 'bg-gray-100 dark:bg-gray-900/20',
              text: 'text-gray-600 dark:text-gray-400',
            },
            green: {
              bg: 'bg-green-100 dark:bg-green-900/20',
              text: 'text-green-600 dark:text-green-400',
            },
          } satisfies Record<string, { bg: string; text: string }>;
          const classes = colorClasses[color];
          return (
            <Card
              key={label}
              className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-primary ring-2' : ''}`}
              onClick={() => {
                setStatusFilter(isActive ? 'all' : filter);
                setCurrentPage(1);
              }}
            >
              <CardHeader className="pb-3">
                <CardDescription>{label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${classes.bg}`}
                  >
                    <ListTodo className={`h-6 w-6 ${classes.text}`} />
                  </div>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {count}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search tasks..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'All Projects',
            options: [
              { value: 'all', label: 'All Projects' },
              ...projects.map((p) => ({
                value: p.id.toString(),
                label: p.projectName,
              })),
            ],
            value: projectFilter,
            onChange: (v) => {
              setProjectFilter(v);
              setCurrentPage(1);
            },
            width: 'w-full sm:w-[220px]',
          },
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
              { value: TaskStatus.upcoming, label: 'Upcoming' },
              { value: TaskStatus.onGoing, label: 'On Going' },
              { value: TaskStatus.completed, label: 'Completed' },
              { value: TaskStatus.onHold, label: 'On Hold' },
            ],
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results summary + rows per page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {filteredTasks.length === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(startIndex + itemsPerPage, filteredTasks.length)} of{' '}
          {filteredTasks.length} tasks
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table or empty state */}
      {paginatedTasks.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
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
                          `/users/dashboard/projects/${task.projectId}/tasks/${task.id}`
                        )
                      }
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
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
                              {task.assignees.slice(0, 3).map((assignee, i) => (
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
          <Pagination
            currentPage={validCurrentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ListTodo className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              No tasks found
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'No tasks exist yet across your projects'}
            </p>
            {selectedProjectId && !hasActiveFilters && (
              <Link
                href={`/users/dashboard/projects/${selectedProjectId}/tasks/new`}
              >
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
