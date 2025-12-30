'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  mockTasks,
  mockProjects,
  mockIssues,
} from '@/components/shared/mock-data';
import { AppLayout, Pagination, SearchAndFilter } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListTodo, Plus, Calendar, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { TaskStatus } from '@/types/task';
import { format } from 'date-fns';

export default function ProjectTasksPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number.parseInt(params.id as string);
  const project = mockProjects.find((p) => p.id === projectId);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter tasks by project ID
  const projectTasks = useMemo(() => {
    return mockTasks.filter((task) => task.projectId === projectId);
  }, [projectId]);

  // Filter tasks by search and status
  const filteredTasks = useMemo(() => {
    return projectTasks.filter((task) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchLower) ||
        task.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

      const matchesStatus =
        statusFilter === 'all' || task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, projectTasks]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  // Clamp current page to valid range
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Statistics
  const totalTasks = projectTasks.length;
  const upcomingTasks = projectTasks.filter(
    (t) => t.status === TaskStatus.upcoming
  ).length;
  const onGoingTasks = projectTasks.filter(
    (t) => t.status === TaskStatus.onGoing
  ).length;
  const completedTasks = projectTasks.filter(
    (t) => t.status === TaskStatus.completed
  ).length;

  const hasActiveFilters = Boolean(searchQuery || statusFilter !== 'all');

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const getStatusColor = (status: TaskStatus) => {
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
  };

  const getStatusLabel = (status: TaskStatus) => {
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
  };

  if (!project) {
    return (
      <AppLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                Project not found
              </p>
              <Link href="/users/dashboard/projects">
                <Button className="mt-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Projects
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Tasks - {project.projectName}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Manage and track tasks for this project
            </p>
          </div>
          <Link href={`/users/dashboard/projects/${projectId}/tasks/new`}>
            <Button className="mt-4 md:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <ListTodo className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalTasks}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Upcoming</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900/20">
                  <ListTodo className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {upcomingTasks}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>On Going</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <ListTodo className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {onGoingTasks}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <ListTodo className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {completedTasks}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <SearchAndFilter
          variant="card"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search tasks..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={[
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
              onChange: setStatusFilter,
            },
          ]}
        />

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredTasks.length)} of {filteredTasks.length}{' '}
            tasks
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Rows per page:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
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

        {/* Tasks Table */}
        {filteredTasks.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
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
                    const taskIssues = mockIssues.filter((issue) =>
                      task.issues?.some((i) => i.id === issue.id)
                    );
                    const openIssuesCount = taskIssues.filter(
                      (i) => i.status !== 'closed' && i.status !== 'resolved'
                    ).length;

                    return (
                      <TableRow
                        key={task.id}
                        onClick={() =>
                          router.push(
                            `/dashboard/projects/${projectId}/tasks/${task.id}`
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
                                {task.tags.slice(0, 2).map((tag, index) => (
                                  <Badge
                                    key={index}
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
                        <TableCell>
                          {task.assignees && task.assignees.length > 0 ? (
                            <div className="flex items-center -space-x-2">
                              {task.assignees
                                .slice(0, 3)
                                .map((assignee, index) => {
                                  return (
                                    <div
                                      key={index}
                                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-linear-to-br from-blue-500 to-blue-600 dark:border-zinc-900"
                                      title={assignee.memberName}
                                    >
                                      <span className="text-xs font-medium text-white">
                                        {assignee.memberName?.charAt(0) || '?'}
                                      </span>
                                    </div>
                                  );
                                })}
                              {task.assignees.length > 3 && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-zinc-200 dark:border-zinc-900 dark:bg-zinc-700">
                                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                    +{task.assignees.length - 3}
                                  </span>
                                </div>
                              )}
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
                            <span className="text-sm text-zinc-400">-</span>
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

            {/* Pagination Controls */}
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
                  : 'Get started by creating your first task for this project'}
              </p>
              {!hasActiveFilters && (
                <Link href={`/users/dashboard/projects/${projectId}/tasks/new`}>
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
    </AppLayout>
  );
}
