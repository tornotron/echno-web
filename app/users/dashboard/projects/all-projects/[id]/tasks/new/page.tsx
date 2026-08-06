'use client';

import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useProject } from '@tornotron/echno-core/project/hooks';
import { useCreateTask } from '@tornotron/echno-core/task/hooks';
import { useWorkCategories } from '@tornotron/echno-core/work-category/hooks';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import { PageHeader } from '@/components/common';
import { toast } from '@/lib/styles/toast-styles';
import { routes } from '@/nav';
import { TaskForm, type TaskFormSubmitData } from '@/features/tasks/components';
import type { CreateTaskRequest } from '@tornotron/echno-core/task/types';

export default function NewTaskPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Number.parseInt(params.id as string);

  const { data: project } = useProject(projectId);
  const { data: workCategories = [] } = useWorkCategories();
  const { data: currentEmployee } = useCurrentUserEmployee();
  const createTask = useCreateTask();

  const isSubmitting = createTask.isPending;

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
    createTask.mutate(
      { data: buildRequest(data), files: { attachments: data.attachments } },
      {
        onSuccess: () => {
          if (data.isDraft) {
            toast.success('Draft saved');
          } else {
            toast.success('Task Created', {
              description: 'The task has been created successfully',
            });
          }
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
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
