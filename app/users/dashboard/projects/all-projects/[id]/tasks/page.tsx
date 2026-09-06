'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@tornotron/echno-core/project/hooks';
import { useTasksByProject } from '@tornotron/echno-core/task/hooks';
import { Button } from '@/components/shadcn/button';
import { Plus, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { PageHeader } from '@/components/common/page-header';
import { ActiveFilterChip } from '@/components/common';
import { useEmployeeFilterFromParams } from '@/hooks/use-employee-filter';
import Link from 'next/link';
import { TaskStatus } from '@tornotron/echno-core/task/types';
import { TaskTable, TaskStatsCard } from '@/features/tasks/components';
import { routes } from '@/nav';

export default function ProjectTasksPage() {
  const params = useParams();
  const rawId = params.id as string | undefined;
  const parsed = rawId ? Number.parseInt(rawId, 10) : Number.NaN;
  const projectId = Number.isNaN(parsed) ? undefined : parsed;

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

  /*
    A name in this project's team roster links here as
    `?employeeId=<id>&role=assignee`. It answers "what is this person doing on
    this project", and both halves of that are real: the project half is the
    route, which fetches through `useTasksByProject`, and the assignee half is
    this filter. `useTasksByProject` returns the project's tasks whole rather
    than a page of them, so narrowing in the browser hides nothing.
  */
  const { chip, matches: matchesAssigneeFilter } = useEmployeeFilterFromParams({
    rows: projectTasks,
    roles: {
      // A task carries several assignees, so no single id answers this.
      assignee: {
        matches: (task, id) => task.assignees?.some((a) => a.id === id) ?? false,
      },
    },
  });

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
      return matchesSearch && matchesStatus && matchesAssigneeFilter(task);
    });
  }, [searchQuery, statusFilter, projectTasks, matchesAssigneeFilter]);

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

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'all' || chip
  );

  if (!projectId) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <AlertCircle className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Invalid project</EmptyTitle>
          <EmptyDescription>
            The project ID in the URL is not valid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.projects.allProjects.href}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </Empty>
    );
  }

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
          <Link href={routes.projects.href}>
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
              href={
                routes.projects.allProjects.detail(projectId).tasks
                  .new
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        }
      />

      {chip && <ActiveFilterChip {...chip} />}

      <TaskStatsCard
        totalTasks={totalTasks}
        upcomingTasks={upcomingTasks}
        onGoingTasks={onGoingTasks}
        completedTasks={completedTasks}
      />

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
