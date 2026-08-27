'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  useDeleteIssue,
  useIssue,
  useUpdateIssue,
} from '@tornotron/echno-core/issue/hooks';
import { useClearFormDraft } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { issueKeys } from '@tornotron/echno-core/issue/hooks/keys';
import { useQueryClient } from '@tanstack/react-query';
import { useProject } from '@tornotron/echno-core/project/hooks';
import { routes } from '@/nav';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { useDirectAttachmentUpload } from '@/hooks/use-direct-attachment-upload';
import { AttachmentEntityType } from '@/lib/attachments/entity-types';
import {
  IssueForm,
  type IssueFormSubmitData,
} from '@/features/issues/components';

interface PageProps {
  params: Promise<{ id: string; issueId: string }>;
}

export default function EditIssuePage({ params }: PageProps) {
  const { id: projectId, issueId } = use(params);
  const router = useRouter();

  const { data: issue, isLoading } = useIssue(Number.parseInt(issueId));
  const { data: project } = useProject(Number.parseInt(projectId));
  const updateMutation = useUpdateIssue();
  const clearFormDraft = useClearFormDraft();
  const deleteMutation = useDeleteIssue();
  const directUpload = useDirectAttachmentUpload();
  const queryClient = useQueryClient();

  const isSubmitting = updateMutation.isPending || directUpload.isUploading;
  const isDeleting = deleteMutation.isPending;

  async function handleSubmit(data: IssueFormSubmitData) {
    if (!issue) return;
    try {
      // Update the issue JSON-only, then upload any newly-added attachments
      // direct-to-storage. The legacy multipart path (passing
      // `files: { attachments }` here) still works and is the fallback until
      // this flow is verified across entity types.
      await updateMutation.mutateAsync({
        id: issue.id,
        data: {
          title: data.fields.title,
          description: data.fields.description,
          issueType: data.fields.issueType,
          status: data.fields.status,
          assigneeId: data.fields.assigneeId
            ? Number(data.fields.assigneeId)
            : undefined,
        },
      });

      // The record exists now, so the local draft describes work already done.
      // Left behind it would be offered on the next visit to this form.
      clearFormDraft(FORM_DRAFT_IDS.ISSUE, issue.id, projectId);

      if (data.attachments.length > 0) {
        const result = await directUpload.upload(
          issue.id,
          AttachmentEntityType.ISSUE_ATTACHMENTS,
          data.attachments
        );
        // The JSON-only update set the issue cache with pre-upload attachments;
        // invalidate so the detail page refetches with the new files.
        if (result.attachments.length > 0) {
          queryClient.invalidateQueries({
            queryKey: issueKeys.detail(issue.id),
          });
        }
        if (result.errors.length > 0) {
          toast.warning('Issue updated, some files failed', {
            description: `${result.errors.length} of ${data.attachments.length} attachment(s) did not upload. Please try adding them again.`,
          });
          return;
        }
      }

      toast.success('Issue Updated', {
        description: 'The issue has been updated successfully',
      });
      router.push(
        routes.projects.allProjects.detail(projectId).issues.detail(issueId)
          .href
      );
    } catch (error) {
      const title = getErrorTitle(error, 'Failed to Update Issue');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to update issue:', error);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        'Are you sure you want to delete this issue? This action cannot be undone.'
      )
    ) {
      return;
    }
    if (!issue) return;
    try {
      await deleteMutation.mutateAsync(issue.id);
      toast.success('Issue Deleted', {
        description: 'The issue has been deleted successfully',
      });
      router.push(routes.projects.allProjects.detail(projectId).issues.href);
    } catch (error) {
      const title = getErrorTitle(error, 'Failed to Delete Issue');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to delete issue:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!issue) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <AlertCircle className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Issue not found</EmptyTitle>
          <EmptyDescription>
            The issue you&apos;re looking for doesn&apos;t exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          onClick={() =>
            router.push(
              routes.projects.allProjects.detail(projectId).issues.href
            )
          }
        >
          Back to Issues
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Edit Issue"
        description={
          project
            ? `Update issue in ${project.projectName}`
            : 'Update issue information'
        }
      />
      <IssueForm
        mode="edit"
        projectId={projectId}
        issue={issue}
        existingAttachments={issue.attachments}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
        uploadStates={directUpload.states}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        onCancel={() => router.back()}
      />
    </div>
  );
}
