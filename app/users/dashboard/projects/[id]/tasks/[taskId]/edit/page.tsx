'use client';

import { useState, use, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  X,
  Save,
  AlertCircle,
  Users,
  FileText,
  Tag,
  Trash2,
  Loader2,
  Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TaskStatus, getTaskStatusLabel } from '@/types/task/task-status';
import {
  useProject,
  useEmployeesByProject,
} from '@/hooks/project/use-projects';
import { useTask, useUpdateTaskWithFiles, useDeleteTask } from '@/hooks/task';
import {
  useWorkCategories,
  useCreateWorkCategory,
} from '@/hooks/work-category';
import { abbreviatedName } from '@/types/task/work-category';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { toast } from '@/lib/styles/toast-styles';
import { TaskAttachmentsSection } from '@/features/tasks/components';

function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface FormState {
  initialized: boolean;
  title: string;
  startDate: string;
  endDate: string;
  categoryId: string;
  status: TaskStatus;
  progress: string;
  selectedAssignees: string[];
  selectedTags: string[];
  description: string;
}

const defaultForm: FormState = {
  initialized: false,
  title: '',
  startDate: '',
  endDate: '',
  categoryId: '',
  status: TaskStatus.upcoming,
  progress: '0',
  selectedAssignees: [],
  selectedTags: [],
  description: '',
};

interface PageProps {
  params: Promise<{ id: string; taskId: string }>;
}

export default function EditTaskPage({ params }: PageProps) {
  const { id: projectId, taskId: taskIdParam } = use(params);
  const router = useRouter();
  const taskId = Number.parseInt(taskIdParam);
  const projectIdNum = Number.parseInt(projectId);

  const { data: taskToEdit, isLoading, isError } = useTask(taskId);
  const { data: project } = useProject(projectIdNum);
  const { data: projectMembers = [] } = useEmployeesByProject(projectIdNum);
  const { data: workCategories = [] } = useWorkCategories();
  const createWorkCategory = useCreateWorkCategory();
  const updateTask = useUpdateTaskWithFiles();
  const deleteTask = useDeleteTask();
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
          setForm((prev) => ({
            ...prev,
            categoryId: created.id?.toString() || '',
          }));
          setNewCategoryName('');
          setNewCategoryDescription('');
          setShowCreateCategory(false);
        },
      }
    );
  };

  // Form state (consolidated to satisfy react-hooks/set-state-in-effect)
  const [form, setForm] = useState<FormState>(defaultForm);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Populate form when task data loads.
  // Wait for workCategories before prefilling so the Select has matching
  // items available — otherwise Radix Select may not update the trigger text.
  // Using form.initialized (state, not ref) so React Strict Mode's simulated
  // unmount/remount correctly resets the flag and allows re-initialization.
  useEffect(() => {
    if (!taskToEdit || form.initialized) return;
    if (taskToEdit.category && workCategories.length === 0) return;

    setForm({
      initialized: true,
      title: taskToEdit.title || '',
      startDate: taskToEdit.startDate
        ? formatDateForInput(taskToEdit.startDate)
        : '',
      endDate: taskToEdit.endDate ? formatDateForInput(taskToEdit.endDate) : '',
      categoryId: taskToEdit.category?.id?.toString() || '',
      status: taskToEdit.status || TaskStatus.upcoming,
      progress: (taskToEdit.progress || 0).toString(),
      selectedAssignees:
        taskToEdit.assignees?.map((a) => a.id?.toString() || '') || [],
      selectedTags: taskToEdit.tags || [],
      description: taskToEdit.description || '',
    });
  }, [taskToEdit, workCategories, form.initialized]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError || !taskToEdit) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Task not found
            </h3>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              The task you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button
              onClick={() =>
                router.push(`/users/dashboard/projects/${projectId}/tasks`)
              }
            >
              Back to Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle file upload
  const handleAttachmentsChange = (files: File[]) => {
    setAttachments(files);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Toggle assignee
  const toggleAssignee = (memberId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedAssignees: prev.selectedAssignees.includes(memberId)
        ? prev.selectedAssignees.filter((id) => id !== memberId)
        : [...prev.selectedAssignees, memberId],
    }));
  };

  const addTag = (value: string) => {
    const tag = value.trim();
    if (tag && !form.selectedTags.includes(tag)) {
      setForm((prev) => ({
        ...prev,
        selectedTags: [...prev.selectedTags, tag],
      }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.filter((t) => t !== tag),
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (
      e.key === 'Backspace' &&
      tagInput === '' &&
      form.selectedTags.length > 0
    ) {
      removeTag(form.selectedTags.at(-1)!);
    }
  };

  // Handle status change with immediate feedback
  const handleStatusChange = (newStatus: TaskStatus) => {
    setForm((prev) => ({ ...prev, status: newStatus }));
    toast.success('Status Updated', {
      description: `Task status changed to ${getTaskStatusLabel(newStatus)}`,
    });
  };

  // Handle progress change with immediate feedback
  const handleProgressChange = (newProgress: string) => {
    setForm((prev) => ({ ...prev, progress: newProgress }));
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
    if (!project) {
      toast.error('Validation Error', {
        description: 'Project not found',
      });
      return false;
    }
    if (!form.title.trim()) {
      toast.error('Validation Error', {
        description: 'Please enter a task title',
      });
      return false;
    }
    if (form.title.trim().length < 5) {
      toast.error('Validation Error', {
        description: 'Title must be at least 5 characters',
      });
      return false;
    }
    if (!form.startDate) {
      toast.error('Validation Error', {
        description: 'Please select a start date',
      });
      return false;
    }
    if (!form.endDate) {
      toast.error('Validation Error', {
        description: 'Please select an end date',
      });
      return false;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      toast.error('Validation Error', {
        description: 'Start date cannot be after end date',
      });
      return false;
    }
    if (!form.categoryId) {
      toast.error('Validation Error', {
        description: 'Please select a work category',
      });
      return false;
    }
    if (form.selectedAssignees.length === 0) {
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

  // Handle delete
  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this task? This action cannot be undone.'
      )
    ) {
      return;
    }

    deleteTask.mutate(taskId, {
      onSuccess: () => {
        router.push(`/users/dashboard/projects/${projectId}/tasks`);
      },
      onError: (error) => {
        console.error('Failed to delete task:', error);
        toast.error('Delete Failed', {
          description:
            error instanceof Error
              ? error.message
              : 'Could not delete the task. Please try again.',
        });
      },
    });
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const selectedCategory = workCategories.find(
      (c) => c.id?.toString() === form.categoryId
    );

    updateTask.mutate(
      {
        id: taskId,
        data: {
          projectId: projectIdNum,
          title: form.title,
          description: form.description,
          startDate: form.startDate ? new Date(form.startDate) : undefined,
          endDate: form.endDate ? new Date(form.endDate) : undefined,
          creator: currentEmployee,
          category: selectedCategory,
          status: form.status,
          progress: Number.parseInt(form.progress),
          tags: form.selectedTags,
          assignees: form.selectedAssignees
            .map((sid) => projectMembers.find((m) => m.id?.toString() === sid))
            .filter(Boolean) as typeof projectMembers,
        },
        files: { attachments },
      },
      {
        onSuccess: () => {
          router.push(`/users/dashboard/projects/${projectId}/tasks/${taskId}`);
        },
        onError: (error) => {
          console.error('Failed to update task:', error);
          toast.error('Save Failed', {
            description:
              error instanceof Error
                ? error.message
                : 'Could not save the task. Please try again.',
          });
        },
      }
    );
  };

  const isSubmitting = updateTask.isPending;
  const isDeleting = deleteTask.isPending;

  return (
    <div className="space-y-4 sm:space-y-6">
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
                  Update basic information about the task
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
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Minimum 5 characters ({form.title.length}/5)
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about the task..."
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
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
                      value={form.startDate}
                      readOnly
                      className="cursor-not-allowed opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      min={form.startDate}
                    />
                  </div>
                </div>

                {/* Category and Status */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Work Category</Label>
                    <Select
                      key={String(form.initialized)}
                      value={form.categoryId}
                      onValueChange={(value) => {
                        if (value === '__create__') {
                          setShowCreateCategory(true);
                        } else {
                          setForm((prev) => ({ ...prev, categoryId: value }));
                        }
                      }}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {workCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id!.toString()}>
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
                      key={String(form.initialized)}
                      value={form.status}
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
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="progress" className="shrink-0">
                      Progress
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={form.progress}
                        onChange={(e) => {
                          const value = Math.min(
                            100,
                            Math.max(0, Number(e.target.value))
                          );
                          handleProgressChange(value.toString());
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
                    value={form.progress}
                    onChange={(e) => handleProgressChange(e.target.value)}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attachments Section */}
            <TaskAttachmentsSection
              existingAttachments={taskToEdit?.attachments}
              newAttachments={attachments}
              onAttachmentsChange={handleAttachmentsChange}
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
                    {form.selectedAssignees.length} member
                    {form.selectedAssignees.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Tags</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {form.selectedTags.length}
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
                    {getTaskStatusLabel(form.status)}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Progress
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {form.progress}%
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
                  Update team members working on this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {projectMembers.length > 0 ? (
                    projectMembers
                      .filter((member) => member.id != null)
                      .map((member) => {
                        const memberId = member.id!.toString();
                        const isSelected =
                          form.selectedAssignees.includes(memberId);
                        const cardClass = isSelected
                          ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                          : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700';

                        return (
                          <div
                            key={memberId}
                            className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${cardClass}`}
                            onClick={() => toggleAssignee(memberId)}
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
                {form.selectedAssignees.length === 0 && (
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
                  {form.selectedTags.map((tag) => (
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
