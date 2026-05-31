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
  X,
  Save,
  Send,
  FileText,
  Users,
  Tag,
  Plus,
  Trash2,
} from 'lucide-react';
import { TaskStatus, getTaskStatusLabel } from '@/types/task/task-status';
import type { Task } from '@/types/task/task';
import {
  useWorkCategories,
  useCreateWorkCategory,
} from '@/hooks/work-category';
import { abbreviatedName } from '@/types/work-category';
import { useEmployeesByProject } from '@/hooks/project/use-projects';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { toast } from '@/lib/styles/toast-styles';
import { useDeleteAttachment } from '@/hooks/attachment/use-attachment-mutations';
import { AttachmentsSection } from '@/components/common';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
import { CreateCategoryDialog } from './task-alert-dialogs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskFormState {
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

export interface TaskFormSubmitData {
  fields: TaskFormState;
  attachments: File[];
  isDraft?: boolean;
}

interface CreateProps {
  mode: 'create';
  projectId: number;
  projectName?: string;
  isSubmitting: boolean;
  onSubmit: (data: TaskFormSubmitData) => void;
  onCancel: () => void;
}

interface EditProps {
  mode: 'edit';
  projectId: number;
  projectName?: string;
  task: Task;
  isSubmitting: boolean;
  isDeleting: boolean;
  onSubmit: (data: TaskFormSubmitData) => void;
  onDelete: () => void;
  onCancel: () => void;
}

type TaskFormProps = CreateProps | EditProps;

export const TASK_FORM_ID = 'task-form';

const defaultForm: TaskFormState = {
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

function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TaskForm(props: TaskFormProps) {
  const isEdit = props.mode === 'edit';
  const { projectId, isSubmitting, onCancel } = props;

  const { data: projectMembers = [] } = useEmployeesByProject(projectId);
  const { data: workCategories = [] } = useWorkCategories();
  const createWorkCategory = useCreateWorkCategory();
  const { data: currentEmployee } = useCurrentUserEmployee();

  const [form, setForm] = useState<TaskFormState>(() => {
    if (props.mode !== 'edit') return defaultForm;
    const task = (props as EditProps).task;
    return {
      title: task.title || '',
      startDate: task.startDate ? formatDateForInput(task.startDate) : '',
      endDate: task.endDate ? formatDateForInput(task.endDate) : '',
      categoryId: task.category?.id.toString() || '',
      status: task.status || TaskStatus.upcoming,
      progress: (task.progress || 0).toString(),
      selectedAssignees: task.assignees?.map((a) => a.id.toString()) || [],
      selectedTags: task.tags || [],
      description: task.description || '',
    };
  });
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const deleteAttachment = useDeleteAttachment();

  function handleUploadFiles(files: File[]) {
    const valid: File[] = [];
    const invalid: string[] = [];
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) invalid.push(f.name);
      else valid.push(f);
    }
    if (invalid.length > 0)
      toast.error('Some files exceed 10MB', {
        description: `Not added: ${invalid.join(', ')}`,
      });
    if (valid.length > 0) setAttachments((prev) => [...prev, ...valid]);
  }

  async function handleDeleteAttachment(id: number) {
    try {
      await deleteAttachment.mutateAsync(id);
      toast.success('Attachment deleted successfully');
    } catch {
      toast.error('Failed to delete attachment');
    }
  }

  // Create category dialog
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  // ---------------------------------------------------------------------------
  // Error helpers
  // ---------------------------------------------------------------------------

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // ---------------------------------------------------------------------------
  // Assignees
  // ---------------------------------------------------------------------------

  function toggleAssignee(memberId: string) {
    setForm((prev) => ({
      ...prev,
      selectedAssignees: prev.selectedAssignees.includes(memberId)
        ? prev.selectedAssignees.filter((id) => id !== memberId)
        : [...prev.selectedAssignees, memberId],
    }));
    clearError('assignees');
  }

  // ---------------------------------------------------------------------------
  // Tags
  // ---------------------------------------------------------------------------

  function addTag(value: string) {
    const tag = value.trim();
    if (tag && !form.selectedTags.includes(tag)) {
      setForm((prev) => ({
        ...prev,
        selectedTags: [...prev.selectedTags, tag],
      }));
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.filter((t) => t !== tag),
    }));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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
  }

  // ---------------------------------------------------------------------------
  // Category dialog
  // ---------------------------------------------------------------------------

  function handleCreateCategory() {
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
          clearError('categoryId');
          setNewCategoryName('');
          setNewCategoryDescription('');
          setShowCreateCategory(false);
        },
      }
    );
  }

  // ---------------------------------------------------------------------------
  // Edit mode: status / progress feedback toasts
  // ---------------------------------------------------------------------------

  function handleStatusChange(newStatus: TaskStatus) {
    setForm((prev) => ({ ...prev, status: newStatus }));
    if (isEdit) {
      toast.success('Status Updated', {
        description: `Task status changed to ${getTaskStatusLabel(newStatus)}`,
      });
    }
  }

  function handleProgressChange(newProgress: string) {
    setForm((prev) => ({ ...prev, progress: newProgress }));
    if (isEdit) {
      const val = Number.parseInt(newProgress);
      if (val % 25 === 0 && val > 0) {
        toast.success('Progress Updated', {
          description: `Task is now ${val}% complete`,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (form.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';

    if (
      form.startDate &&
      form.endDate &&
      new Date(form.startDate) > new Date(form.endDate)
    ) {
      newErrors.endDate = 'End date cannot be before start date';
    }

    if (!form.categoryId)
      newErrors.categoryId = 'Please select a work category';
    if (form.selectedAssignees.length === 0)
      newErrors.assignees = 'Please assign at least one member';

    if (!currentEmployee?.id) {
      toast.error('Validation Error', {
        description: 'Unable to identify current user. Please try again.',
      });
      return false;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Validation Error', {
        description: 'Please fix the errors in the form',
      });
      return false;
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    props.onSubmit({ fields: form, attachments });
  }

  function handleSaveDraft() {
    if (!form.title.trim()) {
      toast.error('Validation Error', {
        description: 'Please fill in task title before saving draft',
      });
      return;
    }
    props.onSubmit({ fields: form, attachments, isDraft: true });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isDeleting = isEdit ? (props as EditProps).isDeleting : false;
  const busy = isSubmitting || isDeleting;
  const existingAttachments = isEdit
    ? (props as EditProps).task.attachments
    : undefined;

  return (
    <>
      <form id={TASK_FORM_ID} onSubmit={handleSubmit} className="space-y-6">
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
                  {isEdit
                    ? 'Update basic information about the task'
                    : 'Provide basic information about the task'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Task Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter task title..."
                    value={form.title}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, title: e.target.value }));
                      clearError('title');
                    }}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title ? (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Minimum 5 characters ({form.title.length}/5)
                    </p>
                  )}
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
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }));
                        clearError('startDate');
                        clearError('endDate');
                      }}
                      readOnly={isEdit}
                      className={`${isEdit ? 'cursor-not-allowed opacity-60' : ''} ${errors.startDate ? 'border-red-500' : ''}`}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500">{errors.startDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }));
                        clearError('endDate');
                      }}
                      min={form.startDate}
                      className={errors.endDate ? 'border-red-500' : ''}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-500">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Category and Status */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Work Category</Label>
                    <Select
                      value={form.categoryId}
                      onValueChange={(value) => {
                        if (value === '__create__') {
                          setShowCreateCategory(true);
                        } else {
                          setForm((prev) => ({ ...prev, categoryId: value }));
                          clearError('categoryId');
                        }
                      }}
                    >
                      <SelectTrigger
                        id="category"
                        className={errors.categoryId ? 'border-red-500' : ''}
                      >
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
                    {errors.categoryId && (
                      <p className="text-sm text-red-500">
                        {errors.categoryId}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select
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

            {/* Attachments */}
            <AttachmentsSection
              title="Task Attachments"
              existingAttachments={existingAttachments ?? []}
              newAttachments={attachments}
              onUploadFiles={handleUploadFiles}
              onRemoveAttachment={(index) =>
                setAttachments((prev) => prev.filter((_, i) => i !== index))
              }
              onDeleteAttachment={handleDeleteAttachment}
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
                    {props.projectName || 'Loading...'}
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
                    {isEdit ? 'New Attachments' : 'Attachments'}
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
                  {isEdit
                    ? 'Update team members working on this task'
                    : 'Select team members to work on this task'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {projectMembers.length > 0 ? (
                    projectMembers.map((member) => {
                      const memberId = member.id.toString();
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
                {errors.assignees && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.assignees}
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
        {isEdit ? (
          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={(props as EditProps).onDelete}
              disabled={busy}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete Task'}
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={busy}
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button type="submit" disabled={busy} className="ml-auto">
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        )}
      </form>

      <CreateCategoryDialog
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
        name={newCategoryName}
        description={newCategoryDescription}
        onNameChange={setNewCategoryName}
        onDescriptionChange={setNewCategoryDescription}
        isPending={createWorkCategory.isPending}
        onConfirm={handleCreateCategory}
      />
    </>
  );
}
