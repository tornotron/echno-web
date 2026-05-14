'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { AlertCircle, MessageSquare, Plus } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import Link from 'next/link';
import type { Task } from '@/types/task/task';
import { getIssueTypeLabel } from '@/types/issue/issue-type';

// ---------------------------------------------------------------------------
// Issue status helpers
// ---------------------------------------------------------------------------

function getIssueStatusColor(status: string): string {
  const map: Record<string, string> = {
    open: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    inProgress:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    resolved:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  };
  return (
    map[status] ||
    'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
  );
}

function getIssueStatusLabel(status: string): string {
  const map: Record<string, string> = {
    open: 'Open',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return map[status] || status;
}

// ---------------------------------------------------------------------------
// TaskIssuesTab
// ---------------------------------------------------------------------------

interface TaskIssuesTabProps {
  task: Task;
}

export function TaskIssuesTab({ task }: TaskIssuesTabProps) {
  const router = useRouter();
  const relatedIssues = task.issues || [];

  const reportIssueHref = `/users/dashboard/portfolio/projects/all-projects/${task.projectId}/issues/new?taskId=${task.id}&taskTitle=${encodeURIComponent(task.title)}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="h-4 w-4" />
              Related Issues
              {relatedIssues.length > 0 && (
                <Badge variant="outline">{relatedIssues.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Issues reported for this task</CardDescription>
          </div>
          <Link href={reportIssueHref}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Report Issue
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {relatedIssues.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relatedIssues.map((issue) => (
                <TableRow
                  key={issue.id}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  onClick={() =>
                    router.push(
                      `/users/dashboard/portfolio/projects/all-projects/${task.projectId}/issues/${issue.id}?from=task&taskId=${task.id}`
                    )
                  }
                >
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
                  <TableCell>
                    <Badge variant="outline">
                      {getIssueTypeLabel(issue.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getIssueStatusColor(issue.status)}>
                      {getIssueStatusLabel(issue.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                      <MessageSquare className="h-4 w-4" />
                      <span>{issue.comments?.length ?? 0}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty variant="inline">
            <EmptyMedia variant="icon">
              <AlertCircle className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No issues reported yet</EmptyTitle>
              <EmptyDescription>
                Report an issue to track problems for this task
              </EmptyDescription>
            </EmptyHeader>
            <Button size="sm" variant="outline" asChild>
              <Link href={reportIssueHref}>
                <Plus className="mr-2 h-4 w-4" />
                Report First Issue
              </Link>
            </Button>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
