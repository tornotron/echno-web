'use client';

import { use } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockIssues,
  mockProjects,
  mockTasks,
} from '@/components/shared/mock-data';
import { AppLayout, Pagination, SearchAndFilter } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertCircle, Plus, Eye, Calendar } from 'lucide-react';
import Link from 'next/link';
import { IssueStatus, IssueType } from '@/types/issue';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function IssuesPage({ params }: PageProps) {
  const router = useRouter();
  const { id: projectId } = use(params);
  const project = mockProjects.find((p) => p.id === Number.parseInt(projectId));

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter issues
  const filteredIssues = useMemo(() => {
    // Get tasks for this project
    const projectTasks = mockTasks.filter(
      (task) => task.projectId === Number.parseInt(projectId)
    );

    // Get issues linked to these tasks
    const projectIssueIds = new Set(
      projectTasks.flatMap((task) => task.issues?.map((i) => i.id) || [])
    );

    return mockIssues.filter((issue) => {
      // Check if issue belongs to this project
      if (!projectIssueIds.has(issue.id)) return false;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        issue.title.toLowerCase().includes(searchLower) ||
        issue.description?.toLowerCase().includes(searchLower) ||
        issue.creator?.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === 'all' || issue.status === statusFilter;
      const matchesType = typeFilter === 'all' || issue.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [projectId, searchQuery, statusFilter, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIssues = filteredIssues.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(1);
    }
  }, [searchQuery, statusFilter, typeFilter, itemsPerPage, currentPage]);

  // Statistics - use filteredIssues for project-specific counts
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

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.open: {
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      }
      case IssueStatus.inProgress: {
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      }
      case IssueStatus.resolved: {
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      }
      case IssueStatus.closed: {
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      }
      default: {
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
      }
    }
  };

  const getStatusLabel = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.open: {
        return 'Open';
      }
      case IssueStatus.inProgress: {
        return 'In Progress';
      }
      case IssueStatus.resolved: {
        return 'Resolved';
      }
      case IssueStatus.closed: {
        return 'Closed';
      }
      default: {
        return status;
      }
    }
  };

  const getTypeColor = (type: IssueType) => {
    switch (type) {
      case IssueType.technical: {
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      }
      case IssueType.design: {
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      }
      case IssueType.quality: {
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      }
      case IssueType.safety: {
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      }
      case IssueType.material: {
        return 'bg-brown-100 text-brown-800 dark:bg-brown-900/20 dark:text-brown-400';
      }
      case IssueType.equipment: {
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400';
      }
      default: {
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
      }
    }
  };

  const getTypeLabel = (type: IssueType) => {
    switch (type) {
      case IssueType.technical: {
        return 'Technical';
      }
      case IssueType.design: {
        return 'Design';
      }
      case IssueType.quality: {
        return 'Quality';
      }
      case IssueType.safety: {
        return 'Safety';
      }
      case IssueType.material: {
        return 'Material';
      }
      case IssueType.equipment: {
        return 'Equipment';
      }
      case IssueType.labour: {
        return 'Labour';
      }
      case IssueType.weather: {
        return 'Weather';
      }
      case IssueType.permit: {
        return 'Permit';
      }
      case IssueType.coordination: {
        return 'Coordination';
      }
      case IssueType.other: {
        return 'Other';
      }
      default: {
        return type;
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {project?.projectName} - Issues
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Track and manage issues for this project
            </p>
          </div>
          <Link href={`/dashboard/projects/${projectId}/issues/new`}>
            <Button className="mt-4 md:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              New Issue
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalIssues}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Open</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {openIssues}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>In Progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {inProgressIssues}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Resolved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <AlertCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {resolvedIssues}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <SearchAndFilter
          variant="card"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search issues..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={[
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
              onChange: setStatusFilter,
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
              onChange: setTypeFilter,
            },
          ]}
        />

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredIssues.length)} of{' '}
            {filteredIssues.length} issues
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Rows per page:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value: string) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Issues Table */}
        {filteredIssues.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Related Task</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedIssues.map((issue) => {
                    // Find the task that contains this issue
                    const relatedTask = mockTasks.find((task) =>
                      task.issues?.some((i) => i.id === issue.id)
                    );
                    const project = mockProjects.find(
                      (p) => p.id === relatedTask?.projectId
                    );

                    return (
                      <TableRow
                        key={issue.id}
                        className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        onClick={() =>
                          router.push(
                            `/dashboard/projects/${projectId}/issues/${issue.id}`
                          )
                        }
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {issue.title}
                            </p>
                            {issue.description && (
                              <p className="max-w-[300px] truncate text-sm text-zinc-600 dark:text-zinc-400">
                                {issue.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(issue.type)}>
                            {getTypeLabel(issue.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {relatedTask ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/projects/${projectId}/tasks/${relatedTask.id}`
                                );
                              }}
                              className="cursor-pointer hover:underline"
                            >
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {relatedTask.title}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-400">
                              No task
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-purple-600">
                              <span className="text-xs font-medium text-white">
                                {issue.creator?.charAt(0) || '?'}
                              </span>
                            </div>
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {issue.creator}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(issue.createdAt, 'MMM d, yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(issue.status)}>
                            {getStatusLabel(issue.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                No issues found
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                {hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first issue'}
              </p>
              {!hasActiveFilters && (
                <Link href={`/dashboard/projects/${projectId}/issues/new`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Issue
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
