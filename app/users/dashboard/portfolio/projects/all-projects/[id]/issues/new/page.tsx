'use client';

import { use, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
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
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IssueType,
  getIssueTypeLabel,
  getIssueTypeColor,
} from '@/types/issue/issue-type';
import { IssueStatus, getIssueStatusLabel } from '@/types/issue/issue-status';
import {
  getTaskStatusLabel,
  getTaskStatusColor,
} from '@/types/task/task-status';
import { useCreateIssue } from '@/hooks/issue';
import { useTasksByProject } from '@/hooks/task';
import { useUser, useUserEmployees } from '@/hooks/user/use-user';
import { useEmployeesByProject } from '@/hooks/project/use-projects';
import { IssueAttachmentsSection } from '@/features/issues/components';
import { routes } from '@/nav';
import { toast } from '@/lib/styles/toast-styles';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NewIssuePage({ params }: PageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // If navigated from a task page, taskId is in the URL
  const fromTaskId = searchParams.get('taskId') || '';
  const fromTaskTitle = searchParams.get('taskTitle') || '';
  const isTaskLocked = !!fromTaskId;

  const createMutation = useCreateIssue();
  const { data: tasks = [] } = useTasksByProject(Number.parseInt(projectId));
  const { data: projectMembers = [] } = useEmployeesByProject(
    Number.parseInt(projectId)
  );
  const { data: user } = useUser();
  const { data: employees = [] } = useUserEmployees();
  const currentEmployee = employees.find(
    (emp) => emp.organizationId === user?.defaultOrganizationId
  );

  // Form state — taskId pre-seeded from URL when navigating from a task
  const [taskId, setTaskId] = useState<string>(fromTaskId);
  const [taskSearch, setTaskSearch] = useState('');
  const [title, setTitle] = useState(fromTaskTitle);
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState<IssueType>(IssueType.technical);
  const [status, setStatus] = useState<IssueStatus>(IssueStatus.open);
  const [priority, setPriority] = useState<string>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const filteredTasks = useMemo(() => {
    if (!taskSearch.trim()) return tasks;
    const q = taskSearch.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, taskSearch]);

  const validateForm = () => {
    if (!currentEmployee?.id) {
      toast.error('Validation Error', {
        description: 'Unable to identify current user. Please try again.',
      });
      return false;
    }
    if (!taskId) {
      toast.error('Validation Error', {
        description: 'Please select a related task',
      });
      return false;
    }
    if (!tasks.some((t) => t.id.toString() === taskId)) {
      toast.error('Validation Error', {
        description:
          'The selected task no longer exists. Please choose another.',
      });
      return false;
    }
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

  const handleSaveDraft = async () => {
    if (!currentEmployee?.id) {
      toast.error('Validation Error', {
        description: 'Unable to identify current user. Please try again.',
      });
      return;
    }
    if (!title.trim()) {
      toast.error('Validation Error', {
        description: 'Please fill in the title before saving draft',
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        data: {
          title,
          description,
          issueType,
          status: IssueStatus.open,
          projectId: Number.parseInt(projectId),
          taskId: Number.isFinite(Number(taskId)) ? Number(taskId) : undefined,
          creatorId: currentEmployee.id,
          assigneeId: assigneeId ? Number(assigneeId) : undefined,
        },
        files: { attachments },
      });
      toast.success('Draft Saved', {
        description: 'Your issue has been saved as draft',
      });
      router.push(
        routes.portfolio.projects.allProjects.detail(projectId).issues.href
      );
    } catch {
      // error toast already shown by mutation hook
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    // validateForm already returns false when currentEmployee?.id is absent;
    // this guard exists solely to narrow the type for the compiler.
    if (!currentEmployee?.id) return;

    try {
      await createMutation.mutateAsync({
        data: {
          title,
          description,
          issueType,
          status,
          projectId: Number.parseInt(projectId),
          taskId: taskId ? Number(taskId) : undefined,
          creatorId: currentEmployee.id,
          assigneeId: assigneeId ? Number(assigneeId) : undefined,
        },
        files: { attachments },
      });
      router.push(
        routes.portfolio.projects.allProjects.detail(projectId).issues.href
      );
    } catch {
      // error toast already shown by mutation hook
    }
  };

  const selectedTask = tasks.find((t) => t.id.toString() === taskId);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Report New Issue
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Document and track issues or problems
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
                  Provide information about the issue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Related Task */}
                <div className="space-y-2">
                  <Label>
                    Related Task <span className="text-red-500">*</span>
                  </Label>
                  {isTaskLocked && selectedTask ? (
                    // Locked tile — task pre-determined by navigation context
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
                    // Interactive task picker
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
                      <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-1.5 dark:border-zinc-800">
                        {filteredTasks.length > 0 ? (
                          filteredTasks.map((task) => {
                            const isSelected = taskId === task.id.toString();
                            const statusColor = getTaskStatusColor(task.status);
                            return (
                              <button
                                key={task.id}
                                type="button"
                                onClick={() => setTaskId(task.id.toString())}
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
                    </div>
                  )}
                </div>

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
                      onValueChange={(value) => setStatus(value as IssueStatus)}
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
                    placeholder="Provide a detailed description of the issue, including:&#10;- What happened?&#10;- When did it occur?&#10;- What is the impact?&#10;- Steps to reproduce (if applicable)"
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

            <IssueAttachmentsSection
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
                {selectedTask && (
                  <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
                    <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Related Task
                    </p>
                    <Link
                      href={
                        routes.portfolio.projects.allProjects
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
                      const isSelected = assigneeId === member.id.toString();
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
                        directly and follow emergency procedures.
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
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={createMutation.isPending || !currentEmployee?.id}
          >
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || !currentEmployee?.id}
            className="ml-auto"
          >
            {createMutation.isPending ? (
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
