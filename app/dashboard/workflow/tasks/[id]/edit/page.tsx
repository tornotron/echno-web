'use client';

import { useState, use } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  X,
  Save,
  AlertCircle,
  Users,
  FileText,
  Tag,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TaskStatus, getTaskStatusLabel } from '@/types/task/task-status';
import { mockTasks } from '@/components/shared/mock-data';
import { toast } from '@/lib/styles/toast-styles';

// Mock data for dropdowns
const mockProjects = [
  { id: 1, name: 'Metro Station Construction' },
  { id: 2, name: 'Highway Expansion Project' },
  { id: 3, name: 'Bridge Reconstruction' },
  { id: 4, name: 'Airport Terminal Development' },
];

const mockCategories = [
  { id: 1, name: 'Civil Engineering', icon: 'CE' },
  { id: 2, name: 'Electrical Works', icon: 'EW' },
  { id: 3, name: 'Mechanical Installation', icon: 'MI' },
  { id: 4, name: 'Safety & Compliance', icon: 'SC' },
  { id: 5, name: 'Quality Assurance', icon: 'QA' },
];

const mockMembers = [
  { id: 1, name: 'Rajesh Kumar', department: 'Engineering' },
  { id: 2, name: 'Priya Sharma', department: 'Engineering' },
  { id: 3, name: 'Amit Patel', department: 'Engineering' },
  { id: 4, name: 'Sneha Reddy', department: 'Quality' },
  { id: 5, name: 'Vikram Singh', department: 'Safety' },
];

const availableTags = [
  'Urgent',
  'High Priority',
  'Documentation',
  'Testing',
  'Review Required',
  'Client Deliverable',
  'Internal',
  'Blocked',
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditTaskPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Find the task to edit
  const taskToEdit = mockTasks.find((t) => t.id?.toString() === id);

  // Form state - initialize with existing task data
  const [projectId, setProjectId] = useState<string>(
    taskToEdit?.projectId?.toString() || ''
  );
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [startDate, setStartDate] = useState(
    taskToEdit?.startDate
      ? taskToEdit.startDate.toISOString().split('T')[0]
      : ''
  );
  const [endDate, setEndDate] = useState(
    taskToEdit?.endDate ? taskToEdit.endDate.toISOString().split('T')[0] : ''
  );
  const [categoryId, setCategoryId] = useState<string>(
    taskToEdit?.category?.id?.toString() || ''
  );
  const [status, setStatus] = useState<TaskStatus>(
    taskToEdit?.status || TaskStatus.upcoming
  );
  const [progress, setProgress] = useState(
    (taskToEdit?.progress || 0).toString()
  );
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    taskToEdit?.assignees?.map((a) => a.id?.toString() || '') || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    taskToEdit?.tags || []
  );
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  if (!taskToEdit) {
    return (
      <AppLayout>
        <div className="px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Task not found
              </h3>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                The task you&apos;re looking for doesn&apos;t exist.
              </p>
              <Button onClick={() => router.push('/dashboard/workflow/tasks')}>
                Back to Tasks
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

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

  // Toggle assignee
  const toggleAssignee = (memberId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Toggle tag
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Handle status change with immediate feedback
  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    toast.success('Status Updated', {
      description: `Task status changed to ${getTaskStatusLabel(newStatus)}`,
    });
  };

  // Handle progress change with immediate feedback
  const handleProgressChange = (newProgress: string) => {
    setProgress(newProgress);
    // Show toast only at milestones
    const progressNum = Number.parseInt(newProgress);
    if (progressNum % 25 === 0 && progressNum > 0) {
      toast.success('Progress Updated', {
        description: `Task is now ${progressNum}% complete`,
      });
    }
  };

  // Validate form
  const validateForm = () => {
    if (!projectId) {
      toast.error('Validation Error', {
        description: 'Please select a project',
      });
      return false;
    }
    if (!title.trim()) {
      toast.error('Validation Error', {
        description: 'Please enter a task title',
      });
      return false;
    }
    if (title.trim().length < 5) {
      toast.error('Validation Error', {
        description: 'Title must be at least 5 characters',
      });
      return false;
    }
    if (!startDate) {
      toast.error('Validation Error', {
        description: 'Please select a start date',
      });
      return false;
    }
    if (!endDate) {
      toast.error('Validation Error', {
        description: 'Please select an end date',
      });
      return false;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Validation Error', {
        description: 'Start date cannot be after end date',
      });
      return false;
    }
    if (selectedAssignees.length === 0) {
      toast.error('Validation Error', {
        description: 'Please assign at least one member',
      });
      return false;
    }
    return true;
  };

  // Handle delete
  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this task? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      // TODO: Implement API call to delete task
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Task Deleted', {
        description: 'The task has been deleted successfully',
      });
      router.push('/dashboard/workflow/tasks');
    } catch {
      toast.error('Error', {
        description: 'Failed to delete task. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to update task
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('Task Updated', {
        description: `Task "${title}" has been updated successfully`,
      });
      router.push(`/dashboard/workflow/tasks/${id}`);
    } catch {
      toast.error('Error', {
        description: 'Failed to update task. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Edit Task
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Update task information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Task Details
                  </CardTitle>
                  <CardDescription>
                    Update basic information about the task
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Project Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="project">
                      Project <span className="text-red-500">*</span>
                    </Label>
                    <Select value={projectId} onValueChange={setProjectId}>
                      <SelectTrigger id="project">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProjects.map((project) => (
                          <SelectItem
                            key={project.id}
                            value={project.id.toString()}
                          >
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Task Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Task Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter task title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Minimum 5 characters ({title.length}/5)
                    </p>
                  </div>

                  {/* Date Range */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">
                        End Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                      />
                    </div>
                  </div>

                  {/* Category and Status */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Work Category</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {cat.icon}
                                </Badge>
                                {cat.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">
                        Status <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={status}
                        onValueChange={(value) =>
                          handleStatusChange(value as TaskStatus)
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(TaskStatus).map((s) => (
                            <SelectItem key={s} value={s}>
                              {getTaskStatusLabel(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="progress">Progress</Label>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {progress}%
                      </span>
                    </div>
                    <Input
                      id="progress"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={progress}
                      onChange={(e) => handleProgressChange(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide detailed information about the task..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Assignees Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Assign Team Members
                  </CardTitle>
                  <CardDescription>
                    Update team members working on this task
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                          selectedAssignees.includes(member.id.toString())
                            ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                            : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        }`}
                        onClick={() => toggleAssignee(member.id.toString())}
                      >
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {member.name}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {member.department}
                          </p>
                        </div>
                        {selectedAssignees.includes(member.id.toString()) && (
                          <Badge className="bg-blue-600">Assigned</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  {selectedAssignees.length === 0 && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      * At least one team member must be assigned
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Tags Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                  <CardDescription>
                    Update tags to categorize this task
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={
                          selectedTags.includes(tag) ? 'default' : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                        {selectedTags.includes(tag) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Attachments Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Add More Attachments
                  </CardTitle>
                  <CardDescription>
                    Upload additional documents or files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="attachments">Upload Files</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="attachments"
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          (
                            document.querySelector(
                              '#attachments'
                            ) as HTMLElement
                          )?.click()
                        }
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Files
                      </Button>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        PDF, DOC, XLS, Images, CAD (Max 10MB each)
                      </span>
                    </div>
                  </div>

                  {/* Attachment List */}
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-900 dark:text-zinc-100">
                              {file.name}
                            </span>
                            <span className="text-xs text-zinc-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete Task'}
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting || isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isDeleting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Task Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Project
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {projectId
                        ? mockProjects.find(
                            (p) => p.id.toString() === projectId
                          )?.name
                        : 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Assignees
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {selectedAssignees.length} member
                      {selectedAssignees.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Tags
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {selectedTags.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      New Attachments
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {attachments.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Status
                    </span>
                    <Badge variant="outline">
                      {getTaskStatusLabel(status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Progress
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {progress}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Updates Info */}
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Real-time Updates
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Status and progress changes are saved immediately and
                        team members will be notified.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Edit Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Changes are saved when you click Save Changes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Status updates notify assigned team members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Progress updates are tracked in history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Deleting a task cannot be undone</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
