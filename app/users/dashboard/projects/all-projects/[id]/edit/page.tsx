'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  useProject,
  useUpdateProjectWithFiles,
} from '@tornotron/echno-core/project/hooks';
import type {
  ProjectType,
  UpdateProjectRequest,
} from '@tornotron/echno-core/project/types';
import { projectKeys } from '@tornotron/echno-core/project/hooks/keys';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { routes } from '@/nav';
import {
  ProjectForm,
  PROJECT_FORM_ID,
  type ProjectFormSubmitData,
} from '@/features/projects/components';
import { useClearFormDraft } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { useDirectAttachmentUpload } from '@/hooks/use-direct-attachment-upload';
import { AttachmentEntityType } from '@/lib/attachments/entity-types';

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id
    ? Number.parseInt(params.id as string)
    : undefined;

  const { data: project, isLoading, error } = useProject(projectId);
  const updateProjectWithFiles = useUpdateProjectWithFiles();
  const directUpload = useDirectAttachmentUpload();
  const queryClient = useQueryClient();
  const clearFormDraft = useClearFormDraft();

  const isSubmitting =
    updateProjectWithFiles.isPending || directUpload.isUploading;

  function handleSubmit(data: ProjectFormSubmitData) {
    if (!project) return;
    // `projectType` is included so the chosen category flows through once the
    // core project serializer forwards it (core 1.4.0 types the field on
    // Project but does not yet emit it on create/update).
    const updateData: UpdateProjectRequest & { projectType?: ProjectType } = {
      projectName: data.fields.projectName,
      projectAddress: data.fields.projectAddress,
      status: data.fields.status,
      projectType: data.fields.projectType || undefined,
      description: data.fields.description ?? undefined,
      projectLatitude: (() => {
        const v = Number.parseFloat(data.fields.projectLatitude);
        return Number.isNaN(v) ? undefined : v;
      })(),
      projectLongitude: (() => {
        const v = Number.parseFloat(data.fields.projectLongitude);
        return Number.isNaN(v) ? undefined : v;
      })(),
      startDate: data.fields.startDate
        ? new Date(data.fields.startDate)
        : undefined,
      endDate: data.fields.endDate ? new Date(data.fields.endDate) : undefined,
    };
    try {
      updateProjectWithFiles.mutate(
        {
          id: project.id,
          data: updateData,
          // Update the project JSON-only (no attachments in the multipart body);
          // newly-added attachments upload direct-to-storage in onSuccess. The
          // legacy path of passing `files: { attachments }` here still works and
          // is the fallback until this flow is verified across entity types.
          files: {},
        },
        {
          onSuccess: async () => {
            clearFormDraft(FORM_DRAFT_IDS.PROJECT, project.id);

            if (data.attachments.length > 0) {
              const result = await directUpload.upload(
                project.id,
                AttachmentEntityType.PROJECT_ATTACHMENTS,
                data.attachments
              );
              // The JSON-only update set the project cache with pre-upload
              // attachments; invalidate so the detail refetches the new files.
              if (result.attachments.length > 0) {
                queryClient.invalidateQueries({
                  queryKey: projectKeys.detail(project.id),
                });
              }
              if (result.errors.length > 0) {
                toast.warning('Project updated, some files failed', {
                  description: `${result.errors.length} of ${data.attachments.length} attachment(s) did not upload. Please try adding them again.`,
                });
                return;
              }
            }
            toast.success('Project Updated', {
              description: 'The project has been updated successfully',
            });
            router.push(routes.projects.allProjects.detail(project.id).href);
          },
          onError: (error) => {
            const title = getErrorTitle(error, 'Failed to Update Project');
            const description = getErrorMessage(error);
            toast.error(title, { description });
            logger.error('Failed to update project:', error);
          },
        }
      );
    } catch (error) {
      logger.error('Error updating project:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-40 items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold">
            {error ? 'Failed to load project' : 'Project Not Found'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {error instanceof Error
              ? error.message
              : "The project you're looking for doesn't exist."}
          </p>
          <Button className="mt-4" asChild>
            <Link href={routes.projects.href}>Back to Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="Edit Project"
        description={`Update details for ${project.projectName}`}
        actions={
          <>
            <Button variant="outline" disabled={isSubmitting} asChild>
              <Link href={routes.projects.allProjects.detail(project.id).href}>
                Cancel
              </Link>
            </Button>
            <Button
              type="submit"
              form={PROJECT_FORM_ID}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </>
        }
      />
      <ProjectForm
        mode="edit"
        project={project}
        uploadStates={directUpload.states}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
