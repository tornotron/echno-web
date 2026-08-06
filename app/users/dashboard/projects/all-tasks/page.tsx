'use client';

import { useTasks } from '@tornotron/echno-core/task/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { TasksList } from '@/features/tasks/components';

export default function AllTasksPage() {
  const { data: allTasks = [], isLoading: isTasksLoading } = useTasks();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

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
      <TasksList tasks={allTasks} projects={projects} />
    </div>
  );
}
