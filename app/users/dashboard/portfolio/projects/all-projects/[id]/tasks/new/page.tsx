'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/shadcn/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { X, Save, Send, FileText, Users, Tag, Plus } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import {
  useProject,
  useEmployeesByProject,
} from '@/hooks/project/use-projects';
import { useCreateTask } from '@/hooks/task';
import type { CreateTaskRequest } from '@/types/task/task-create';
import {
  useWorkCategories,
  useCreateWorkCategory,
} from '@/hooks/work-category';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { abbreviatedName } from '@/types/work-category';

import { TaskStatus, getTaskStatusLabel } from '@/types/task/task-status';
import { toast } from '@/lib/styles/toast-styles';
import { TaskAttachmentsSection } from '@/features/tasks/components';
import { routes } from '@/nav';

export default function NewTaskPage() {
  const router = useRouter();
  const params = useParams();
  const createTask = useCreateTask();

  // Get project from URL
  const projectId = Number.parseInt(params.id as string);
  const { data: project } = useProject(projectId);
  const { data: projectMembers = [] } = useEmployeesByProject(projectId);
  const { data: workCategories = [] } = useWorkCategories();
  const createWorkCategory = useCreateWorkCategory();
  const { data: currentEmployee } = useCurrentUserEmployee();

  // Create category dialog state
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Validation Error', {
        description: 'Please enter a category name',
      });
      return;
    }
    if (!newCategoryDescription.trim()) {
      toast.error('Validation Error', {
        description: 'Please enter a category description',
      });
      return;
    }
    createWorkCategory.mutate(
      {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
      },
      {
        onSuccess: (created) => {
          setCategoryId(created.id.toString());
          setNewCategoryName('');
          setNewCategoryDescription('');
          setShowCreateCategory(false);
        },
      }
    );
  };

  // Form state
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.upcoming);
  const [progress, setProgress] = useState('0');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

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

  // Tag management functions
  const addTag = (value: string) => {
    const tag = value.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (
      e.key === 'Backspace' &&
      tagInput === '' &&
      selectedTags.length > 0
    ) {
      const lastTag = selectedTags.at(-1);
      if (lastTag) removeTag(lastTag);
    }
  };

  // Build task data from form state
  const buildTaskData = (): CreateTaskRequest => {
    const selectedCategory = workCategories.find(
      (c) => c.id.toString() === categoryId
    );
    return {
      title,
      projectId,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      creatorId: currentEmployee?.id,
      categoryId: selectedCategory?.id,
      status,
      progress: Number.parseInt(progress),
      tags: selectedTags,
      assigneeIds: selectedAssignees
        .map((sid) => projectMembers.find((m) => m.id.toString() === sid)?.id)
        .filter((id): id is number => id !== undefined),
    };
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
    if (!categoryId) {
      toast.error('Validation Error', {
        description: 'Please select a work category',
      });
      return false;
    }
    if (selectedAssignees.length === 0) {
      toast.error('Validation Error', {
        description: 'Please assign at least one member',
      });
      return false;
    }
    if (!currentEmployee?.id) {
      toast.error('Validation Error', {
        description: 'Unable to identify current user. Please try again.',
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

    createTask.mutate(
      {
        data: buildTaskData(),
        files: { attachments },
      },
      {
        onSuccess: () => {
          router.push(
            routes.portfolio.projects.allProjects.detail(projectId).tasks.href
          );
        },
      }
    );
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    createTask.mutate(
      {
        data: buildTaskData(),
        files: { attachments },
      },
      {
        onSuccess: () => {
          router.push(
            routes.portfolio.projects.allProjects.detail(projectId).tasks.href
          );
        },
      }
    );
  };

  const isSubmitting = createTask.isPending;

  return (
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

      <form onSubmit={handleSubmit} className="space-y-6">
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
                    <Select
                      value={categoryId}
                      onValueChange={(value) => {
                        if (value === '__create__') {
                          setShowCreateCategory(true);
                        } else {
                          setCategoryId(value);
                        }
                      }}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {workCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {cat.icon || abbreviatedName(cat)}
                              </Badge>
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="__create__">
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <Plus className="h-3 w-3" />
                            Create new category
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as TaskStatus)}
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
                    <Label htmlFor="progress" className="shrink-0">
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

            {/* Attachments Section */}
            <TaskAttachmentsSection
              existingAttachments={[]}
              newAttachments={attachments}
              onAttachmentsChange={setAttachments}
              onRemoveAttachment={removeAttachment}
            />
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
                  <span className="text-zinc-600 dark:text-zinc-400">Tags</span>
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
                  <Badge variant="outline">{getTaskStatusLabel(status)}</Badge>
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

            {/* Assignees Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Assign Team Members
                </CardTitle>
                <CardDescription className="text-xs">
                  Select team members to work on this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {projectMembers.length > 0 ? (
                    projectMembers.map((member) => {
                      const isSelected = selectedAssignees.includes(
                        member.id.toString()
                      );
                      const cardClass = isSelected
                        ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700';

                      return (
                        <div
                          key={member.id}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${cardClass}`}
                          onClick={() => toggleAssignee(member.id.toString())}
                        >
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {member.name}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {member.designation ||
                                member.department ||
                                'Team Member'}
                            </p>
                          </div>
                          {isSelected && (
                            <Badge className="bg-blue-600">Assigned</Badge>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No team members found for this project
                    </p>
                  )}
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
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 text-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Type a tag and press Enter or comma..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => addTag(tagInput)}
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Press Enter or comma to add a tag. Backspace removes the last
                  one.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

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
          <Button type="submit" disabled={isSubmitting} className="ml-auto">
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>

      {/* Create Category Dialog */}
      <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Work Category</DialogTitle>
            <DialogDescription>
              Add a new work category for your tasks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-category-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-category-name"
                placeholder="e.g. Civil Engineering"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-category-description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="new-category-description"
                placeholder="Describe this category..."
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateCategory(false)}
              disabled={createWorkCategory.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={createWorkCategory.isPending}
            >
              {createWorkCategory.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
