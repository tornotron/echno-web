'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { logger } from '@/lib/logger';
import { AppLayout } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  Loader2,
  X,
  UserPlus,
  Plus,
  Upload,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import {
  ProjectStatus,
  getProjectStatusLabel,
} from '@/types/project/project-status';
import { mockProjects, mockEmployees } from '@/components/shared/mock-data';
import type { Project } from '@/types/project/project';
import { toast } from '@/lib/styles/toast-styles';
import { format } from 'date-fns';
import type { Employee } from '@/types/employee';
import type { Member } from '@/types/member';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
      memberRole: employee.roles?.[0] || '',
      department: employee.department,
      designation: (employee as Employee).designation,
      memberImage: employee.profilePictureUrl,
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

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = [...e.target.files];
      setAttachments([...attachments, ...newFiles]);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
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

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Replace with actual API call
      logger.debug('Updating project:', { projectId, ...formData });

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
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
            <p className="text-muted-foreground mt-4">Loading project...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
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
      </AppLayout>
    );
  }

  return (
    <AppLayout>
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
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="projectName">
                  Project Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  placeholder="e.g., Sunrise Tower"
                  required
                />
              </div>

              {/* Project Address */}
              <div className="space-y-2">
                <Label htmlFor="projectAddress">
                  Project Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="projectAddress"
                  name="projectAddress"
                  value={formData.projectAddress}
                  onChange={handleInputChange}
                  placeholder="Enter the complete project address"
                  rows={3}
                  required
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProjectStatus.upcoming}>
                      {getProjectStatusLabel(ProjectStatus.upcoming)}
                    </SelectItem>
                    <SelectItem value={ProjectStatus.open}>
                      {getProjectStatusLabel(ProjectStatus.open)}
                    </SelectItem>
                    <SelectItem value={ProjectStatus.onHold}>
                      {getProjectStatusLabel(ProjectStatus.onHold)}
                    </SelectItem>
                    <SelectItem value={ProjectStatus.completed}>
                      {getProjectStatusLabel(ProjectStatus.completed)}
                    </SelectItem>
                    <SelectItem value={ProjectStatus.closed}>
                      {getProjectStatusLabel(ProjectStatus.closed)}
                    </SelectItem>
                    <SelectItem value={ProjectStatus.cancelled}>
                      {getProjectStatusLabel(ProjectStatus.cancelled)}
                    </SelectItem>
                    <SelectItem value={ProjectStatus.dropped}>
                      {getProjectStatusLabel(ProjectStatus.dropped)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Location Coordinates */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectLatitude">Latitude</Label>
                  <Input
                    id="projectLatitude"
                    name="projectLatitude"
                    type="number"
                    step="any"
                    value={formData.projectLatitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 19.0760"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectLongitude">Longitude</Label>
                  <Input
                    id="projectLongitude"
                    name="projectLongitude"
                    type="number"
                    step="any"
                    value={formData.projectLongitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 72.8777"
                  />
                </div>
              </div>

              {/* Team Members */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Team Members</Label>
                  <Dialog
                    open={isAddMemberDialogOpen}
                    onOpenChange={setIsAddMemberDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add Team Members</DialogTitle>
                        <DialogDescription>
                          Select employees from your organization to add to this
                          project
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        {availableEmployees.length === 0 ? (
                          <p className="text-muted-foreground py-8 text-center">
                            All employees have been added to the team
                          </p>
                        ) : (
                          availableEmployees.map((employee) => (
                            <div
                              key={employee.id}
                              className="hover:bg-accent flex items-center justify-between rounded-lg border p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-semibold">
                                  {employee.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-medium">{employee.name}</p>
                                  <p className="text-muted-foreground text-sm">
                                    {(employee as Employee).designation} •{' '}
                                    {employee.department}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  handleAddMember(employee);
                                  setIsAddMemberDialogOpen(false);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {selectedMembers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No team members added yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedMembers.map((member) => (
                      <div
                        key={member.memberEmail}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-semibold">
                            {member.memberName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium">{member.memberName}</p>
                            <p className="text-muted-foreground text-sm">
                              {member.designation} • {member.department}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.memberEmail)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter project description (optional)"
                  rows={4}
                />
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="space-y-4">
                  {/* Existing Attachments */}
                  {project.attachments && project.attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Current Attachments ({project.attachments.length})
                      </p>
                      {project.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                                {attachment.fileName}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {(attachment.fileSize / 1024 / 1024).toFixed(2)}{' '}
                                MB
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Attachments Upload */}
                  <div className="space-y-2">
                    <Input
                      id="attachments"
                      type="file"
                      onChange={handleFileChange}
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.dwg,.dxf"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        (
                          document.querySelector('#attachments') as HTMLElement
                        )?.click()
                      }
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload New Files
                    </Button>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      PDF, DOC, DOCX, JPG, PNG, XLSX, DWG, DXF (Max 10MB each)
                    </p>
                  </div>

                  {/* New Files to Upload */}
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        New Files to Upload ({attachments.length})
                      </p>
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                                {file.name}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
    </AppLayout>
  );
}
