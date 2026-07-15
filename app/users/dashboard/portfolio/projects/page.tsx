'use client';

import Link from 'next/link';
import { FolderKanban, Plus } from 'lucide-react';
import { PageHeader, OrgGuard } from '@/components/common';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { ProjectOverview } from '@/features/projects/components/project-overview';
import { ProjectCharts } from '@/features/projects/components/project-charts';
import { Button } from '@/components/shadcn/button';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { routes } from '@/nav';

export default function ProjectsOverviewPage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: projects, isLoading, error } = useProjects();

  const list = projects ?? [];

  return (
    <OrgGuard
      isLoading={isUserLoading || isLoading}
      error={error}
      organizationId={user?.defaultOrganizationId}
    >
      {list.length === 0 ? (
        <div className="space-y-4 sm:space-y-6">
          <PageHeader
            title="Projects Overview"
            description="Organisation-wide project analytics and status summary"
          />
          <Empty variant="default">
            <EmptyMedia variant="icon">
              <FolderKanban className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No Projects Yet</EmptyTitle>
              <EmptyDescription>
                Create your first project to start tracking progress, tasks, and
                team members.
              </EmptyDescription>
            </EmptyHeader>
            <Button asChild>
              <Link href={routes.portfolio.projects.allProjects.new}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <PageHeader
            title="Projects Overview"
            description="Organisation-wide project analytics and status summary"
          />
          <ProjectOverview projects={list} />
          <ProjectCharts projects={list} />
        </div>
      )}
    </OrgGuard>
  );
}
