'use client';

import { use, useState } from 'react';
import { useProject } from '@/hooks/project/use-projects';
import { useTask } from '@/hooks/task';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { TaskStatus, getTaskStatusLabel } from '@/types/task';
import { useDeleteAttachment } from '@/hooks/attachment/use-attachment-mutations';
import {
  TaskOverviewTab,
  TaskIssuesTab,
  DeleteAttachmentDialog,
} from '@/features/tasks/components';

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
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Task not found
          </h3>
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">
            The task you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href={`/users/dashboard/projects/${projectId}/tasks`}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const relatedIssues = task.issues || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {task.title}
          </h1>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(task.status)}>
              {getTaskStatusLabel(task.status)}
            </Badge>
            {project && (
              <Link href={`/users/dashboard/projects/${project.id}`}>
                <Badge
                  variant="outline"
                  className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <FolderOpen className="mr-1 h-3 w-3" />
                  {project.projectName}
                </Badge>
              </Link>
            )}
          </div>
        </div>
        <Link
          href={`/users/dashboard/projects/${projectId}/tasks/${task.id}/edit`}
        >
          <Button className="shrink-0">
            <Edit className="mr-2 h-4 w-4" />
            Edit Task
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">
            Related Issues
            {relatedIssues.length > 0 && (
              <span className="ml-1.5 rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700">
                {relatedIssues.length}
              </span>
            )}
          </TabsTrigger>
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
