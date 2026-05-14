'use client';

import { useState, useMemo, useEffect } from 'react';
import { useIssues, useIssuesByProject } from '@/hooks/issue';
import { useProjects } from '@/hooks/project/use-projects';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent } from '@/components/shadcn/card';
import { cn } from '@/lib/utils/index';
import {
  AlertCircle,
  Plus,
  Loader2,
  Clock,
  CheckCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { IssueStatus } from '@/types/issue';
import { IssueTable } from '@/features/issues/components';
import { PageHeader } from '@/components/common/page-header';

export default function AllIssuesPage() {
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const selectedProjectId =
    projectFilter === 'all' ? undefined : Number(projectFilter);

  const { data: allIssues = [], isLoading: isAllIssuesLoading } = useIssues();
  const { data: projectIssues = [], isLoading: isProjectIssuesLoading } =
    useIssuesByProject(selectedProjectId);

  const issues = selectedProjectId ? projectIssues : allIssues;
  const isLoading =
    isProjectsLoading ||
    (selectedProjectId ? isProjectIssuesLoading : isAllIssuesLoading);

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

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, typeFilter, itemsPerPage, projectFilter]);

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
    !!searchQuery ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    projectFilter !== 'all';

  if (isLoading && issues.length === 0) {
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
          selectedProjectId ? (
            <Button asChild>
              <Link
                href={`/users/dashboard/portfolio/projects/all-projects/${selectedProjectId}/issues/new`}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Issue
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Statistics */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          {(
            [
              {
                label: 'Total Issues',
                count: totalIssues,
                icon: FileText,
                description: 'across all projects',
                valueClass: 'text-zinc-900 dark:text-zinc-100',
                iconBg: 'bg-blue-50 dark:bg-blue-950/30',
                iconClass: 'text-blue-600 dark:text-blue-400',
              },
              {
                label: 'Open',
                count: openIssues,
                icon: AlertCircle,
                description: 'need attention',
                valueClass: 'text-red-600 dark:text-red-400',
                iconBg: 'bg-red-50 dark:bg-red-950/30',
                iconClass: 'text-red-600 dark:text-red-400',
              },
              {
                label: 'In Progress',
                count: inProgressIssues,
                icon: Clock,
                description: 'being worked on',
                valueClass: 'text-blue-600 dark:text-blue-400',
                iconBg: 'bg-blue-50 dark:bg-blue-950/30',
                iconClass: 'text-blue-600 dark:text-blue-400',
              },
              {
                label: 'Resolved',
                count: resolvedIssues,
                icon: CheckCircle,
                description: 'successfully closed',
                valueClass: 'text-emerald-600 dark:text-emerald-400',
                iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
                iconClass: 'text-emerald-600 dark:text-emerald-400',
              },
            ] as const
          ).map(
            (
              {
                label,
                count,
                icon: Icon,
                description,
                valueClass,
                iconBg,
                iconClass,
              },
              i
            ) => {
              const padClass =
                i === 0 ? 'sm:pr-6' : i === 3 ? 'sm:pl-6' : 'sm:px-6';
              return (
                <div
                  key={label}
                  className={cn(
                    'flex flex-col gap-1 rounded-lg p-3 sm:rounded-none',
                    padClass
                  )}
                >
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {label}
                  </p>
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-2xl font-bold tracking-tight ${valueClass}`}
                    >
                      {count}
                    </p>
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
                    >
                      <Icon className={`size-4 ${iconClass}`} />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {description}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </Card>

      {/* Issue Table — project select lives in the table header; rows only navigate when a project is chosen */}
      <IssueTable
        paginatedIssues={paginatedIssues}
        filteredIssuesCount={filteredIssues.length}
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
