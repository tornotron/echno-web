'use client';

import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useProject } from '@tornotron/echno-core/project/hooks';
import { useClearFormDraft } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { useCreateTask } from '@tornotron/echno-core/task/hooks';
import { useWorkCategories } from '@tornotron/echno-core/work-category/hooks';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import { PageHeader } from '@/components/common';
import { toast } from '@/lib/styles/toast-styles';
import { routes } from '@/nav';
import { TaskForm, type TaskFormSubmitData } from '@/features/tasks/components';
import type { CreateTaskRequest } from '@tornotron/echno-core/task/types';
import { useDirectAttachmentUpload } from '@/hooks/use-direct-attachment-upload';
import { AttachmentEntityType } from '@/lib/attachments/entity-types';

export default function NewTaskPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Number.parseInt(params.id as string);

  const { data: project } = useProject(projectId);
  const { data: workCategories = [] } = useWorkCategories();
  const { data: currentEmployee } = useCurrentUserEmployee();
  const createTask = useCreateTask();
  const clearFormDraft = useClearFormDraft();
  const directUpload = useDirectAttachmentUpload();

  const isSubmitting = createTask.isPending || directUpload.isUploading;

  function buildRequest(data: TaskFormSubmitData): CreateTaskRequest {
    const selectedCategory = workCategories.find(
      (c) => c.id.toString() === data.fields.categoryId
    );
    return {
      title: data.fields.title,
      projectId,
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
  }

  function handleSubmit(data: TaskFormSubmitData) {
    // Create the task JSON-only, then upload attachments direct-to-storage
    // against the new id. The legacy multipart path (passing
    // `files: { attachments }` into the create mutation) still works and is the
    // fallback until this flow is verified across entity types.
    createTask.mutate(
      { data: buildRequest(data) },
      {
        onSuccess: async (created) => {
          // The record exists now, so the local draft describes work already
          // done. Left behind it would be offered on the next visit here.
          clearFormDraft(FORM_DRAFT_IDS.TASK, undefined, projectId);

          if (data.attachments.length > 0) {
            const result = await directUpload.upload(
              created.id,
              AttachmentEntityType.TASK_ATTACHMENTS,
              data.attachments
            );
            if (result.errors.length > 0) {
              toast.warning('Task created, some files failed', {
                description: `${result.errors.length} of ${data.attachments.length} attachment(s) did not upload. You can re-add them from the task.`,
              });
              router.push(
                routes.projects.allProjects.detail(projectId).tasks.href
              );
              return;
            }
          }

          toast.success('Task Created', {
            description: 'The task has been created successfully',
          });
          router.push(routes.projects.allProjects.detail(projectId).tasks.href);
        },
        onError: (error) => {
          const title = getErrorTitle(error, 'Failed to Create Task');
          const description = getErrorMessage(error);
          toast.error(title, { description });
          logger.error('Failed to create task:', error);
        },
      }
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Create New Task"
        description={
          project
            ? `Add a new task to ${project.projectName}`
            : 'Add a new task to your project'
        }
      />
      <TaskForm
        mode="create"
        projectId={projectId}
        projectName={project?.projectName}
        isSubmitting={isSubmitting}
        uploadStates={directUpload.states}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
