'use client';

import { use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProject } from '@/hooks/project/use-projects';
import { useIssue } from '@/hooks/issue';
import { useTask } from '@/hooks/task';
import { useDeleteAttachment } from '@/hooks/attachment/use-attachment-mutations';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Card, CardContent } from '@/components/shadcn/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { AlertCircle, ArrowLeft, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getIssueTypeLabel, getIssueTypeColor } from '@/types/issue/issue-type';
import { IssueStatus } from '@/types/issue';
import {
  IssueOverviewTab,
  IssueCommentsTab,
  DeleteAttachmentDialog,
} from '@/features/issues/components';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<IssueStatus, string> = {
  [IssueStatus.open]:
    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  [IssueStatus.inProgress]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  [IssueStatus.pending]:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  [IssueStatus.inReview]:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  [IssueStatus.blocked]:
    'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400',
  [IssueStatus.reOpened]:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  [IssueStatus.resolved]:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  [IssueStatus.closed]:
    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
};

const getStatusColor = (status: IssueStatus) =>
  STATUS_COLORS[status] ??
  'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';

const STATUS_LABELS: Record<IssueStatus, string> = {
  [IssueStatus.open]: 'Open',
  [IssueStatus.inProgress]: 'In Progress',
  [IssueStatus.pending]: 'Pending',
  [IssueStatus.inReview]: 'In Review',
  [IssueStatus.blocked]: 'Blocked',
  [IssueStatus.reOpened]: 'Re-Opened',
  [IssueStatus.resolved]: 'Resolved',
  [IssueStatus.closed]: 'Closed',
};

const getStatusLabel = (status: IssueStatus) => STATUS_LABELS[status] ?? status;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string; issueId: string }>;
}

export default function IssueDetailPage({ params }: PageProps) {
  const { id: projectId, issueId: issueIdParam } = use(params);
  const searchParams = useSearchParams();

  const { data: issue, isLoading } = useIssue(Number.parseInt(issueIdParam));
  const { data: relatedTask } = useTask(issue?.taskId);
  const { data: project } = useProject(Number.parseInt(projectId));

  const fromParam = searchParams.get('from');
  const taskIdParam = searchParams.get('taskId');
  const editHref = (() => {
    const base = `/users/dashboard/projects/${projectId}/issues/${issueIdParam}/edit`;
    if (fromParam && taskIdParam)
      return `${base}?from=${fromParam}&taskId=${taskIdParam}`;
    return base;
  })();

  const [attachmentToDelete, setAttachmentToDelete] = useState<number | null>(
    null
  );
  const deleteAttachment = useDeleteAttachment();

  const commentCount = issue?.comments?.length ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!issue) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Issue not found
          </h3>
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">
            The issue you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href={`/users/dashboard/projects/${projectId}/issues`}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Issues
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {issue.title}
          </h1>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(issue.status)}>
              {getStatusLabel(issue.status)}
            </Badge>
            <Badge
              variant="outline"
              style={{
                backgroundColor: `${getIssueTypeColor(issue.type)}20`,
                borderColor: getIssueTypeColor(issue.type),
                color: getIssueTypeColor(issue.type),
              }}
            >
              {getIssueTypeLabel(issue.type)}
            </Badge>
          </div>
        </div>
        <Link href={editHref}>
          <Button className="shrink-0">
            <Edit className="mr-2 h-4 w-4" />
            Edit Issue
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comments">
            Comments
            {commentCount > 0 && (
              <span className="ml-1.5 rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700">
                {commentCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <IssueOverviewTab
            issue={issue}
            relatedTask={relatedTask}
            project={project}
            projectId={projectId}
            onDeleteAttachment={setAttachmentToDelete}
          />
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <IssueCommentsTab issue={issue} />
        </TabsContent>
      </Tabs>

      {/* Delete attachment dialog */}
      <DeleteAttachmentDialog
        open={attachmentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setAttachmentToDelete(null);
        }}
        isPending={deleteAttachment.isPending}
        onConfirm={async () => {
          if (attachmentToDelete === null) return;
          await deleteAttachment.mutateAsync(attachmentToDelete);
          setAttachmentToDelete(null);
        }}
      />
    </div>
  );
}
