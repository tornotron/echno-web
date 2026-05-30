'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { PageHeader } from '@/components/common';
import { useProject } from '@/hooks/project/use-projects';
import { useTask, useUpdateTask, useDeleteTask } from '@/hooks/task';
import { useWorkCategories } from '@/hooks/work-category';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { toast } from '@/lib/styles/toast-styles';
import { routes } from '@/nav';
import {
  TaskForm,
  SaveTaskDialog,
  DeleteTaskDialog,
  type TaskFormSubmitData,
} from '@/features/tasks/components';
import type { UpdateTaskRequest } from '@/types/task/task-update';

interface PageProps {
  params: Promise<{ id: string; taskId: string }>;
}

export default function EditTaskPage({ params }: PageProps) {
  const { id: projectId, taskId: taskIdParam } = use(params);
  const router = useRouter();
  const taskId = Number.parseInt(taskIdParam);
  const projectIdNum = Number.parseInt(projectId);

  const { data: taskToEdit, isLoading, isError } = useTask(taskId);
  const { data: project } = useProject(projectIdNum);
  const { data: workCategories = [] } = useWorkCategories();
  const { data: currentEmployee } = useCurrentUserEmployee();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<
    Parameters<typeof updateTask.mutate>[0] | null
  >(null);

  const isSubmitting = updateTask.isPending;
  const isDeleting = deleteTask.isPending;

  function handleSubmit(data: TaskFormSubmitData) {
    const selectedCategory = workCategories.find(
      (c) => c.id.toString() === data.fields.categoryId
    );

    const updateData: UpdateTaskRequest = {
      projectId: projectIdNum,
      title: data.fields.title,
      description: data.fields.description,
      startDate: data.fields.startDate
        ? new Date(data.fields.startDate)
        : undefined,
      endDate: data.fields.endDate ? new Date(data.fields.endDate) : undefined,
      creatorId: currentEmployee?.id,
      categoryId: selectedCategory?.id,
      status: data.fields.status,
      progress: Number.parseInt(data.fields.progress),
      tags: data.fields.selectedTags,
      assigneeIds: data.fields.selectedAssignees
        .map((sid) => Number.parseInt(sid))
        .filter((id) => !Number.isNaN(id) && id > 0),
    };

    setPendingSubmitData({
      id: taskId,
      data: updateData,
      files: { attachments: data.attachments },
    });
    setShowSaveDialog(true);
  }

  function confirmSave() {
    if (!pendingSubmitData) return;
    try {
      updateTask.mutate(pendingSubmitData, {
        onSuccess: () => {
          router.push(
            routes.portfolio.projects.allProjects
              .detail(projectId)
              .tasks.detail(taskId).href
          );
        },
        onSettled: () => {
          setShowSaveDialog(false);
          setPendingSubmitData(null);
        },
      });
    } catch (error) {
      logger.error('Error updating task:', error);
      toast.error('Failed to update task. Please try again.');
    }
  }

  function confirmDelete() {
    deleteTask.mutate(taskId, {
      onSuccess: () => {
        router.push(
          routes.portfolio.projects.allProjects.detail(projectId).tasks.href
        );
      },
      onSettled: () => setShowDeleteDialog(false),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError || !taskToEdit) {
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
        <Button
          onClick={() =>
            router.push(
              routes.portfolio.projects.allProjects.detail(projectId).tasks.href
            )
          }
        >
          Back to Tasks
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Edit Task"
        description={
          project
            ? `Update task in ${project.projectName}`
            : 'Update task information'
        }
      />

      <TaskForm
        mode="edit"
        projectId={projectIdNum}
        projectName={project?.projectName}
        task={taskToEdit}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
        onSubmit={handleSubmit}
        onDelete={() => setShowDeleteDialog(true)}
        onCancel={() => router.back()}
      />

      <SaveTaskDialog
        open={showSaveDialog}
        onOpenChange={(open) => {
          setShowSaveDialog(open);
          if (!open) setPendingSubmitData(null);
        }}
        isPending={isSubmitting}
        onConfirm={confirmSave}
      />

      <DeleteTaskDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        taskTitle={taskToEdit.title}
        isPending={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
