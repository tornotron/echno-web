'use client';

import { useState } from 'react';
import {
  useIssuesPage,
  useIssueStats,
} from '@tornotron/echno-core/issue/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { Button } from '@/components/shadcn/button';
import { Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { IssueTable, IssueStatsCard } from '@/features/issues/components';
import { PageHeader } from '@/components/common/page-header';
import { useDebounce } from '@/hooks/use-debounce';
import { routes } from '@/nav';

export default function AllIssuesPage() {
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Debounce the search box so a request fires when the user pauses, not on
  // every keystroke.
  const debouncedSearch = useDebounce(searchQuery);

  const projectId = projectFilter === 'all' ? undefined : Number(projectFilter);
  const status = statusFilter === 'all' ? undefined : statusFilter;
  const type = typeFilter === 'all' ? undefined : typeFilter;
  const search = debouncedSearch.trim() || undefined;

  // Filters (minus paging) shared by the page query and the stats query.
  const filters = { projectId, search, type };

  const { data: page, isLoading: isPageLoading } = useIssuesPage({
    ...filters,
    status,
    page: currentPage - 1,
    size: itemsPerPage,
  });
  const { data: stats } = useIssueStats(filters);

  const paginatedIssues = page?.content ?? [];
  const totalIssues = page?.totalElements ?? 0;
  const totalPages = page?.totalPages ?? 0;
  const startIndex = (currentPage - 1) * itemsPerPage;

  const isLoading = isProjectsLoading || isPageLoading;

  const hasActiveFilters =
    !!search ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    projectFilter !== 'all';

  if (isLoading && paginatedIssues.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Issues"
        description="Track and manage issues across all projects"
        actions={
          projectId ? (
            <Button asChild>
              <Link
                href={
                  routes.portfolio.projects.allProjects.detail(projectId).issues
                    .new
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                New Issue
              </Link>
            </Button>
          ) : undefined
        }
      />

      <IssueStatsCard
        totalIssues={stats?.total ?? 0}
        openIssues={stats?.byStatus.open ?? 0}
        inProgressIssues={stats?.byStatus.inProgress ?? 0}
        resolvedIssues={stats?.byStatus.resolved ?? 0}
      />

      <IssueTable
        paginatedIssues={paginatedIssues}
        filteredIssuesCount={totalIssues}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
        projectId={projectFilter}
        currentPage={currentPage}
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
        typeFilter={typeFilter}
        onTypeChange={(v) => {
          setTypeFilter(v);
          setCurrentPage(1);
        }}
        projects={projects}
        projectFilter={projectFilter}
        onProjectChange={(v) => {
          setProjectFilter(v);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
