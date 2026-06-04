'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { AlertCircle, Calendar, Plus, Search } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Checkbox } from '@/components/shadcn/checkbox';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Issue } from '@/types/issue/issue';
import { IssueStatus, IssueType } from '@/types/issue';
import { getIssueTypeLabel, getIssueTypeColor } from '@/types/issue/issue-type';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';
import { routes } from '@/nav';
import { usePrefetchIssue } from '@/hooks/issue/use-prefetch-issue';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function getStatusColor(status: IssueStatus): string {
  switch (status) {
    case IssueStatus.open: {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case IssueStatus.inProgress: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case IssueStatus.pending: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    case IssueStatus.inReview: {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    }
    case IssueStatus.blocked: {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400';
    }
    case IssueStatus.reOpened: {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
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
}

function getStatusLabel(status: IssueStatus): string {
  switch (status) {
    case IssueStatus.open: {
      return 'Open';
    }
    case IssueStatus.inProgress: {
      return 'In Progress';
    }
    case IssueStatus.pending: {
      return 'Pending';
    }
    case IssueStatus.inReview: {
      return 'In Review';
    }
    case IssueStatus.blocked: {
      return 'Blocked';
    }
    case IssueStatus.reOpened: {
      return 'Re-Opened';
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
}

// ---------------------------------------------------------------------------
// IssueTable
// ---------------------------------------------------------------------------

interface ProjectOption {
  id: number;
  projectName: string;
}

interface IssueTableProps {
  paginatedIssues: Issue[];
  filteredIssuesCount: number;
  startIndex: number;
  itemsPerPage: number;
  onItemsPerPageChange: (n: number) => void;
  /** projectId to use for navigation links; pass 'all' to disable row clicks */
  projectId: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  searchValue: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  /** When provided, a project selector is shown as the first filter in the header */
  projects?: ProjectOption[];
  projectFilter?: string;
  onProjectChange?: (v: string) => void;
}

export function IssueTable({
  paginatedIssues,
  filteredIssuesCount,
  startIndex,
  itemsPerPage,
  onItemsPerPageChange,
  projectId,
  currentPage,
  totalPages,
  onPageChange,
  hasActiveFilters,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  projects,
  projectFilter,
  onProjectChange,
}: IssueTableProps) {
  const router = useRouter();
  const prefetchIssue = usePrefetchIssue();
  const endIndex = Math.min(startIndex + itemsPerPage, filteredIssuesCount);
  const canNavigate = projectId !== 'all';

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const isAllSelected =
    paginatedIssues.length > 0 &&
    paginatedIssues.every((i) => selectedIds.includes(i.id));
  const isSomeSelected =
    !isAllSelected && paginatedIssues.some((i) => selectedIds.includes(i.id));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? paginatedIssues.map((i) => i.id) : []);
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const statusSelect = (compact?: boolean) => (
    <Select value={statusFilter} onValueChange={onStatusChange}>
      <SelectTrigger
        className={`h-8 text-xs ${compact ? 'w-[110px]' : 'w-[130px]'}`}
      >
        <SelectValue placeholder="All Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value={IssueStatus.open}>Open</SelectItem>
        <SelectItem value={IssueStatus.inProgress}>In Progress</SelectItem>
        <SelectItem value={IssueStatus.pending}>Pending</SelectItem>
        <SelectItem value={IssueStatus.inReview}>In Review</SelectItem>
        <SelectItem value={IssueStatus.blocked}>Blocked</SelectItem>
        <SelectItem value={IssueStatus.reOpened}>Re-Opened</SelectItem>
        <SelectItem value={IssueStatus.resolved}>Resolved</SelectItem>
        <SelectItem value={IssueStatus.closed}>Closed</SelectItem>
      </SelectContent>
    </Select>
  );

  const typeSelect = (compact?: boolean) => (
    <Select value={typeFilter} onValueChange={onTypeChange}>
      <SelectTrigger
        className={`h-8 text-xs ${compact ? 'w-[110px]' : 'w-[130px]'}`}
      >
        <SelectValue placeholder="All Types" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        <SelectItem value={IssueType.technical}>Technical</SelectItem>
        <SelectItem value={IssueType.design}>Design</SelectItem>
        <SelectItem value={IssueType.quality}>Quality</SelectItem>
        <SelectItem value={IssueType.safety}>Safety</SelectItem>
        <SelectItem value={IssueType.material}>Material</SelectItem>
        <SelectItem value={IssueType.equipment}>Equipment</SelectItem>
        <SelectItem value={IssueType.labour}>Labour</SelectItem>
        <SelectItem value={IssueType.weather}>Weather</SelectItem>
        <SelectItem value={IssueType.permit}>Permit</SelectItem>
        <SelectItem value={IssueType.coordination}>Coordination</SelectItem>
        <SelectItem value={IssueType.other}>Other</SelectItem>
      </SelectContent>
    </Select>
  );

  const issueRows = paginatedIssues.map((issue) => (
    <TableRow
      key={issue.id}
      className={
        canNavigate
          ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          : undefined
      }
      onClick={
        canNavigate
          ? () =>
              router.push(
                routes.portfolio.projects.allProjects
                  .detail(projectId)
                  .issues.detail(issue.id).href
              )
          : undefined
      }
      onMouseEnter={canNavigate ? () => prefetchIssue(issue.id) : undefined}
      onFocus={canNavigate ? () => prefetchIssue(issue.id) : undefined}
    >
      <TableCell className="pl-5" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selectedIds.includes(issue.id)}
          onCheckedChange={(checked) =>
            handleSelectOne(issue.id, checked as boolean)
          }
          aria-label={`Select ${issue.title}`}
        />
      </TableCell>
      {/* Title + description */}
      <TableCell>
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {issue.title}
          </p>
          {issue.description && (
            <p className="max-w-[300px] truncate text-sm text-zinc-600 dark:text-zinc-400">
              {issue.description}
            </p>
          )}
        </div>
      </TableCell>

      {/* Type badge */}
      <TableCell>
        <Badge
          style={{
            backgroundColor: `${getIssueTypeColor(issue.type)}20`,
            borderColor: getIssueTypeColor(issue.type),
            color: getIssueTypeColor(issue.type),
          }}
          variant="outline"
        >
          {getIssueTypeLabel(issue.type)}
        </Badge>
      </TableCell>

      {/* Related task */}
      <TableCell>
        {issue.taskName && issue.taskId ? (
          <span
            className="cursor-pointer text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            onClick={(e) => {
              e.stopPropagation();
              router.push(
                routes.portfolio.projects.allProjects
                  .detail(projectId)
                  .tasks.detail(issue.taskId!).href
              );
            }}
          >
            {issue.taskName}
          </span>
        ) : (
          <span className="text-sm text-zinc-400">No task</span>
        )}
      </TableCell>

      {/* Creator */}
      <TableCell>
        {issue.creator ? (
          <div className="flex items-center gap-2">
            <EmployeeAvatar
              employee={issue.creator}
              size="sm"
              className="!size-8"
            />
            <Link
              href={
                routes.workforce.employees.employeeManagement.detail(
                  issue.creator.id
                ).href
              }
              className="text-sm font-medium text-zinc-700 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400"
              onClick={(e) => e.stopPropagation()}
            >
              {issue.creator.name}
            </Link>
          </div>
        ) : (
          <span className="text-sm text-zinc-400">Unknown</span>
        )}
      </TableCell>

      {/* Created date */}
      <TableCell>
        <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Calendar className="h-3 w-3" />
          <span>{format(issue.createdAt, 'MMM d, yyyy')}</span>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge className={getStatusColor(issue.status)}>
          {getStatusLabel(issue.status)}
        </Badge>
      </TableCell>
    </TableRow>
  ));

  return (
    <>
      {/* ── Desktop (md+) ──────────────────────────────────────────────── */}
      <Card className="hidden md:block">
        <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-1">
          {projects && onProjectChange && (
            <Select
              value={projectFilter ?? 'all'}
              onValueChange={onProjectChange}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search issues…"
              className="h-8 pl-8 text-sm"
            />
          </div>

          {statusSelect()}
          {typeSelect()}

          <div className="ml-auto flex items-center gap-2 border-l pl-3">
            <span className="text-xs whitespace-nowrap text-zinc-500">
              Rows per page
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => onItemsPerPageChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {paginatedIssues.length > 0 ? (
          <>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 pl-5">
                      <Checkbox
                        checked={
                          isSomeSelected ? 'indeterminate' : isAllSelected
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Related Task</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{issueRows}</TableBody>
              </Table>
            </CardContent>
            <div className="flex items-center justify-between border-t px-4 py-2">
              <span className="text-sm text-zinc-500">
                {filteredIssuesCount === 0 ? 0 : startIndex + 1}–{endIndex} of{' '}
                {filteredIssuesCount} issues
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          </>
        ) : (
          <CardContent>
            <Empty variant="inline">
              <EmptyMedia variant="icon">
                <AlertCircle className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No issues found</EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first issue'}
                </EmptyDescription>
              </EmptyHeader>
              {!hasActiveFilters && (
                <Button asChild>
                  <Link
                    href={
                      routes.portfolio.projects.allProjects.detail(projectId)
                        .issues.new
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Issue
                  </Link>
                </Button>
              )}
            </Empty>
          </CardContent>
        )}
      </Card>

      {/* ── Mobile (<md) ───────────────────────────────────────────────── */}
      <div className="md:hidden">
        <div className="mb-3 flex flex-wrap gap-2">
          {projects && onProjectChange && (
            <Select
              value={projectFilter ?? 'all'}
              onValueChange={onProjectChange}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search issues…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          {statusSelect(true)}
          {typeSelect(true)}
        </div>

        {paginatedIssues.length > 0 ? (
          <>
            <div className="flex flex-col gap-3">
              {paginatedIssues.map((issue) => (
                <Card
                  key={issue.id}
                  className={
                    canNavigate
                      ? 'cursor-pointer transition-shadow hover:shadow-md active:opacity-80'
                      : undefined
                  }
                  onClick={
                    canNavigate
                      ? () =>
                          router.push(
                            routes.portfolio.projects.allProjects
                              .detail(projectId)
                              .issues.detail(issue.id).href
                          )
                      : undefined
                  }
                  onMouseEnter={
                    canNavigate ? () => prefetchIssue(issue.id) : undefined
                  }
                  onFocus={
                    canNavigate ? () => prefetchIssue(issue.id) : undefined
                  }
                >
                  <CardContent className="p-4">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="text-sm leading-snug font-medium text-zinc-900 dark:text-zinc-100">
                        {issue.title}
                      </p>
                      <Badge
                        className={`shrink-0 ${getStatusColor(issue.status)}`}
                      >
                        {getStatusLabel(issue.status)}
                      </Badge>
                    </div>

                    {issue.description && (
                      <p className="mb-3 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                        {issue.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <Badge
                        style={{
                          backgroundColor: `${getIssueTypeColor(issue.type)}20`,
                          borderColor: getIssueTypeColor(issue.type),
                          color: getIssueTypeColor(issue.type),
                        }}
                        variant="outline"
                        className="text-xs"
                      >
                        {getIssueTypeLabel(issue.type)}
                      </Badge>

                      {issue.taskName && (
                        <span
                          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (issue.taskId) {
                              router.push(
                                routes.portfolio.projects.allProjects
                                  .detail(projectId)
                                  .tasks.detail(issue.taskId).href
                              );
                            }
                          }}
                        >
                          {issue.taskName}
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Calendar className="h-3 w-3" />
                        {format(issue.createdAt, 'MMM d, yyyy')}
                      </span>
                    </div>

                    {issue.creator && (
                      <div className="mt-3 flex items-center gap-2">
                        <EmployeeAvatar
                          employee={issue.creator}
                          size="sm"
                          className="!size-6"
                        />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {issue.creator.name}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </>
        ) : (
          <Empty variant="default">
            <EmptyMedia variant="icon">
              <AlertCircle className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No issues found</EmptyTitle>
              <EmptyDescription>
                {hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first issue'}
              </EmptyDescription>
            </EmptyHeader>
            {!hasActiveFilters && (
              <Button asChild>
                <Link
                  href={
                    routes.portfolio.projects.allProjects.detail(projectId)
                      .issues.new
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Issue
                </Link>
              </Button>
            )}
          </Empty>
        )}
      </div>
    </>
  );
}
