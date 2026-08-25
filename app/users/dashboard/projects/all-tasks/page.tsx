'use client';

import { useTasks } from '@tornotron/echno-core/task/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ActiveFilterChip } from '@/components/common';
import {
  useEmployeeFilterFromParams,
  ROLE_LABELS,
} from '@/hooks/use-employee-filter';
import { TasksList } from '@/features/tasks/components';

export default function AllTasksPage() {
  const { data: allTasks = [], isLoading: isTasksLoading } = useTasks();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  const { employeeId, role, name, clear } = useEmployeeFilterFromParams();

  // Tasks are fetched in full client-side, so the employee filter is applied
  // here rather than as a backend query param. `assignee` keeps tasks the
  // employee is one of the assignees on; `creator` keeps tasks they created.
  const filteredTasks =
    employeeId != null && role
      ? allTasks.filter((task) => {
          if (role === 'assignee')
            return task.assignees?.some((a) => a.id === employeeId) ?? false;
          if (role === 'creator') return task.creator?.id === employeeId;
          return true;
        })
      : allTasks;

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
      {employeeId != null && name && (
        <ActiveFilterChip
          label={ROLE_LABELS[role ?? ''] ?? 'Filtered by'}
          name={name}
          onDismiss={clear}
        />
      )}
      <TasksList tasks={filteredTasks} projects={projects} />
    </div>
  );
}
