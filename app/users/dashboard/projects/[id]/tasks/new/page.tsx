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
import { Upload, X, Save, Send, FileText, Users, Tag } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { mockProjects } from '@/components/shared/mock-data';

import { TaskStatus, getTaskStatusLabel } from '@/types/task/task-status';
import { toast } from '@/lib/styles/toast-styles';

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
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get project from URL
  const projectId = Number.parseInt(params.id as string);
  const project = mockProjects.find((p) => p.id === projectId);

  // Form state
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
    if (!project) {
      toast.error('Validation Error', {
        description: 'Project not found',
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
      router.push(`/dashboard/projects/${projectId}/tasks`);
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
      router.push(`/dashboard/projects/${projectId}/tasks`);
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
      <div className="space-y-4 sm:space-y-6">
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
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="progress" className="flex-shrink-0">
                        Progress
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={progress}
                          onChange={(e) => {
                            const value = Math.min(
                              100,
                              Math.max(0, Number(e.target.value))
                            );
                            setProgress(value.toString());
                          }}
                          className="w-20 text-center"
                        />
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          %
                        </span>
                      </div>
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
                      {project?.projectName || 'Not found'}
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

              {/* Tags Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={
                          selectedTags.includes(tag) ? 'default' : 'outline'
                        }
                        className="cursor-pointer text-xs"
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
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="attachments-sidebar"
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          (
                            document.querySelector(
                              '#attachments-sidebar'
                            ) as HTMLElement
                          )?.click()
                        }
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Files
                      </Button>
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-3 w-3 shrink-0 text-zinc-500" />
                            <span className="truncate text-xs text-zinc-900 dark:text-zinc-100">
                              {file.name}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
