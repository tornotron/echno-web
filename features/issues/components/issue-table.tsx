'use client';

import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { AlertCircle, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Issue } from '@/types/issue/issue';
import { IssueStatus } from '@/types/issue';
import { getIssueTypeLabel, getIssueTypeColor } from '@/types/issue/issue-type';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';

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

interface IssueTableProps {
  paginatedIssues: Issue[];
  filteredIssuesCount: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onItemsPerPageChange: (n: number) => void;
  projectId: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
}

export function IssueTable({
  paginatedIssues,
  filteredIssuesCount,
  startIndex,
  endIndex,
  itemsPerPage,
  onItemsPerPageChange,
  projectId,
  currentPage,
  totalPages,
  onPageChange,
  hasActiveFilters,
}: IssueTableProps) {
  const router = useRouter();

  return (
    <>
      {/* Results summary + rows per page */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {filteredIssuesCount === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(endIndex, filteredIssuesCount)} of {filteredIssuesCount}{' '}
          issues
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(v) => onItemsPerPageChange(Number(v))}
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

      {/* Table or empty state */}
      {paginatedIssues.length > 0 ? (
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
                {paginatedIssues.map((issue) => (
                  <TableRow
                    key={issue.id}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    onClick={() =>
                      router.push(
                        `/users/dashboard/projects/${projectId}/issues/${issue.id}`
                      )
                    }
                  >
                    {/* Title + description */}
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

                    {/* Type badge — uses existing type utilities */}
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
                              `/users/dashboard/projects/${projectId}/tasks/${issue.taskId}`
                            );
                          }}
                        >
                          {issue.taskName}
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-400">No task</span>
                      )}
                    </TableCell>

                    {/* Creator with EmployeeAvatar */}
                    <TableCell>
                      {issue.creator ? (
                        <div className="flex items-center gap-2">
                          <EmployeeAvatar
                            employee={issue.creator}
                            size="sm"
                            className="!size-8"
                          />
                          <Link
                            href={`/users/dashboard/workforce/employees/${issue.creator.id}`}
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

                    {/* Status badge */}
                    <TableCell>
                      <Badge className={getStatusColor(issue.status)}>
                        {getStatusLabel(issue.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
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
              <Link href={`/users/dashboard/projects/${projectId}/issues/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Issue
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
