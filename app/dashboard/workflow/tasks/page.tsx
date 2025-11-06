'use client';

import { useState, useMemo } from 'react';
import { mockTasks, mockProjects, mockUsers, mockIssues } from '@/lib/mock-data';
import { AppLayout, Pagination } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  ListTodo,
  Plus,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { TaskStatus } from '@/types/task';
import { format } from 'date-fns';

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return mockTasks.filter((task) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchLower) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchLower));

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesProject = projectFilter === 'all' || task.projectId === parseInt(projectFilter);

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [searchQuery, statusFilter, projectFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, projectFilter, itemsPerPage]);

  // Statistics
  const totalTasks = mockTasks.length;
  const upcomingTasks = mockTasks.filter((t) => t.status === TaskStatus.upcoming).length;
  const onGoingTasks = mockTasks.filter((t) => t.status === TaskStatus.onGoing).length;
  const completedTasks = mockTasks.filter((t) => t.status === TaskStatus.completed).length;

  const hasActiveFilters =
    searchQuery || statusFilter !== 'all' || projectFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setProjectFilter('all');
    setCurrentPage(1);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.upcoming:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case TaskStatus.onGoing:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case TaskStatus.completed:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case TaskStatus.onHold:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.upcoming:
        return 'Upcoming';
      case TaskStatus.onGoing:
        return 'On Going';
      case TaskStatus.completed:
        return 'Completed';
      case TaskStatus.onHold:
        return 'On Hold';
      default:
        return status;
    }
  };

  return (
    <AppLayout>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Tasks</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Manage and track project tasks</p>
          </div>
          <Link href="/dashboard/workflow/tasks/new">
            <Button className="mt-4 md:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
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
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-900/20 flex items-center justify-center">
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
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
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
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
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
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                <CardTitle>Search & Filters</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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

              {/* Project Filter */}
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {mockProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id!.toString()}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredTasks.length)} of{' '}
            {filteredTasks.length} tasks
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Rows per page:</span>
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
                    <TableHead>Project</TableHead>
                    <TableHead>Assignees</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.map((task) => {
                    const project = mockProjects.find((p) => p.id === task.projectId);
                    const taskIssues = mockIssues.filter((issue) => 
                      task.issues?.some((i) => i.id === issue.id)
                    );
                    const openIssuesCount = taskIssues.filter((i) => i.status !== 'closed' && i.status !== 'resolved').length;

                    return (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {task.title}
                            </p>
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {task.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
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
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {project?.projectName || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {task.assignees && task.assignees.length > 0 ? (
                            <div className="flex items-center -space-x-2">
                              {task.assignees.slice(0, 3).map((assignee, index) => {
                                return (
                                  <div
                                    key={index}
                                    className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-white dark:border-zinc-900"
                                    title={assignee.memberName}
                                  >
                                    <span className="text-xs text-white font-medium">
                                      {assignee.memberName?.charAt(0) || '?'}
                                    </span>
                                  </div>
                                );
                              })}
                              {task.assignees.length > 3 && (
                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center border-2 border-white dark:border-zinc-900">
                                  <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                                    +{task.assignees.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-400">Unassigned</span>
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
                            <span className="text-sm text-zinc-400">No due date</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
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
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
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
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/dashboard/workflow/tasks/${task.id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Task Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <ListTodo className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                No tasks found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first task'}
              </p>
              {!hasActiveFilters && (
                <Link href="/dashboard/workflow/tasks/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
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
