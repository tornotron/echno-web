'use client';

import { useState, useMemo, useEffect } from 'react';
import { useIssues, useIssuesByProject } from '@/hooks/issue';
import { useProjects } from '@/hooks/project/use-projects';
import { SearchAndFilter, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { AlertCircle, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { IssueStatus, IssueType } from '@/types/issue';
import { IssueTable } from '@/features/issues/components';

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

  // Fetch all issues when no project selected, or by project when one is selected
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
  const endIndex = startIndex + itemsPerPage;
  const paginatedIssues = filteredIssues.slice(startIndex, endIndex);

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

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setProjectFilter('all');
    setCurrentPage(1);
  };

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
                href={`/users/dashboard/projects/${selectedProjectId}/issues/new`}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Issue
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(
          [
            {
              label: 'Total Issues',
              count: totalIssues,
              color: 'blue',
              filter: 'all',
            },
            {
              label: 'Open',
              count: openIssues,
              color: 'red',
              filter: IssueStatus.open,
            },
            {
              label: 'In Progress',
              count: inProgressIssues,
              color: 'blue',
              filter: IssueStatus.inProgress,
            },
            {
              label: 'Resolved',
              count: resolvedIssues,
              color: 'green',
              filter: IssueStatus.resolved,
            },
          ] as const
        ).map(({ label, count, color, filter }) => {
          const isActive = statusFilter === filter;
          const colorClasses = {
            blue: {
              bg: 'bg-blue-100 dark:bg-blue-900/20',
              text: 'text-blue-600 dark:text-blue-400',
            },
            red: {
              bg: 'bg-red-100 dark:bg-red-900/20',
              text: 'text-red-600 dark:text-red-400',
            },
            green: {
              bg: 'bg-green-100 dark:bg-green-900/20',
              text: 'text-green-600 dark:text-green-400',
            },
          } satisfies Record<string, { bg: string; text: string }>;
          const classes = colorClasses[color];
          return (
            <Card
              key={label}
              className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-primary ring-2' : ''}`}
              onClick={() => {
                setStatusFilter(isActive ? 'all' : filter);
                setCurrentPage(1);
              }}
            >
              <CardHeader className="pb-3">
                <CardDescription>{label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${classes.bg}`}
                  >
                    <AlertCircle className={`h-6 w-6 ${classes.text}`} />
                  </div>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {count}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search issues..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'All Projects',
            options: [
              { value: 'all', label: 'All Projects' },
              ...projects.map((p) => ({
                value: p.id.toString(),
                label: p.projectName,
              })),
            ],
            value: projectFilter,
            onChange: (v) => {
              setProjectFilter(v);
              setCurrentPage(1);
            },
            width: 'w-full sm:w-[220px]',
          },
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
              { value: IssueStatus.open, label: 'Open' },
              { value: IssueStatus.inProgress, label: 'In Progress' },
              { value: IssueStatus.resolved, label: 'Resolved' },
              { value: IssueStatus.closed, label: 'Closed' },
            ],
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Type',
            options: [
              { value: 'all', label: 'All Types' },
              { value: IssueType.technical, label: 'Technical' },
              { value: IssueType.design, label: 'Design' },
              { value: IssueType.quality, label: 'Quality' },
              { value: IssueType.safety, label: 'Safety' },
              { value: IssueType.material, label: 'Material' },
              { value: IssueType.equipment, label: 'Equipment' },
              { value: IssueType.labour, label: 'Labour' },
              { value: IssueType.weather, label: 'Weather' },
              { value: IssueType.permit, label: 'Permit' },
              { value: IssueType.coordination, label: 'Coordination' },
              { value: IssueType.other, label: 'Other' },
            ],
            value: typeFilter,
            onChange: (v) => {
              setTypeFilter(v);
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Issue Table — requires a projectId for navigation; show prompt when none selected */}
      {!selectedProjectId && filteredIssues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              No issues found
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'No issues exist yet across your projects'}
            </p>
          </CardContent>
        </Card>
      ) : selectedProjectId ? (
        <IssueTable
          paginatedIssues={paginatedIssues}
          filteredIssuesCount={filteredIssues.length}
          startIndex={startIndex}
          endIndex={endIndex}
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
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Select a project to view issues
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Choose a project from the dropdown above to browse and navigate
              issues
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
