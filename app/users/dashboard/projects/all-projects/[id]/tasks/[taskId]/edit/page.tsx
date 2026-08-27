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
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useProject } from '@tornotron/echno-core/project/hooks';
import {
  useDeleteTask,
  useTask,
  useUpdateTask,
} from '@tornotron/echno-core/task/hooks';
import { useClearFormDraft } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { taskKeys } from '@tornotron/echno-core/task/hooks/keys';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkCategories } from '@tornotron/echno-core/work-category/hooks';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import { toast } from '@/lib/styles/toast-styles';
import { routes } from '@/nav';
import {
  TaskForm,
  SaveTaskDialog,
  DeleteTaskDialog,
  type TaskFormSubmitData,
} from '@/features/tasks/components';
import type { UpdateTaskRequest } from '@tornotron/echno-core/task/types';
import { useDirectAttachmentUpload } from '@/hooks/use-direct-attachment-upload';
import { AttachmentEntityType } from '@/lib/attachments/entity-types';

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
  const clearFormDraft = useClearFormDraft();
  const deleteTask = useDeleteTask();
  const directUpload = useDirectAttachmentUpload();
  const queryClient = useQueryClient();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<{
    id: number;
    data: UpdateTaskRequest;
    attachments: File[];
  } | null>(null);

  const isSubmitting = updateTask.isPending || directUpload.isUploading;
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
      attachments: data.attachments,
    });
    setShowSaveDialog(true);
  }

  function confirmSave() {
    if (!pendingSubmitData) return;
    const { id, data, attachments } = pendingSubmitData;
    // Update the task JSON-only, then upload any newly-added attachments
    // direct-to-storage. The legacy multipart path (passing
    // `files: { attachments }` into the update mutation) still works and is the
    // fallback until this flow is verified across entity types.
    updateTask.mutate(
      { id, data },
      {
        onSuccess: async () => {
          // The record exists now, so the local draft describes work already
          // done. Left behind it would be offered on the next visit here.
          clearFormDraft(FORM_DRAFT_IDS.TASK, id, projectIdNum);

          if (attachments.length > 0) {
            const result = await directUpload.upload(
              id,
              AttachmentEntityType.TASK_ATTACHMENTS,
              attachments
            );
            // The JSON-only update set the task cache with pre-upload
            // attachments; invalidate so the detail refetches the new files.
            if (result.attachments.length > 0) {
              queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
            }
            if (result.errors.length > 0) {
              toast.warning('Task updated, some files failed', {
                description: `${result.errors.length} of ${attachments.length} attachment(s) did not upload. Please try adding them again.`,
              });
              return;
            }
          }
          toast.success('Task Updated', {
            description: 'The task has been updated successfully',
          });
          router.push(
            routes.projects.allProjects.detail(projectId).tasks.detail(taskId)
              .href
          );
        },
        onError: (error) => {
          const title = getErrorTitle(error, 'Failed to Update Task');
          const description = getErrorMessage(error);
          toast.error(title, { description });
          logger.error('Failed to update task:', error);
        },
        onSettled: () => {
          setShowSaveDialog(false);
          setPendingSubmitData(null);
        },
      }
    );
  }

  function confirmDelete() {
    deleteTask.mutate(taskId, {
      onSuccess: () => {
        toast.success('Task Deleted', {
          description: 'The task has been deleted successfully',
        });
        router.push(routes.projects.allProjects.detail(projectId).tasks.href);
      },
      onError: (error) => {
        const title = getErrorTitle(error, 'Failed to Delete Task');
        const description = getErrorMessage(error);
        toast.error(title, { description });
        logger.error('Failed to delete task:', error);
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
              routes.projects.allProjects.detail(projectId).tasks.href
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
        uploadStates={directUpload.states}
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
