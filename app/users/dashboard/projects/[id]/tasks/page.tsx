'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/project/use-projects';
import { useTasksByProject } from '@/hooks/task';
import { SearchAndFilter } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { ListTodo, Plus, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { TaskStatus } from '@/types/task';
import { TaskTable } from '@/features/tasks/components';

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = Number.parseInt(params.id as string);

  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = useProject(projectId);
  const {
    data: projectTasks = [],
    isLoading: isTasksLoading,
    isError: isTasksError,
  } = useTasksByProject(projectId);

  const isLoading = isProjectLoading || isTasksLoading;
  const isError = isProjectError || isTasksError;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Failed to load tasks
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Something went wrong while fetching tasks. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400">Project not found</p>
          <Link href="/users/dashboard/projects">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Tasks — {project.projectName}
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

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Tasks', count: totalTasks, color: 'blue' },
          { label: 'Upcoming', count: upcomingTasks, color: 'gray' },
          { label: 'On Going', count: onGoingTasks, color: 'blue' },
          { label: 'Completed', count: completedTasks, color: 'green' },
        ].map(({ label, count, color }) => (
          <Card key={label}>
            <CardHeader className="pb-3">
              <CardDescription>{label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}
                >
                  <ListTodo
                    className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`}
                  />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {count}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
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

      {/* Task Table */}
      <TaskTable
        paginatedTasks={paginatedTasks}
        filteredTasksCount={filteredTasks.length}
        startIndex={startIndex}
        endIndex={endIndex}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
        projectId={projectId}
        currentPage={validCurrentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
}
