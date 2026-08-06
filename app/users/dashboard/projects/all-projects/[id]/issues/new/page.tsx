'use client';

import { use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useProject } from '@tornotron/echno-core/project/hooks';
import { useCreateIssue } from '@tornotron/echno-core/issue/hooks';
import { useUser, useUserEmployees } from '@tornotron/echno-core/user/hooks';
import { IssueStatus } from '@tornotron/echno-core/issue/types';
import { PageHeader } from '@/components/common';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { routes } from '@/nav';
import {
  IssueForm,
  type IssueFormSubmitData,
} from '@/features/issues/components';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NewIssuePage({ params }: PageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromTaskId = searchParams.get('taskId') || '';
  const fromTaskTitle = searchParams.get('taskTitle') || '';

  const { data: project } = useProject(Number.parseInt(projectId));
  const createMutation = useCreateIssue();
  const { data: user } = useUser();
  const { data: employees = [] } = useUserEmployees();
  const currentEmployee = employees.find(
    (emp) => emp.organizationId === user?.defaultOrganizationId
  );

  const isSubmitting = createMutation.isPending;

  async function handleSubmit(data: IssueFormSubmitData) {
    if (!currentEmployee?.id) return;

    const issueData = {
      title: data.fields.title,
      description: data.fields.description,
      issueType: data.fields.issueType,
      status: data.isDraft ? IssueStatus.open : data.fields.status,
      projectId: Number.parseInt(projectId),
      taskId: data.fields.taskId ? Number(data.fields.taskId) : undefined,
      creatorId: currentEmployee.id,
      assigneeId: data.fields.assigneeId
        ? Number(data.fields.assigneeId)
        : undefined,
    };

    try {
      await createMutation.mutateAsync({
        data: issueData,
        files: { attachments: data.attachments },
      });
      toast.success('Issue Created', {
        description: 'The issue has been created successfully',
      });
      router.push(routes.projects.allProjects.detail(projectId).issues.href);
    } catch (error) {
      const title = getErrorTitle(error, 'Failed to Create Issue');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to create issue:', error);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Report New Issue"
        description={
          project
            ? `Document and track issues for ${project.projectName}`
            : 'Document and track issues or problems'
        }
      />
      <IssueForm
        mode="create"
        projectId={projectId}
        initialTaskId={fromTaskId}
        initialTaskTitle={fromTaskTitle}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
