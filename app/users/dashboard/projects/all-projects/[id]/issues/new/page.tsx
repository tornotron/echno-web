'use client';

import { use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useProject } from '@tornotron/echno-core/project/hooks';
import { useClearFormDraft } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { useCreateIssue } from '@tornotron/echno-core/issue/hooks';
import { useUser, useUserEmployees } from '@tornotron/echno-core/user/hooks';
import { IssueStatus } from '@tornotron/echno-core/issue/types';
import { PageHeader } from '@/components/common';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { routes } from '@/nav';
import { useDirectAttachmentUpload } from '@/hooks/use-direct-attachment-upload';
import { AttachmentEntityType } from '@/lib/attachments/entity-types';
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
  const clearFormDraft = useClearFormDraft();
  const directUpload = useDirectAttachmentUpload();
  const { data: user } = useUser();
  const { data: employees = [] } = useUserEmployees();
  const currentEmployee = employees.find(
    (emp) => emp.organizationId === user?.defaultOrganizationId
  );

  const isSubmitting = createMutation.isPending || directUpload.isUploading;

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
      // Create the issue JSON-only, then upload attachments direct-to-storage
      // against the new id. The legacy multipart path (passing
      // `files: { attachments }` into the create mutation) still works and is
      // the fallback until this flow is verified across entity types.
      const created = await createMutation.mutateAsync({ data: issueData });

      // The record exists now, so the local draft describes work already done.
      // Left behind it would be offered on the next visit to this form.
      clearFormDraft(FORM_DRAFT_IDS.ISSUE, undefined, projectId);

      if (data.attachments.length > 0) {
        const result = await directUpload.upload(
          created.id,
          AttachmentEntityType.ISSUE_ATTACHMENTS,
          data.attachments
        );
        if (result.errors.length > 0) {
          toast.warning('Issue created, some files failed', {
            description: `${result.errors.length} of ${data.attachments.length} attachment(s) did not upload. You can re-add them from the issue.`,
          });
          router.push(
            routes.projects.allProjects.detail(projectId).issues.href
          );
          return;
        }
      }

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
        uploadStates={directUpload.states}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
