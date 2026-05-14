'use client';

import { useState, use } from 'react';
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
  AlertCircle,
  AlertTriangle,
  Trash2,
  Loader2,
  Users,
  ListTodo,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import Link from 'next/link';
import {
  IssueType,
  getIssueTypeLabel,
  getIssueTypeColor,
} from '@/types/issue/issue-type';
import { IssueStatus, getIssueStatusLabel } from '@/types/issue/issue-status';
import {
  useIssue,
  useUpdateIssueWithFiles,
  useDeleteIssue,
} from '@/hooks/issue';
import { useTask } from '@/hooks/task';
import {
  useProject,
  useEmployeesByProject,
} from '@/hooks/project/use-projects';
import { TaskAttachmentsSection } from '@/features/tasks/components';
import { toast } from '@/lib/styles/toast-styles';

interface PageProps {
  params: Promise<{ id: string; issueId: string }>;
}

export default function EditIssuePage({ params }: PageProps) {
  const { id: projectId, issueId } = use(params);
  const router = useRouter();

  const { data: issue, isLoading: issueLoading } = useIssue(
    Number.parseInt(issueId)
  );
  const { data: project } = useProject(Number.parseInt(projectId));
  const { data: relatedTask } = useTask(issue?.taskId);
  const { data: projectMembers = [] } = useEmployeesByProject(
    Number.parseInt(projectId)
  );
  const updateMutation = useUpdateIssueWithFiles();
  const deleteMutation = useDeleteIssue();

  // Form state — initialized from loaded issue
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState<IssueType>(IssueType.technical);
  const [status, setStatus] = useState<IssueStatus>(IssueStatus.open);
  const [priority, setPriority] = useState<string>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Sync form state once issue loads (adjust state during render to avoid
  // calling setState inside an effect – see React docs on "adjusting state
  // when props change").
  if (issue && !initialized) {
    setTitle(issue.title);
    setDescription(issue.description || '');
    setIssueType(issue.type);
    setStatus(issue.status);
    setAssigneeId(issue.assigneeId?.toString() || '');
    setInitialized(true);
  }

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Handle status change with immediate feedback
  const handleStatusChange = (newStatus: IssueStatus) => {
    setStatus(newStatus);
    toast.success('Status Updated', {
      description: `Issue status changed to ${getIssueStatusLabel(newStatus)}`,
    });
  };

  // Validate form
  const validateForm = () => {
    if (!title.trim()) {
      toast.error('Validation Error', {
        description: 'Please enter an issue title',
      });
      return false;
    }
    if (title.trim().length < 5) {
      toast.error('Validation Error', {
        description: 'Title must be at least 5 characters',
      });
      return false;
    }
    if (!description.trim()) {
      toast.error('Validation Error', {
        description: 'Please provide a description',
      });
      return false;
    }
    if (description.trim().length < 20) {
      toast.error('Validation Error', {
        description: 'Description must be at least 20 characters',
      });
      return false;
    }
    return true;
  };

  // Handle delete
  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this issue? This action cannot be undone.'
      )
    ) {
      return;
    }

    if (!issue?.id) return;

    try {
      await deleteMutation.mutateAsync(issue.id);
      router.push(
        `/users/dashboard/portfolio/projects/all-projects/${projectId}/issues`
      );
    } catch {
      // error toast already shown by mutation hook
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !issue?.id) return;

    try {
      await updateMutation.mutateAsync({
        id: issue.id,
        data: {
          title,
          description,
          type: issueType,
          status,
          assigneeId: assigneeId ? Number(assigneeId) : undefined,
        },
        files: { attachments },
      });
      router.push(
        `/users/dashboard/portfolio/projects/all-projects/${projectId}/issues/${issueId}`
      );
    } catch {
      // error toast already shown by mutation hook
    }
  };

  const isPending = updateMutation.isPending || deleteMutation.isPending;

  if (issueLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!issue) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <AlertCircle className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Issue not found</EmptyTitle>
          <EmptyDescription>
            The issue you&apos;re looking for doesn&apos;t exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          onClick={() =>
            router.push(
              `/users/dashboard/portfolio/projects/all-projects/${projectId}/issues`
            )
          }
        >
          Back to Issues
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Edit Issue
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Update issue information
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
                  <AlertTriangle className="h-5 w-5" />
                  Issue Details
                </CardTitle>
                <CardDescription>
                  Update information about the issue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Issue Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Issue Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter a brief, descriptive title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Minimum 5 characters ({title.length}/5)
                  </p>
                </div>

                {/* Issue Type, Status, Priority */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="issueType">
                      Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={issueType}
                      onValueChange={(value) =>
                        setIssueType(value as IssueType)
                      }
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
                      value={status}
                      onValueChange={(value) =>
                        handleStatusChange(value as IssueStatus)
                      }
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
                    <Select value={priority} onValueChange={setPriority}>
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
                    placeholder="Provide a detailed description of the issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Minimum 20 characters ({description.length}/20)
                  </p>
                </div>
              </CardContent>
            </Card>

            <TaskAttachmentsSection
              existingAttachments={issue?.attachments}
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
                <CardTitle className="text-sm">Issue Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Type</span>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: getIssueTypeColor(issueType),
                      color: getIssueTypeColor(issueType),
                    }}
                  >
                    {getIssueTypeLabel(issueType)}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Status
                  </span>
                  <Badge variant="outline">{getIssueStatusLabel(status)}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Priority
                  </span>
                  <Badge className={getPriorityColor(priority)}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Badge>
                </div>
                {relatedTask && (
                  <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
                    <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Related Task
                    </p>
                    <Link
                      href={`/users/dashboard/portfolio/projects/all-projects/${projectId}/tasks/${relatedTask.id}`}
                    >
                      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                          <ListTodo className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {relatedTask.title}
                          </p>
                          {project && (
                            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {project.projectName}
                            </p>
                          )}
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
                      const isSelected = assigneeId === member.id?.toString();
                      return (
                        <div
                          key={member.id}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                            isSelected
                              ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                              : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                          }`}
                          onClick={() =>
                            setAssigneeId(
                              isSelected ? '' : member.id?.toString() || ''
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
            {issueType === IssueType.safety && (
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
                        directly.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Priority Alert */}
            {priority === 'critical' && (
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        Critical Priority
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        This issue requires immediate attention from project
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
        <div className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Issue
              </>
            )}
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {updateMutation.isPending ? (
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
      </form>
    </div>
  );
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case 'medium': {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    case 'low': {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};
