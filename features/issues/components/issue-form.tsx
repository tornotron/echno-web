'use client';

import { useState, useMemo, useCallback } from 'react';
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
  Save,
  Send,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Users,
  ListTodo,
  Search,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import {
  IssueType,
  getIssueTypeColor,
  getIssueTypeLabel,
} from '@tornotron/echno-core/issue/types';
import {
  IssueStatus,
  getIssueStatusLabel,
} from '@tornotron/echno-core/issue/types';
import {
  getTaskStatusColor,
  getTaskStatusLabel,
} from '@tornotron/echno-core/task/types';
import type { Issue } from '@tornotron/echno-core/issue/types';
import type { Attachment } from '@tornotron/echno-core/attachment/types';
import { useDeleteAttachment } from '@tornotron/echno-core/attachment/hooks';
import { useTasksByProject } from '@tornotron/echno-core/task/hooks';
import { useUser, useUserEmployees } from '@tornotron/echno-core/user/hooks';
import { useEmployeesByProject } from '@tornotron/echno-core/project/hooks';
import { toast } from '@/lib/styles/toast-styles';
import { routes } from '@/nav';
import { AttachmentsSection } from '@/components/common';
import type { FileUploadState } from '@/hooks/use-direct-attachment-upload';
import { useFormDraft, useFormDraftScope } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { FormDraftBanner } from '@/components/common';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IssueFormState {
  initialized: boolean;
  taskId: string;
  title: string;
  description: string;
  issueType: IssueType;
  status: IssueStatus;
  priority: string;
  assigneeId: string;
}

export interface IssueFormSubmitData {
  fields: IssueFormState;
  attachments: File[];
  isDraft?: boolean;
}

interface CreateProps {
  mode: 'create';
  projectId: string;
  initialTaskId?: string;
  initialTaskTitle?: string;
  isSubmitting: boolean;
  /** Per-file direct-upload progress, index-aligned to the selected files. */
  uploadStates?: FileUploadState[];
  onSubmit: (data: IssueFormSubmitData) => void;
  onCancel: () => void;
}

interface EditProps {
  mode: 'edit';
  projectId: string;
  issue: Issue;
  existingAttachments?: Attachment[];
  isSubmitting: boolean;
  isDeleting: boolean;
  /** Per-file direct-upload progress, index-aligned to the selected files. */
  uploadStates?: FileUploadState[];
  onSubmit: (data: IssueFormSubmitData) => void;
  onDelete: () => void;
  onCancel: () => void;
}

type IssueFormProps = CreateProps | EditProps;

export const ISSUE_FORM_ID = 'issue-form';

const EMPTY_FORM: IssueFormState = {
  initialized: false,
  taskId: '',
  title: '',
  description: '',
  issueType: IssueType.technical,
  status: IssueStatus.open,
  priority: 'medium',
  assigneeId: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'critical': {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case 'high': {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    case 'medium': {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    case 'low': {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IssueForm(props: IssueFormProps) {
  const isEdit = props.mode === 'edit';
  const { projectId, isSubmitting, onCancel } = props;

  const { data: tasks = [] } = useTasksByProject(Number.parseInt(projectId));
  const { data: projectMembers = [] } = useEmployeesByProject(
    Number.parseInt(projectId)
  );
  const { data: user } = useUser();
  const { data: employees = [] } = useUserEmployees();
  const currentEmployee = employees.find(
    (emp) => emp.organizationId === user?.defaultOrganizationId
  );

  // Initialise form — create mode seeds from props, edit mode from issue
  function buildInitialForm(): IssueFormState {
    if (isEdit) {
      const issue = (props as EditProps).issue;
      return {
        initialized: true,
        taskId: issue.taskId?.toString() || '',
        title: issue.title,
        description: issue.description || '',
        issueType: issue.type,
        status: issue.status,
        priority: 'medium',
        assigneeId: issue.assigneeId?.toString() || '',
      };
    }
    return {
      ...EMPTY_FORM,
      initialized: true,
      taskId: (props as CreateProps).initialTaskId || '',
      title: (props as CreateProps).initialTaskTitle || '',
    };
  }

  const [form, setForm] = useState<IssueFormState>(buildInitialForm);
  const [taskSearch, setTaskSearch] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const deleteAttachment = useDeleteAttachment();

  // An issue write-up is mostly free text, which is the kind of typing there is
  // no way to recover once a session ends underneath it. Keyed on the project as
  // well as the issue: a half raised issue under one project must not turn up on
  // the new-issue form of the next.
  const draftScope = useFormDraftScope();
  const draftValues = useMemo(() => ({ fields: form }), [form]);
  const applyDraft = useCallback(
    (values: { fields: IssueFormState }) => setForm(values.fields),
    []
  );
  const { draft, restoreDraft, discardDraft } = useFormDraft<{
    fields: IssueFormState;
  }>({
    formId: FORM_DRAFT_IDS.ISSUE,
    scope: draftScope,
    recordId: props.mode === 'edit' ? props.issue.id : undefined,
    contextId: projectId,
    values: draftValues,
    onRestore: applyDraft,
  });

  const isTaskLocked = isEdit ? true : !!(props as CreateProps).initialTaskId;

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

  function setField<K extends keyof IssueFormState>(
    field: K,
    value: IssueFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  }

  // ---------------------------------------------------------------------------
  // Edit mode: status feedback toast
  // ---------------------------------------------------------------------------

  function handleStatusChange(newStatus: IssueStatus) {
    setField('status', newStatus);
    if (isEdit) {
      toast.success('Status Updated', {
        description: `Issue status changed to ${getIssueStatusLabel(newStatus)}`,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Task picker
  // ---------------------------------------------------------------------------

  const filteredTasks = useMemo(() => {
    if (!taskSearch.trim()) return tasks;
    const q = taskSearch.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, taskSearch]);

  const selectedTask = tasks.find((t) => t.id.toString() === form.taskId);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!currentEmployee?.id) {
      toast.error('Validation Error', {
        description: 'Unable to identify current user. Please try again.',
      });
      return false;
    }

    if (!isEdit) {
      if (!form.taskId) {
        newErrors.taskId = 'Please select a related task';
      } else if (!tasks.some((t) => t.id.toString() === form.taskId)) {
        newErrors.taskId =
          'The selected task no longer exists. Please choose another.';
      }
    }

    if (!form.title.trim()) {
      newErrors.title = 'Issue title is required';
    } else if (form.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!form.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (form.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
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
    if (!currentEmployee?.id) {
      toast.error('Validation Error', {
        description: 'Unable to identify current user. Please try again.',
      });
      return;
    }
    if (!form.title.trim()) {
      toast.error('Validation Error', {
        description: 'Please fill in the title before saving draft',
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
    ? (props as EditProps).existingAttachments
    : undefined;

  return (
    <form id={ISSUE_FORM_ID} onSubmit={handleSubmit} className="space-y-6">
      <FormDraftBanner
        draft={draft}
        onRestore={restoreDraft}
        onDiscard={discardDraft}
        label="issue"
      />
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Issue Details
              </CardTitle>
              <CardDescription>
                {isEdit
                  ? 'Update information about the issue'
                  : 'Provide information about the issue'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Related Task — create mode only (picker or locked tile) */}
              {!isEdit && (
                <div className="space-y-2">
                  <Label>
                    Related Task <span className="text-red-500">*</span>
                  </Label>
                  {isTaskLocked && selectedTask ? (
                    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: `${getTaskStatusColor(selectedTask.status)}20`,
                        }}
                      >
                        <ListTodo
                          className="h-4 w-4"
                          style={{
                            color: getTaskStatusColor(selectedTask.status),
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {selectedTask.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {getTaskStatusLabel(selectedTask.status)} ·{' '}
                          {selectedTask.progress}% complete
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          placeholder="Search tasks..."
                          value={taskSearch}
                          onChange={(e) => setTaskSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div
                        className={`max-h-56 space-y-1 overflow-y-auto rounded-lg border p-1.5 ${errors.taskId ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                      >
                        {filteredTasks.length > 0 ? (
                          filteredTasks.map((task) => {
                            const isSelected =
                              form.taskId === task.id.toString();
                            const statusColor = getTaskStatusColor(task.status);
                            return (
                              <button
                                key={task.id}
                                type="button"
                                onClick={() => {
                                  setField('taskId', task.id.toString());
                                }}
                                className={`flex w-full items-center gap-3 rounded-md p-2.5 text-left transition-colors ${
                                  isSelected
                                    ? 'border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                                    : 'border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                                }`}
                              >
                                <div
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                                  style={{
                                    backgroundColor: `${statusColor}20`,
                                  }}
                                >
                                  <ListTodo
                                    className="h-4 w-4"
                                    style={{ color: statusColor }}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    {task.title}
                                  </p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {getTaskStatusLabel(task.status)}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="text-xs text-zinc-400 tabular-nums">
                                    {task.progress}%
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  )}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            No tasks found
                          </p>
                        )}
                      </div>
                      {errors.taskId && (
                        <p className="text-sm text-red-500">{errors.taskId}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Related Task — edit mode display */}
              {isEdit && selectedTask && (
                <div className="space-y-2">
                  <Label>Related Task</Label>
                  <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                      <ListTodo className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {selectedTask.title}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Issue Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Issue Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter a brief, descriptive title..."
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
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

              {/* Type, Status, Priority */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="issueType">
                    Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.issueType}
                    onValueChange={(v) => setField('issueType', v as IssueType)}
                  >
                    <SelectTrigger id="issueType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(IssueType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getIssueTypeLabel(type)}
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
                    value={form.status}
                    onValueChange={(v) => handleStatusChange(v as IssueStatus)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(IssueStatus).map((s) => (
                        <SelectItem key={s} value={s}>
                          {getIssueStatusLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Priority <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setField('priority', v)}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder={
                    isEdit
                      ? 'Provide a detailed description of the issue...'
                      : 'Provide a detailed description of the issue, including:\n- What happened?\n- When did it occur?\n- What is the impact?\n- Steps to reproduce (if applicable)'
                  }
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={8}
                  className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description ? (
                  <p className="text-sm text-red-500">{errors.description}</p>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Minimum 20 characters ({form.description.length}/20)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <AttachmentsSection
            title="Issue Attachments"
            existingAttachments={existingAttachments}
            newAttachments={attachments}
            uploadStates={props.uploadStates}
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
              <CardTitle className="text-sm">Issue Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Type</span>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: getIssueTypeColor(form.issueType),
                    color: getIssueTypeColor(form.issueType),
                  }}
                >
                  {getIssueTypeLabel(form.issueType)}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Status</span>
                <Badge variant="outline">
                  {getIssueStatusLabel(form.status)}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Priority
                </span>
                <Badge className={getPriorityColor(form.priority)}>
                  {form.priority.charAt(0).toUpperCase() +
                    form.priority.slice(1)}
                </Badge>
              </div>
              {selectedTask && (
                <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Related Task
                  </p>
                  <Link
                    href={
                      routes.projects.allProjects
                        .detail(projectId)
                        .tasks.detail(selectedTask.id).href
                    }
                  >
                    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: `${getTaskStatusColor(selectedTask.status)}20`,
                        }}
                      >
                        <ListTodo
                          className="h-4 w-4"
                          style={{
                            color: getTaskStatusColor(selectedTask.status),
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {selectedTask.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {getTaskStatusLabel(selectedTask.status)} ·{' '}
                          {selectedTask.progress}%
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assign Member */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Assign Member
              </CardTitle>
              <CardDescription className="text-xs">
                Assign a team member to handle this issue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projectMembers.length > 0 ? (
                  projectMembers.map((member) => {
                    const isSelected = form.assigneeId === member.id.toString();
                    return (
                      <div
                        key={member.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                          isSelected
                            ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                            : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        }`}
                        onClick={() =>
                          setField(
                            'assigneeId',
                            isSelected ? '' : member.id.toString()
                          )
                        }
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {member.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {member.designation ||
                              member.department ||
                              'Team Member'}
                          </p>
                        </div>
                        {isSelected && (
                          <Badge className="bg-blue-600 text-xs">
                            Assigned
                          </Badge>
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
            </CardContent>
          </Card>

          {/* Safety Alert */}
          {form.issueType === IssueType.safety && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Safety Issue
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      For immediate safety hazards, contact the safety officer
                      directly and follow emergency procedures.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Critical Priority Alert */}
          {form.priority === 'critical' && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      Critical Priority
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      Critical issues will be escalated immediately to project
                      management.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
            {isDeleting ? 'Deleting...' : 'Delete Issue'}
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
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
            disabled={busy || !currentEmployee?.id}
          >
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button
            type="submit"
            disabled={busy || !currentEmployee?.id}
            className="ml-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Create Issue
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
