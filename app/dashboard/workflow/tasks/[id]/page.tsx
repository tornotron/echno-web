'use client';

import { use } from 'react';
import { mockTasks, mockProjects, mockIssues } from '@/lib/mock-data';
import { AppLayout } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Calendar,
  Users,
  FolderOpen,
  Tag,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Sheet,
  Box,
  File,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { TaskStatus, getTaskStatusLabel, getTaskStatusColor } from '@/types/task';
import { getIssueTypeLabel } from '@/types/issue/issue-type';
import { AttachmentType, formatFileSize } from '@/types/attachment';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const taskId = parseInt(id);
  
  const task = mockTasks.find((t) => t.id === taskId);
  const project = task ? mockProjects.find((p) => p.id === task.projectId) : null;
  
  // Find issues related to this task
  const relatedIssues = task?.issues
    ? mockIssues.filter((issue) => task.issues?.some((i) => i.id === issue.id))
    : [];

  if (!task) {
    return (
      <AppLayout>
        <div className="px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Task not found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                The task you're looking for doesn't exist.
              </p>
              <Link href="/dashboard/workflow/tasks">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tasks
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const getStatusColor = (status: TaskStatus) => {
    const colorMap = {
      [TaskStatus.upcoming]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      [TaskStatus.onGoing]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      [TaskStatus.completed]: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      [TaskStatus.onHold]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    };
    return colorMap[status] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
  };

  const getIssueStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      open: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      inProgress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return statusMap[status] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
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
      case AttachmentType.image:
        return ImageIcon;
      case AttachmentType.pdf:
      case AttachmentType.document:
        return FileText;
      case AttachmentType.spreadsheet:
        return Sheet;
      case AttachmentType.cad:
        return Box;
      default:
        return File;
    }
  };

  return (
    <AppLayout>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {task.title}
              </h1>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(task.status)}>
                  {getTaskStatusLabel(task.status)}
                </Badge>
                {project && (
                  <Link href={`/dashboard/organizations/${project.id}`}>
                    <Badge variant="outline" className="hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <FolderOpen className="h-3 w-3 mr-1" />
                      {project.projectName}
                    </Badge>
                  </Link>
                )}
              </div>
            </div>
            <Link href={`/dashboard/workflow/tasks/${task.id}/edit`}>
              <Button className="mt-4 md:mt-0">
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                    Progress
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-500 transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 w-12 text-right">
                      {task.progress}%
                    </span>
                  </div>
                </div>

                {/* Category */}
                {task.category && (
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      Category
                    </label>
                    <p className="text-zinc-900 dark:text-zinc-100">{task.category.name}</p>
                  </div>
                )}

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      <Tag className="h-4 w-4 inline mr-1" />
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
                    <CardDescription>Issues reported for this task</CardDescription>
                  </div>
                  <Link href={`/dashboard/workflow/issues/new?taskId=${task.id}&taskTitle=${encodeURIComponent(task.title)}`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatedIssues.map((issue) => (
                        <TableRow key={issue.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {issue.title}
                              </p>
                              {issue.description && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[300px]">
                                  {issue.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getIssueTypeLabel(issue.type)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getIssueStatusColor(issue.status)}>
                              {getIssueStatusLabel(issue.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/dashboard/workflow/issues/${issue.id}`}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Issue Details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
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
                    <Plus className="h-4 w-4 mr-2" />
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
                          className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {attachment.fileName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                                <span>{formatFileSize(attachment.fileSize)}</span>
                                <span>•</span>
                                <span>Uploaded {format(attachment.uploadedAt, 'MMM d, yyyy')}</span>
                                <span>•</span>
                                <span>{attachment.uploadedBy}</span>
                              </div>
                              {attachment.description && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 truncate">
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
                  <div className="text-center py-8">
                    <Paperclip className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
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
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                    Start Date
                  </label>
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    {task.startDate ? format(task.startDate, 'MMM d, yyyy') : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                    Due Date
                  </label>
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    {task.endDate ? format(task.endDate, 'MMM d, yyyy') : 'Not set'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Assignees */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <Users className="h-4 w-4 inline mr-2" />
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
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-sm text-white font-medium">
                            {assignee.memberName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {assignee.memberName}
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {assignee.memberRole}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No assignees</p>
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
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <span className="text-sm text-white font-medium">
                        {task.creator.memberName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {task.creator.memberName}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {task.creator.memberRole}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
