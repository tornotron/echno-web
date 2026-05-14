'use client';

import Link from 'next/link';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { FolderKanban, Loader2, Plus } from 'lucide-react';
import { useProjects } from '@/hooks/project/use-projects';
import { ProjectsGridTable } from '@/features/projects/components';

export default function ProjectsManagePage() {
  const { data: projects = [], isLoading, error } = useProjects();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <FolderKanban className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load projects</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error ? error.message : 'An error occurred'}
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => globalThis.location.reload()}>Try Again</Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="All Projects"
        description="Manage and monitor all construction projects"
        actions={
          <Button asChild>
            <Link href="/users/dashboard/portfolio/projects/all-projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Link>
          </Button>
        }
      />
      <ProjectsGridTable projects={projects} />
    </div>
  );
}
