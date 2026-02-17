'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { logger } from '@/lib/logger';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ProjectStatus } from '@/types/project/project-status';
import { mockProjects, mockEmployees } from '@/components/shared/mock-data';
import type { Project } from '@/types/project/project';
import { toast } from '@/lib/styles/toast-styles';
import { format } from 'date-fns';
import type { Employee } from '@/types/employee';
import type { Member } from '@/types/member';
import {
  ProjectEditForm,
  TeamMembersSection,
  AttachmentsSection,
} from '@/features/projects/components';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Number(params.id);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    projectName: '',
    projectAddress: '',
    status: ProjectStatus.upcoming as ProjectStatus,
    projectLatitude: '',
    projectLongitude: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  useEffect(() => {
    // Simulate loading project data
    const loadProject = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        const foundProject = mockProjects.find((p) => p.id === projectId);

        if (!foundProject) {
          toast.error('Project not found');
          router.push('/dashboard/projects');
          return;
        }

        setProject(foundProject);

        // Populate form with project data
        setFormData({
          projectName: foundProject.projectName,
          projectAddress: foundProject.projectAddress,
          status: foundProject.status,
          projectLatitude: foundProject.projectLatitude.toString(),
          projectLongitude: foundProject.projectLongitude.toString(),
          startDate: foundProject.startDate
            ? format(foundProject.startDate, 'yyyy-MM-dd')
            : '',
          endDate: foundProject.endDate
            ? format(foundProject.endDate, 'yyyy-MM-dd')
            : '',
          description: '',
        });

        // Populate members
        setSelectedMembers(foundProject.members || []);
      } catch (error) {
        logger.error('Error loading project:', error);
        toast.error('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as ProjectStatus }));
  };

  const handleAddMember = (employee: Employee) => {
    const isAlreadyAdded = selectedMembers.some(
      (m) => m.memberEmail === employee.email
    );

    if (isAlreadyAdded) {
      toast.error('Member already added to the project');
      return;
    }

    const newMember: Member = {
      id: employee.id,
      memberName: employee.name,
      memberEmail: employee.email,
      memberPhone: employee.phone,
      memberRole: '',
      department: employee.department ?? '',
      designation: (employee as Employee).designation,
      memberImage: employee.profilePicture?.file,
    };

    setSelectedMembers((prev) => [...prev, newMember]);
    toast.success(`${employee.name} added to the team`);
  };

  const handleRemoveMember = (memberEmail: string) => {
    setSelectedMembers((prev) =>
      prev.filter((m) => m.memberEmail !== memberEmail)
    );
    toast.success('Member removed from the team');
  };

  // Handle attachments with functional setState
  const handleAttachmentsChange = (files: File[]) => {
    setAttachments(files);
  };

  // Remove attachment with functional setState
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const availableEmployees = mockEmployees.filter(
    (emp) => !selectedMembers.some((m) => m.memberEmail === emp.email)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.projectName.trim()) {
        toast.error('Project name is required');
        setIsSubmitting(false);
        return;
      }

      if (!formData.projectAddress.trim()) {
        toast.error('Project address is required');
        setIsSubmitting(false);
        return;
      }

      // Build FormData for file uploads
      const submitData = new FormData();

      // Append form fields
      submitData.append('projectName', formData.projectName);
      submitData.append('projectAddress', formData.projectAddress);
      submitData.append('status', formData.status);
      submitData.append('projectLatitude', formData.projectLatitude);
      submitData.append('projectLongitude', formData.projectLongitude);
      submitData.append('startDate', formData.startDate);
      submitData.append('endDate', formData.endDate);
      submitData.append('description', formData.description);

      // Append team members
      submitData.append('members', JSON.stringify(selectedMembers));

      // Append file attachments
      for (const [index, file] of attachments.entries()) {
        submitData.append(`attachments[${index}]`, file);
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Replace with actual API call
      logger.debug('Updating project:', {
        projectId,
        formData,
        attachments: attachments.length,
      });

      toast.success('Project updated successfully!');
      router.push('/dashboard/projects');
    } catch (error) {
      logger.error('Error updating project:', error);
      toast.error('Failed to update project. Please try again.');
      setIsSubmitting(false);
    }
  };

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

  if (!project) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Project Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The project you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/users/dashboard/projects">Back to Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Edit Project</h1>
        <p className="text-muted-foreground">
          Update project information for {project.projectName}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              Update the details for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Form Fields */}
            <ProjectEditForm
              formData={formData}
              onInputChange={handleInputChange}
              onStatusChange={handleStatusChange}
            />

            {/* Team Members */}
            <TeamMembersSection
              selectedMembers={selectedMembers}
              availableEmployees={availableEmployees}
              isDialogOpen={isAddMemberDialogOpen}
              onDialogOpenChange={setIsAddMemberDialogOpen}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
            />

            {/* Attachments */}
            <AttachmentsSection
              existingAttachments={project.attachments}
              newAttachments={attachments}
              onAttachmentsChange={handleAttachmentsChange}
              onRemoveAttachment={removeAttachment}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4">
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
                    <span className="border-background mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
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
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
