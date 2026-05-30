'use client';

import { use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProject } from '@/hooks/project/use-projects';
import { useCreateIssue } from '@/hooks/issue';
import { useUser, useUserEmployees } from '@/hooks/user/use-user';
import { IssueStatus } from '@/types/issue/issue-status';
import { PageHeader } from '@/components/common';
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
      router.push(
        routes.portfolio.projects.allProjects.detail(projectId).issues.href
      );
    } catch {
      // error toast already shown by mutation hook
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
