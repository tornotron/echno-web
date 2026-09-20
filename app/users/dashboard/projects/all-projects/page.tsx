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
import { useProjectSummaries } from '@tornotron/echno-core/project/hooks';
import { ProjectsGridTable } from '@/features/projects/components';
import { routes } from '@/nav';

/**
 * The grid filters and pages on the client over everything the tenant has,
 * so one page of the summary endpoint is asked for at the backend's cap.
 * The summary carries the counts the cards render and none of the
 * collections, so a tenant with hundreds of tasks per project costs a page
 * read and one aggregate rather than the whole graph.
 */
const SUMMARY_PAGE_SIZE = 500;

export default function ProjectsManagePage() {
  const {
    data: page,
    isLoading,
    error,
  } = useProjectSummaries({ pageNo: 0, pageSize: SUMMARY_PAGE_SIZE });
  const projects = page?.content ?? [];

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
            <Link href={routes.projects.allProjects.new}>
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
