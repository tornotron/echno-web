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
import { useIssue, useUpdateIssue, useDeleteIssue } from '@/hooks/issue';
import { useProject } from '@/hooks/project/use-projects';
import { routes } from '@/nav';
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
  const deleteMutation = useDeleteIssue();

  const isSubmitting = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  async function handleSubmit(data: IssueFormSubmitData) {
    if (!issue) return;
    try {
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
        files: { attachments: data.attachments },
      });
      router.push(
        routes.portfolio.projects.allProjects
          .detail(projectId)
          .issues.detail(issueId).href
      );
    } catch {
      // error toast already shown by mutation hook
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
      router.push(
        routes.portfolio.projects.allProjects.detail(projectId).issues.href
      );
    } catch {
      // error toast already shown by mutation hook
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
              routes.portfolio.projects.allProjects.detail(projectId).issues
                .href
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
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        onCancel={() => router.back()}
      />
    </div>
  );
}
