'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { useUser } from '@/hooks/user/use-user';
import { useCreateProjectWithFiles } from '@/hooks/project/use-project-mutations';
import { useGeolocation } from '@/hooks/use-geolocation';
import { ProjectFiles } from '@/types/project';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Save, Upload, FileText, MapPin, Loader2, X } from 'lucide-react';
import { Checkbox } from '@/components/shadcn/checkbox';
import {
  ProjectStatus,
  getProjectStatusLabel,
} from '@/types/project/project-status';
import { StorageLocationType } from '@/types/storage-locations';
import { useCreateStorageLocation } from '@/hooks/storage-locations';
import { toast } from '@/lib/styles/toast-styles';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';

export default function NewProjectPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: isUserLoading } = useUser();
  const createProjectWithFiles = useCreateProjectWithFiles();
  const createStorageLocation = useCreateStorageLocation();
  const { isLoading: isGettingLocation, getCurrentLocation } = useGeolocation();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [createLocationForProject, setCreateLocationForProject] =
    useState(false);

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

  const handleGetLocation = useCallback(() => {
    getCurrentLocation((lat, lng) => {
      setFormData((prev) => ({
        ...prev,
        projectLatitude: lat.toString(),
        projectLongitude: lng.toString(),
      }));
    });
  }, [getCurrentLocation]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as ProjectStatus }));
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
      const selectedFiles = [...e.target.files];
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      for (const file of selectedFiles) {
        if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      }

      // Show error for oversized files
      if (invalidFiles.length > 0) {
        toast.error('Some files exceed 10MB', {
          description: `The following files were not added: ${invalidFiles.join(', ')}`,
        });
      }

      // Add only valid files
      if (validFiles.length > 0) {
        setAttachments([...attachments, ...validFiles]);
      }

      // Reset the input value so the same file can be selected again
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate user
    if (!currentUser?.id) {
      toast.error('User not found', {
        description: 'Please log in again',
      });
      return;
    }

    // Validate required fields
    if (!formData.projectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (!formData.projectAddress.trim()) {
      toast.error('Project address is required');
      return;
    }

    try {
      // Prepare project data
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

      // Prepare files
      const files: ProjectFiles = {
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      // Create project
      createProjectWithFiles.mutate(
        { data: projectData, files },
        {
          onSuccess: (createdProject) => {
            if (createLocationForProject) {
              createStorageLocation.mutate(
                {
                  locationName: formData.projectName,
                  locationType: StorageLocationType.PROJECT_SITE,
                  address: formData.projectAddress,
                  latitude:
                    Number.parseFloat(formData.projectLatitude) || undefined,
                  longitude:
                    Number.parseFloat(formData.projectLongitude) || undefined,
                  projectId: createdProject.id,
                  projectName: createdProject.projectName,
                  active: true,
                },
                {}
              );
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
  };

  const isSubmitting = createProjectWithFiles.isPending;

  // Loading state for user
  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // User check
  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">User not found</p>
          <p className="text-sm text-zinc-600">Please log in again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Create New Project"
        description="Add a new project to your workspace"
      />

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              Enter the basic details for the new project
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Location Coordinates</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Get Current Location
                    </>
                  )}
                </Button>
              </div>
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
                    Upload Files
                  </Button>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    PDF, DOC, DOCX, JPG, PNG, XLSX, DWG, DXF (Max 10MB each)
                  </p>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Selected Files ({attachments.length})
                    </p>
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
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

            {/* Create Storage Location */}
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Checkbox
                id="createLocation"
                checked={createLocationForProject}
                onCheckedChange={(checked) =>
                  setCreateLocationForProject(checked === true)
                }
              />
              <div>
                <label
                  htmlFor="createLocation"
                  className="cursor-pointer text-sm leading-none font-medium"
                >
                  Create storage location for this project
                </label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Automatically creates a Project Site storage location using
                  the same name, address, and coordinates.
                </p>
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Project
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
