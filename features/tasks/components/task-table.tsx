'use client';

import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { AlertCircle, Calendar, ListTodo, Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Task } from '@/types/task/task';
import { TaskStatus } from '@/types/task/task-status';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// TaskTable
// ---------------------------------------------------------------------------

interface TaskTableProps {
  paginatedTasks: Task[];
  filteredTasksCount: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onItemsPerPageChange: (n: number) => void;
  projectId: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
}

export function TaskTable({
  paginatedTasks,
  filteredTasksCount,
  startIndex,
  endIndex,
  itemsPerPage,
  onItemsPerPageChange,
  projectId,
  currentPage,
  totalPages,
  onPageChange,
  hasActiveFilters,
}: TaskTableProps) {
  const router = useRouter();

  return (
    <>
      {/* Results summary + rows per page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {filteredTasksCount === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(endIndex, filteredTasksCount)} of {filteredTasksCount} tasks
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
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
                          `/users/dashboard/projects/${projectId}/tasks/${task.id}`
                        )
                      }
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      {/* Title + tags */}
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

                      {/* Assignees avatar stack */}
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

                      {/* Category */}
                      <TableCell>
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {task.category?.name || 'N/A'}
                        </span>
                      </TableCell>

                      {/* Due date */}
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

                      {/* Progress bar */}
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

                      {/* Issues */}
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

                      {/* Status badge */}
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
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
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
    </>
  );
}
