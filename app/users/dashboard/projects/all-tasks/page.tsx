'use client';

import { useTasks } from '@tornotron/echno-core/task/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ActiveFilterChip } from '@/components/common';
import { useEmployeeFilterFromParams } from '@/hooks/use-employee-filter';
import { TasksList } from '@/features/tasks/components';

export default function AllTasksPage() {
  const { data: allTasks = [], isLoading: isTasksLoading } = useTasks();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  // Tasks are fetched in full client-side, so the employee filter is applied
  // here rather than as a backend query param. `assignee` keeps tasks the
  // employee is one of the assignees on; `creator` keeps tasks they created.
  // The if-chain this replaces ended in `return true`, so a third role fell
  // through to the whole list while the chip still named the person.
  const { chip, filtered: filteredTasks } = useEmployeeFilterFromParams({
    rows: allTasks,
    roles: {
      // A task has several assignees, so no single id answers this one.
      assignee: {
        matches: (task, id) => task.assignees?.some((a) => a.id === id) ?? false,
      },
      creator: (task) => task.creator?.id,
    },
  });

  if (isTasksLoading || isProjectsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Tasks"
        description="View and manage tasks across all projects"
      />
      {chip && <ActiveFilterChip {...chip} />}
      <TasksList tasks={filteredTasks} projects={projects} />
    </div>
  );
}
