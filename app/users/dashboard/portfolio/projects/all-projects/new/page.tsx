'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { useCreateProjectWithFiles } from '@tornotron/echno-core/project/hooks';
import type {
  ProjectType,
  CreateProjectRequest,
} from '@tornotron/echno-core/project/types';
import { projectKeys } from '@tornotron/echno-core/project/hooks/keys';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateStorageLocation } from '@tornotron/echno-core/storage-locations/hooks';
import { StorageLocationType } from '@tornotron/echno-core/storage-locations/types';
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
import { useDirectAttachmentUpload } from '@/hooks/use-direct-attachment-upload';
import { AttachmentEntityType } from '@/lib/attachments/entity-types';

export default function NewProjectPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: isUserLoading } = useUser();
  const createProjectWithFiles = useCreateProjectWithFiles();
  const createStorageLocation = useCreateStorageLocation();
  const directUpload = useDirectAttachmentUpload();
  const queryClient = useQueryClient();

  const isSubmitting =
    createProjectWithFiles.isPending || directUpload.isUploading;

  if (isUserLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-40 items-center justify-center text-center">
        <p className="text-red-500">User not found. Please log in again.</p>
      </div>
    );
  }

  function handleSubmit(data: ProjectFormSubmitData) {
    if (!currentUser?.id) {
      toast.error('User not found', { description: 'Please log in again' });
      return;
    }
    // `projectType` is included so the chosen category flows through once the
    // core project serializer forwards it (core 1.4.0 types the field on
    // Project but does not yet emit it on create/update).
    const createData: CreateProjectRequest & { projectType?: ProjectType } = {
      projectName: data.fields.projectName,
      projectAddress: data.fields.projectAddress,
      status: data.fields.status,
      projectType: data.fields.projectType || undefined,
      description: data.fields.description,
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
      createProjectWithFiles.mutate(
        {
          data: createData,
          // Create the project JSON-only (no attachments in the multipart body);
          // attachments upload direct-to-storage in onSuccess against the new
          // id. The legacy path of passing `files: { attachments }` here still
          // works and is the fallback until this flow is verified per entity.
          files: {},
        },
        {
          onSuccess: async (createdProject) => {
            if (data.attachments.length > 0) {
              const result = await directUpload.upload(
                createdProject.id,
                AttachmentEntityType.PROJECT_ATTACHMENTS,
                data.attachments
              );
              // The create set the project detail cache with no attachments;
              // invalidate so the detail page refetches the new files.
              if (result.attachments.length > 0) {
                queryClient.invalidateQueries({
                  queryKey: projectKeys.detail(createdProject.id),
                });
              }
              if (result.errors.length > 0) {
                toast.warning('Project created, some files failed', {
                  description: `${result.errors.length} of ${data.attachments.length} attachment(s) did not upload. You can re-add them from the project.`,
                });
              }
            }
            if (data.createLocationForProject) {
              createStorageLocation.mutate(
                {
                  locationName: createdProject.projectName,
                  locationType: StorageLocationType.PROJECT_SITE,
                  address: createdProject.projectAddress,
                  latitude: (() => {
                    const v = Number.parseFloat(data.fields.projectLatitude);
                    return Number.isNaN(v) ? undefined : v;
                  })(),
                  longitude: (() => {
                    const v = Number.parseFloat(data.fields.projectLongitude);
                    return Number.isNaN(v) ? undefined : v;
                  })(),
                  projectId: createdProject.id,
                  projectName: createdProject.projectName,
                  active: true,
                },
                {
                  onSuccess: () => {
                    toast.success('Location Created', {
                      description:
                        'The storage location has been created successfully',
                    });
                  },
                  onError: (error) => {
                    toast.error(
                      getErrorTitle(error, 'Failed to Create Storage Location'),
                      { description: getErrorMessage(error) }
                    );
                  },
                }
              );
            }
            toast.success('Project Created', {
              description: 'The project has been created successfully',
            });
            router.push(
              routes.portfolio.projects.allProjects.detail(createdProject.id)
                .href
            );
          },
          onError: (error) => {
            const title = getErrorTitle(error, 'Failed to Create Project');
            const description = getErrorMessage(error);
            toast.error(title, { description });
            logger.error('Failed to create project:', error);
          },
        }
      );
    } catch (error) {
      logger.error('Error creating project:', error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="Create New Project"
        description="Add a new project to your workspace"
        actions={
          <>
            <Button variant="outline" disabled={isSubmitting} asChild>
              <Link href={routes.portfolio.projects.allProjects.href}>
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </>
        }
      />
      <ProjectForm
        mode="create"
        uploadStates={directUpload.states}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
