'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/project/use-projects';
import { useTasksByProject } from '@/hooks/task';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { cn } from '@/lib/utils/index';
import {
  ListTodo,
  Plus,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Clock,
  Activity,
  CheckCircle,
} from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { PageHeader } from '@/components/common/page-header';
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
  const paginatedTasks = filteredTasks.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <AlertCircle className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load tasks</EmptyTitle>
          <EmptyDescription>
            Something went wrong while fetching tasks. Please try again.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!project) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <AlertCircle className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Project not found</EmptyTitle>
          <EmptyDescription>
            The project you&apos;re looking for doesn&apos;t exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href="/users/dashboard/portfolio/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={`Tasks — ${project.projectName}`}
        description="Manage and track tasks for this project"
        actions={
          <Button asChild>
            <Link
              href={`/users/dashboard/portfolio/projects/all-projects/${projectId}/tasks/new`}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        }
      />

      {/* Statistics */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          {(
            [
              {
                label: 'Total Tasks',
                count: totalTasks,
                icon: ListTodo,
                description: 'across this project',
                valueClass: 'text-zinc-900 dark:text-zinc-100',
                iconBg: 'bg-blue-50 dark:bg-blue-950/30',
                iconClass: 'text-blue-600 dark:text-blue-400',
              },
              {
                label: 'Upcoming',
                count: upcomingTasks,
                icon: Clock,
                description: 'not yet started',
                valueClass: 'text-zinc-500 dark:text-zinc-400',
                iconBg: 'bg-zinc-100 dark:bg-zinc-800',
                iconClass: 'text-zinc-500 dark:text-zinc-400',
              },
              {
                label: 'On Going',
                count: onGoingTasks,
                icon: Activity,
                description: 'currently in progress',
                valueClass: 'text-blue-600 dark:text-blue-400',
                iconBg: 'bg-blue-50 dark:bg-blue-950/30',
                iconClass: 'text-blue-600 dark:text-blue-400',
              },
              {
                label: 'Completed',
                count: completedTasks,
                icon: CheckCircle,
                description: 'successfully done',
                valueClass: 'text-emerald-600 dark:text-emerald-400',
                iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
                iconClass: 'text-emerald-600 dark:text-emerald-400',
              },
            ] as const
          ).map(
            (
              {
                label,
                count,
                icon: Icon,
                description,
                valueClass,
                iconBg,
                iconClass,
              },
              i
            ) => {
              const padClass =
                i === 0 ? 'sm:pr-6' : i === 3 ? 'sm:pl-6' : 'sm:px-6';
              return (
                <div
                  key={label}
                  className={cn(
                    'flex flex-col gap-1 rounded-lg p-3 sm:rounded-none',
                    padClass
                  )}
                >
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {label}
                  </p>
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-2xl font-bold tracking-tight ${valueClass}`}
                    >
                      {count}
                    </p>
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
                    >
                      <Icon className={`size-4 ${iconClass}`} />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {description}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </Card>

      {/* Task Table */}
      <TaskTable
        paginatedTasks={paginatedTasks}
        filteredTasksCount={filteredTasks.length}
        startIndex={startIndex}
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
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
