'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  ProjectStatus,
  getProjectStatusLabel,
} from '@/types/project/project-status';
import { mockProjects } from '@/components/shared/mock-data';
import type { Project } from '@/types/project/project';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Number(params.id);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

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
      } catch (error) {
        console.error('Error loading project:', error);
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
      console.log('Updating project:', { projectId, ...formData });

      toast.success('Project updated successfully!');
      router.push('/dashboard/projects');
    } catch (error) {
      console.error('Error updating project:', error);
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
              <Link href="/dashboard/projects">Back to Projects</Link>
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
