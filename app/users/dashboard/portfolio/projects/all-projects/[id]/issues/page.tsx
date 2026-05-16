'use client';

import { use, useState, useMemo } from 'react';
import { useProject } from '@/hooks/project/use-projects';
import { useIssuesByProject } from '@/hooks/issue';
import { Button } from '@/components/shadcn/button';
import { Plus, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import Link from 'next/link';
import { IssueStatus } from '@/types/issue';
import { IssueTable, IssueStatsCard } from '@/features/issues/components';
import { routes } from '@/nav';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function IssuesPage({ params }: PageProps) {
  const { id: projectId } = use(params);
  const { data: project } = useProject(Number.parseInt(projectId));
  const { data: issues = [], isLoading } = useIssuesByProject(
    Number.parseInt(projectId)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        issue.title.toLowerCase().includes(q) ||
        issue.description?.toLowerCase().includes(q) ||
        issue.creator?.name?.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' || issue.status === statusFilter;
      const matchesType = typeFilter === 'all' || issue.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [issues, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIssues = filteredIssues.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const totalIssues = filteredIssues.length;
  const openIssues = filteredIssues.filter(
    (i) => i.status === IssueStatus.open
  ).length;
  const inProgressIssues = filteredIssues.filter(
    (i) => i.status === IssueStatus.inProgress
  ).length;
  const resolvedIssues = filteredIssues.filter(
    (i) => i.status === IssueStatus.resolved
  ).length;

  const hasActiveFilters =
    !!searchQuery || statusFilter !== 'all' || typeFilter !== 'all';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={`${project?.projectName ?? 'Project'} — Issues`}
        description="Track and manage issues for this project"
        actions={
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
        }
      />

      <IssueStatsCard
        totalIssues={totalIssues}
        openIssues={openIssues}
        inProgressIssues={inProgressIssues}
        resolvedIssues={resolvedIssues}
        totalDescription="across this project"
      />

      <IssueTable
        paginatedIssues={paginatedIssues}
        filteredIssuesCount={filteredIssues.length}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
        projectId={projectId}
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
      />
    </div>
  );
}
