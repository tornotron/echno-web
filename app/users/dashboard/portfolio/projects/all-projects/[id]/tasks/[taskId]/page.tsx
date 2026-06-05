'use client';

import { use, useState } from 'react';
import { useProject } from '@/hooks/project/use-projects';
import { useTask } from '@/hooks/task';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Card } from '@/components/shadcn/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/common/page-header';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { TaskStatus, getTaskStatusLabel } from '@/types/task';
import { useDeleteAttachment } from '@tornotron/echno-core';
import { toast } from '@/lib/styles/toast-styles';
import {
  TaskOverviewTab,
  TaskIssuesTab,
  TaskConsumptionsTab,
  DeleteAttachmentDialog,
} from '@/features/tasks/components';
import { routes } from '@/nav';

// ---------------------------------------------------------------------------
// Status colour helper
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.upcoming]:
    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  [TaskStatus.onGoing]:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  [TaskStatus.completed]:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  [TaskStatus.onHold]:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
};

const getStatusColor = (status: TaskStatus) =>
  STATUS_COLORS[status] ??
  'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string; taskId: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const { id: projectId, taskId: taskIdParam } = use(params);
  const taskId = Number.parseInt(taskIdParam);

  const { data: task, isLoading, isError } = useTask(taskId);
  const { data: project } = useProject(task?.projectId);

  const [attachmentToDelete, setAttachmentToDelete] = useState<number | null>(
    null
  );
  const deleteAttachment = useDeleteAttachment();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError || !task) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <AlertCircle className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Task not found</EmptyTitle>
          <EmptyDescription>
            The task you&apos;re looking for doesn&apos;t exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link
            href={
              routes.portfolio.projects.allProjects.detail(projectId).tasks.href
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Link>
        </Button>
      </Empty>
    );
  }

  const relatedIssues = task.issues || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={task.title}
        badge={
          <Badge className={getStatusColor(task.status)}>
            {getTaskStatusLabel(task.status)}
          </Badge>
        }
        description={
          project ? (
            <Link
              href={
                routes.portfolio.projects.allProjects.detail(project.id).href
              }
              className="inline-flex items-center gap-1.5 hover:opacity-80"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              {project.projectName}
            </Link>
          ) : undefined
        }
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link
              href={
                routes.portfolio.projects.allProjects
                  .detail(projectId)
                  .tasks.detail(task.id).edit
              }
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Task
            </Link>
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-zinc-100 px-1.5 py-1.5 dark:bg-zinc-800/60">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">
            Related Issues
            {relatedIssues.length > 0 && (
              <span className="ml-1.5 rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700">
                {relatedIssues.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="consumptions">Material Consumptions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <TaskOverviewTab
            task={task}
            taskId={taskId}
            onDeleteAttachment={setAttachmentToDelete}
          />
        </TabsContent>

        <TabsContent value="issues" className="mt-4">
          <TaskIssuesTab task={task} />
        </TabsContent>

        <TabsContent value="consumptions" className="mt-4">
          <TaskConsumptionsTab task={task} />
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
          try {
            await deleteAttachment.mutateAsync(attachmentToDelete);
            toast.success('Attachment Deleted', {
              description: 'The attachment has been removed.',
            });
          } catch {
            toast.error('Failed to Delete Attachment');
          }
          setAttachmentToDelete(null);
        }}
      />
    </div>
  );
}
