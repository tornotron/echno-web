'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { useUser } from '@/hooks/user/use-user';
import { useCreateProjectWithFiles } from '@/hooks/project/use-project-mutations';
import { useCreateStorageLocation } from '@/hooks/storage-locations';
import { StorageLocationType } from '@/types/storage-locations';
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

export default function NewProjectPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: isUserLoading } = useUser();
  const createProjectWithFiles = useCreateProjectWithFiles();
  const createStorageLocation = useCreateStorageLocation();

  const isSubmitting = createProjectWithFiles.isPending;

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
    try {
      createProjectWithFiles.mutate(
        {
          data: {
            projectName: data.fields.projectName,
            projectAddress: data.fields.projectAddress,
            status: data.fields.status,
            projectLatitude:
              Number.parseFloat(data.fields.projectLatitude) || 0,
            projectLongitude:
              Number.parseFloat(data.fields.projectLongitude) || 0,
            startDate: data.fields.startDate
              ? new Date(data.fields.startDate)
              : undefined,
            endDate: data.fields.endDate
              ? new Date(data.fields.endDate)
              : undefined,
          },
          files: {
            attachments:
              data.attachments.length > 0 ? data.attachments : undefined,
          },
        },
        {
          onSuccess: (createdProject) => {
            if (data.createLocationForProject) {
              createStorageLocation.mutate({
                locationName: createdProject.projectName,
                locationType: StorageLocationType.PROJECT_SITE,
                address: createdProject.projectAddress,
                latitude:
                  Number.parseFloat(data.fields.projectLatitude) || undefined,
                longitude:
                  Number.parseFloat(data.fields.projectLongitude) || undefined,
                projectId: createdProject.id,
                projectName: createdProject.projectName,
                active: true,
              });
            }
            router.push(
              routes.portfolio.projects.allProjects.detail(createdProject.id)
                .href
            );
          },
        }
      );
    } catch (error) {
      logger.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
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
      <ProjectForm mode="create" onSubmit={handleSubmit} />
    </div>
  );
}
