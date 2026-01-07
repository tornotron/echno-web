'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockTasks,
  mockProjects,
  mockIssues,
} from '@/components/shared/mock-data';
import { getUserRoleLabel, UserRole } from '@/types/user/user-role';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Calendar,
  Users,
  FolderOpen,
  Tag,
  AlertCircle,
  Plus,
  Edit,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Sheet,
  Box,
  File,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { TaskStatus, getTaskStatusLabel } from '@/types/task';
import { getIssueTypeLabel } from '@/types/issue/issue-type';
import { AttachmentType, formatFileSize } from '@/types/attachment';

interface PageProps {
  params: Promise<{ id: string; taskId: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id: projectId, taskId: taskIdParam } = use(params);
  const taskId = Number.parseInt(taskIdParam);

  const task = mockTasks.find((t) => t.id === taskId);
  const project = task
    ? mockProjects.find((p) => p.id === task.projectId)
    : null;

  // Find issues related to this task
  const relatedIssues = task?.issues
    ? mockIssues.filter((issue) => task.issues?.some((i) => i.id === issue.id))
    : [];

  if (!task) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Task not found
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              The task you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href={`/users/dashboard/projects/${projectId}/tasks`}>
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {task.title}
            </h1>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(task.status)}>
                {getTaskStatusLabel(task.status)}
              </Badge>
              {project && (
                <Link href={`/users/dashboard/organizations/${project.id}`}>
                  <Badge
                    variant="outline"
                    className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <FolderOpen className="mr-1 h-3 w-3" />
                    {project.projectName}
                  </Badge>
                </Link>
              )}
            </div>
          </div>
          <Link
            href={`/users/dashboard/projects/${projectId}/tasks/${task.id}/edit`}
          >
            <Button className="mt-4 md:mt-0">
              <Edit className="mr-2 h-4 w-4" />
              Edit Task
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Progress
                </label>
                <div className="flex items-center space-x-3">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className="h-full bg-blue-600 transition-all dark:bg-blue-500"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {task.progress}%
                  </span>
                </div>
              </div>

              {/* Category */}
              {task.category && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Category
                  </label>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {task.category.name}
                  </p>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <Tag className="mr-1 inline h-4 w-4" />
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Issues */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>Related Issues</span>
                    {relatedIssues.length > 0 && (
                      <Badge variant="outline">{relatedIssues.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Issues reported for this task
                  </CardDescription>
                </div>
                <Link
                  href={`/users/dashboard/projects/${task.projectId}/issues/new?taskId=${task.id}&taskTitle=${encodeURIComponent(task.title)}`}
                >
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Report Issue
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {relatedIssues.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedIssues.map((issue) => (
                      <TableRow
                        key={issue.id}
                        className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        onClick={() =>
                          router.push(
                            `/dashboard/projects/${task.projectId}/issues/${issue.id}`
                          )
                        }
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {issue.title}
                            </p>
                            {issue.description && (
                              <p className="max-w-[300px] truncate text-sm text-zinc-600 dark:text-zinc-400">
                                {issue.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getIssueTypeLabel(issue.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getIssueStatusColor(issue.status)}>
                            {getIssueStatusLabel(issue.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                            <MessageSquare className="h-4 w-4" />
                            <span>{issue.comments?.length || 0}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center">
                  <AlertCircle className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    No issues reported yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Paperclip className="h-5 w-5" />
                    <span>Attachments</span>
                    {task.attachments && task.attachments.length > 0 && (
                      <Badge variant="outline">{task.attachments.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Files attached to this task</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {task.attachments && task.attachments.length > 0 ? (
                <div className="space-y-2">
                  {task.attachments.map((attachment, index) => {
                    const Icon = getAttachmentIcon(attachment.fileType);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <div className="flex min-w-0 flex-1 items-center space-x-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                              {attachment.fileName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                              <span>{formatFileSize(attachment.fileSize)}</span>
                              <span>•</span>
                              <span>
                                Uploaded{' '}
                                {format(attachment.uploadedAt, 'MMM d, yyyy')}
                              </span>
                              <span>•</span>
                              <span>{attachment.uploadedBy}</span>
                            </div>
                            {attachment.description && (
                              <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-500">
                                {attachment.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={attachment.fileUrl} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Paperclip className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    No attachments yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <Calendar className="mr-2 inline h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Start Date
                </label>
                <p className="text-sm text-zinc-900 dark:text-zinc-100">
                  {task.startDate
                    ? format(task.startDate, 'MMM d, yyyy')
                    : 'Not set'}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Due Date
                </label>
                <p className="text-sm text-zinc-900 dark:text-zinc-100">
                  {task.endDate
                    ? format(task.endDate, 'MMM d, yyyy')
                    : 'Not set'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Assignees */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <Users className="mr-2 inline h-4 w-4" />
                Assignees
                {task.assignees && task.assignees.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {task.assignees.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {task.assignees && task.assignees.length > 0 ? (
                <div className="space-y-3">
                  {task.assignees.map((assignee, index) => (
                    <Link
                      key={index}
                      href={`/users/dashboard/workforce/employees/${assignee.id}`}
                      className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                        <span className="text-sm font-medium text-white">
                          {assignee.memberName?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {assignee.memberName}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {assignee.memberRole
                            ? getUserRoleLabel(assignee.memberRole as UserRole)
                            : 'Team Member'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No assignees
                </p>
              )}
            </CardContent>
          </Card>

          {/* Creator */}
          {task.creator && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Created By</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/users/dashboard/workforce/employees/${task.creator.id}`}
                  className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-purple-600">
                    <span className="text-sm font-medium text-white">
                      {task.creator.memberName?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {task.creator.memberName}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {task.creator.memberRole
                        ? getUserRoleLabel(task.creator.memberRole as UserRole)
                        : 'Project Manager'}
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

const getStatusColor = (status: TaskStatus) => {
  const colorMap = {
    [TaskStatus.upcoming]:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    [TaskStatus.onGoing]:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    [TaskStatus.completed]:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    [TaskStatus.onHold]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  };
  return (
    colorMap[status] ||
    'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
  );
};

const getIssueStatusColor = (status: string) => {
  const statusMap: { [key: string]: string } = {
    open: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    inProgress:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    resolved:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  };
  return (
    statusMap[status] ||
    'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
  );
};

const getIssueStatusLabel = (status: string) => {
  const labelMap: { [key: string]: string } = {
    open: 'Open',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return labelMap[status] || status;
};

const getAttachmentIcon = (type: AttachmentType) => {
  switch (type) {
    case AttachmentType.image: {
      return ImageIcon;
    }
    case AttachmentType.pdf:
    case AttachmentType.document: {
      return FileText;
    }
    case AttachmentType.spreadsheet: {
      return Sheet;
    }
    case AttachmentType.cad: {
      return Box;
    }
    default: {
      return File;
    }
  }
};
