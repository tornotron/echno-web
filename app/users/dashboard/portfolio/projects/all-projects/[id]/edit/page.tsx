'use client';

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { logger } from '@/lib/logger';
import { useProject } from '@/hooks/project/use-projects';
import { useUpdateProjectWithFiles } from '@/hooks/project/use-project-mutations';
import { ProjectFiles } from '@/types/project';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ProjectStatus } from '@/types/project/project-status';
import type { Project } from '@/types/project/project';
import { toast } from '@/lib/styles/toast-styles';
import { format } from 'date-fns';
import {
  ProjectEditForm,
  AttachmentsSection,
} from '@/features/projects/components';
import { routes } from '@/nav';

function EditProjectForm({ project }: { project: Project }) {
  const router = useRouter();
  const updateProjectWithFiles = useUpdateProjectWithFiles();

  const [attachments, setAttachments] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    projectName: project.projectName,
    projectAddress: project.projectAddress,
    status: project.status,
    projectLatitude: project.projectLatitude.toString(),
    projectLongitude: project.projectLongitude.toString(),
    startDate: project.startDate ? format(project.startDate, 'yyyy-MM-dd') : '',
    endDate: project.endDate ? format(project.endDate, 'yyyy-MM-dd') : '',
    description: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as ProjectStatus }));
  };

  const handleLocationUpdate = useCallback(
    (latitude: string, longitude: string) => {
      setFormData((prev) => ({
        ...prev,
        projectLatitude: latitude,
        projectLongitude: longitude,
      }));
    },
    []
  );

  const handleAttachmentsChange = (files: File[]) => {
    setAttachments(files);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (!formData.projectAddress.trim()) {
      toast.error('Project address is required');
      return;
    }

    try {
      const projectData = {
        projectName: formData.projectName,
        projectAddress: formData.projectAddress,
        status: formData.status,
        projectLatitude: Number.parseFloat(formData.projectLatitude) || 0,
        projectLongitude: Number.parseFloat(formData.projectLongitude) || 0,
        startDate: formData.startDate
          ? new Date(formData.startDate)
          : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      };

      const files: ProjectFiles = {
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      updateProjectWithFiles.mutate(
        { id: project.id, data: projectData, files },
        {
          onSuccess: () => {
            router.push(
              routes.portfolio.projects.allProjects.detail(project.id).href
            );
          },
        }
      );
    } catch (error) {
      logger.error('Error updating project:', error);
      toast.error('Failed to update project. Please try again.');
    }
  };

  const isSubmitting = updateProjectWithFiles.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Project</h1>
        <p className="text-muted-foreground">
          Update project information for {project.projectName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              Update the details for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProjectEditForm
              formData={formData}
              onInputChange={handleInputChange}
              onStatusChange={handleStatusChange}
              onLocationUpdate={handleLocationUpdate}
            />
          </CardContent>
        </Card>

        <AttachmentsSection
          existingAttachments={project.attachments}
          newAttachments={attachments}
          onAttachmentsChange={handleAttachmentsChange}
          onRemoveAttachment={removeAttachment}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
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
        </div>
      </form>
    </div>
  );
}

export default function EditProjectPage() {
  const params = useParams();
  const projectId = params.id
    ? Number.parseInt(params.id as string)
    : undefined;

  const { data: project, isLoading, error } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground mt-4">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Failed to load project</h2>
          <p className="text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button className="mt-4" asChild>
            <Link href={routes.portfolio.projects.href}>Back to Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Project Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The project you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button className="mt-4" asChild>
            <Link href={routes.portfolio.projects.href}>Back to Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <EditProjectForm project={project} />;
}
