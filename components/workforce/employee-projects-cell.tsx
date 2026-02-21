'use client';

import { FolderKanban, Loader2 } from 'lucide-react';
import { useProjectsByEmployee } from '@/hooks/project';
import type { Project } from '@/types/project';

interface EmployeeProjectsCellProps {
  projects: Project[] | undefined;
  isLoading: boolean;
}

/**
 * Pure presentational component that displays employee projects.
 * Accepts projects data and loading state as props.
 */
export function EmployeeProjectsCell({
  projects,
  isLoading,
}: EmployeeProjectsCellProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <FolderKanban className="h-3 w-3" />
        <span>No projects</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {projects.slice(0, 2).map((proj) => (
        <div
          key={proj.id}
          className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 dark:bg-blue-900/20"
        >
          <FolderKanban className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
          <span className="max-w-[180px] truncate text-xs font-medium text-blue-700 dark:text-blue-300">
            {proj.projectName}
          </span>
        </div>
      ))}
      {projects.length > 2 && (
        <div className="flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
          <FolderKanban className="h-3 w-3 shrink-0 text-zinc-500 dark:text-zinc-400" />
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            +{projects.length - 2} more
          </span>
        </div>
      )}
    </div>
  );
}

interface EmployeeProjectsCellContainerProps {
  employeeId: number;
}

/**
 * Container component that fetches employee projects data and renders EmployeeProjectsCell.
 * This component handles the data fetching logic.
 */
export function EmployeeProjectsCellContainer({
  employeeId,
}: EmployeeProjectsCellContainerProps) {
  const { data: projects, isLoading } = useProjectsByEmployee(employeeId);

  return <EmployeeProjectsCell projects={projects} isLoading={isLoading} />;
}
