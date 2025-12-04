'use client';

import { useState } from 'react';
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
  Send,
  AlertCircle,
  FileText,
  Users,
  Tag,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { TaskStatus, getTaskStatusLabel } from '@/types/task/task-status';
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

export default function NewTaskPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [projectId, setProjectId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.upcoming);
  const [progress, setProgress] = useState('0');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

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

  // Handle save as draft
  const handleSaveDraft = async () => {
    if (!projectId || !title.trim()) {
      toast.error('Validation Error', {
        description: 'Please fill in project and title before saving draft',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to save draft
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Draft Saved', {
        description: 'Your task has been saved as draft',
      });
      router.push('/dashboard/workflow/tasks');
    } catch {
      toast.error('Error', {
        description: 'Failed to save draft. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to create task
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('Task Created', {
        description: `Task "${title}" has been created successfully`,
      });
      router.push('/dashboard/workflow/tasks');
    } catch {
      toast.error('Error', {
        description: 'Failed to create task. Please try again.',
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
              Create New Task
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Add a new task to your project
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
                    Provide basic information about the task
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
                          setStatus(value as TaskStatus)
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
                      onChange={(e) => setProgress(e.target.value)}
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
                    Select team members to work on this task
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
                    Add tags to categorize and organize this task
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
                    Attachments
                  </CardTitle>
                  <CardDescription>
                    Upload documents, images, or other files
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
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-auto"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </Button>
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
                      Attachments
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
                </CardContent>
              </Card>

              {/* Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Task Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Provide a clear and descriptive task title</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Set realistic start and end dates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Assign team members based on their expertise</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Use tags to improve task organization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Attach relevant documents and files</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>Update task progress regularly</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Need Help?
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Contact your project manager if you need assistance with
                        task creation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
