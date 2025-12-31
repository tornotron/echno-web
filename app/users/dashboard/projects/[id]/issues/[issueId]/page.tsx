'use client';

import { use, useState } from 'react';
import {
  mockIssues,
  mockTasks,
  mockProjects,
} from '@/components/shared/mock-data';
import { AppLayout } from '@/components/common';
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
  ArrowLeft,
  Calendar,
  User,
  ListTodo,
  AlertCircle,
  Edit,
  MessageSquare,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Sheet,
  Box,
  File,
  Upload,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getIssueTypeLabel, getIssueTypeColor } from '@/types/issue/issue-type';
import { IssueStatus } from '@/types/issue';
import { AttachmentType, formatFileSize } from '@/types/attachment';

interface PageProps {
  params: Promise<{ id: string; issueId: string }>;
}

// Helper function to get attachment icon based on file type
function getAttachmentIcon(fileType: AttachmentType) {
  switch (fileType) {
    case AttachmentType.image: {
      return ImageIcon;
    }
    case AttachmentType.pdf: {
      return FileText;
    }
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
}

const getStatusColor = (status: IssueStatus) => {
  const colorMap: Record<string, string> = {
    [IssueStatus.open]:
      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    [IssueStatus.inProgress]:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    [IssueStatus.resolved]:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    [IssueStatus.closed]:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  };
  return (
    colorMap[status] ||
    'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
  );
};

const getStatusLabel = (status: IssueStatus) => {
  const labelMap: Record<string, string> = {
    [IssueStatus.open]: 'Open',
    [IssueStatus.inProgress]: 'In Progress',
    [IssueStatus.resolved]: 'Resolved',
    [IssueStatus.closed]: 'Closed',
  };
  return labelMap[status] || status;
};

export default function IssueDetailPage({ params }: PageProps) {
  const { id: projectId, issueId: issueIdParam } = use(params);
  const issue = mockIssues.find((i) => i.id === Number.parseInt(issueIdParam));

  // State for attachment uploads
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Find the task that contains this issue
  const relatedTask = issue
    ? mockTasks.find((task) => task.issues?.some((i) => i.id === issue.id))
    : null;

  const project = relatedTask
    ? mockProjects.find((p) => p.id === relatedTask.projectId)
    : null;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = [...e.target.files];
      setNewAttachments([...newAttachments, ...files]);
    }
  };

  // Remove attachment from new uploads
  const removeNewAttachment = (index: number) => {
    setNewAttachments(newAttachments.filter((_, i) => i !== index));
  };

  // Handle upload
  const handleUpload = async () => {
    if (newAttachments.length === 0) return;

    setIsUploading(true);
    try {
      // TODO: Implement API call to upload attachments
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // After successful upload, clear the new attachments
      setNewAttachments([]);
      // Show success message (could use toast here)
      alert('Attachments uploaded successfully!');
    } catch {
      alert('Failed to upload attachments. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!issue) {
    return (
      <AppLayout>
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Issue not found
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                The issue you&apos;re looking for doesn&apos;t exist.
              </p>
              <Link href={`/users/dashboard/projects/${projectId}/issues`}>
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Issues
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {issue.title}
              </h1>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(issue.status)}>
                  {getStatusLabel(issue.status)}
                </Badge>
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: `${getIssueTypeColor(issue.type)}20`,
                    borderColor: getIssueTypeColor(issue.type),
                    color: getIssueTypeColor(issue.type),
                  }}
                >
                  {getIssueTypeLabel(issue.type)}
                </Badge>
              </div>
            </div>
            <Link
              href={`/users/dashboard/projects/${projectId}/issues/${issue.id}/edit`}
            >
              <Button className="mt-4 md:mt-0">
                <Edit className="mr-2 h-4 w-4" />
                Edit Issue
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Issue Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                {issue.description ? (
                  <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                    {issue.description}
                  </p>
                ) : (
                  <p className="text-zinc-500 italic dark:text-zinc-500">
                    No description provided
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Related Task */}
            {relatedTask && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ListTodo className="h-5 w-5" />
                    <span>Related Task</span>
                  </CardTitle>
                  <CardDescription>
                    This issue is linked to the following task
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/users/dashboard/projects/${projectId}/tasks/${relatedTask.id}`}
                  >
                    <div className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="mb-1 font-medium text-zinc-900 dark:text-zinc-100">
                            {relatedTask.title}
                          </h3>
                          {project && (
                            <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                              {project.projectName}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            {relatedTask.tags?.slice(0, 3).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Task
                        </Button>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Comments</span>
                      {issue.comments && issue.comments.length > 0 && (
                        <Badge variant="outline">{issue.comments.length}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Discussion about this issue
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {issue.comments && issue.comments.length > 0 ? (
                  <div className="space-y-4">
                    {issue.comments.map((comment, index) => (
                      <div
                        key={index}
                        className="border-l-2 border-zinc-200 pl-4 dark:border-zinc-800"
                      >
                        <div className="mb-2 flex items-center space-x-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                            <span className="text-xs font-medium text-white">
                              {comment.author?.memberName?.charAt(0) || '?'}
                            </span>
                          </div>
                          {comment.author ? (
                            <Link
                              href={`/users/dashboard/workforce/employees/${comment.author.id}`}
                              className="text-sm font-medium text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                            >
                              {comment.author.memberName}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              Unknown
                            </span>
                          )}
                          <span className="text-xs text-zinc-500 dark:text-zinc-500">
                            {format(comment.createdAt, 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          {comment.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <MessageSquare className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      No comments yet
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
                    Created
                  </label>
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    {format(issue.createdAt, 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                {issue.updatedAt && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Last Updated
                    </label>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">
                      {format(issue.updatedAt, 'MMM d, yyyy HH:mm')}
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
                    <CardTitle className="flex items-center gap-2">
                      <Paperclip className="h-5 w-5" />
                      Attachments
                    </CardTitle>
                    <CardDescription>
                      Files attached to this issue
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() =>
                      (
                        document.querySelector(
                          '#attachment-upload'
                        ) as HTMLInputElement
                      )?.click()
                    }
                    disabled={isUploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <input
                  id="attachment-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.dwg,.dxf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Show existing attachments or new uploads */}
                {issue.attachments && issue.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {issue.attachments.map((attachment, index) => {
                      const IconComponent = getAttachmentIcon(
                        attachment.fileType
                      );
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                        >
                          <div className="flex min-w-0 flex-1 items-center space-x-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                {attachment.fileName}
                              </p>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                {formatFileSize(attachment.fileSize)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 shrink-0 p-0"
                            asChild
                          >
                            <a
                              href={attachment.fileUrl}
                              download={attachment.fileName}
                            >
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      );
                    })}

                    {/* Show pending uploads if any */}
                    {newAttachments.length > 0 && (
                      <div className="space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Pending Uploads ({newAttachments.length})
                        </p>
                        {newAttachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800/50"
                          >
                            <div className="flex min-w-0 flex-1 items-center space-x-2">
                              <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                  {file.name}
                                </p>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() => removeNewAttachment(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          size="sm"
                          className="w-full"
                          onClick={handleUpload}
                          disabled={isUploading}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {isUploading
                            ? 'Uploading...'
                            : `Upload ${newAttachments.length} File${newAttachments.length > 1 ? 's' : ''}`}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : newAttachments.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Pending Uploads ({newAttachments.length})
                    </p>
                    {newAttachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800/50"
                      >
                        <div className="flex min-w-0 flex-1 items-center space-x-2">
                          <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                              {file.name}
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 shrink-0 p-0"
                          onClick={() => removeNewAttachment(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      onClick={handleUpload}
                      disabled={isUploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading
                        ? 'Uploading...'
                        : `Upload ${newAttachments.length} File${newAttachments.length > 1 ? 's' : ''}`}
                    </Button>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Paperclip className="mx-auto mb-3 h-12 w-12 text-zinc-400 dark:text-zinc-600" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      No attachments yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Creator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <User className="mr-2 inline h-4 w-4" />
                  Reported By
                </CardTitle>
              </CardHeader>
              <CardContent>
                {issue.creator ? (
                  <Link
                    href={`/users/dashboard/workforce/employees/${issue.creator.id}`}
                    className="block rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-purple-600">
                        <span className="text-sm font-medium text-white">
                          {issue.creator.memberName?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {issue.creator.memberName}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Issue Reporter
                        </p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    No creator information
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Add Comment
                </Button>
                {relatedTask && (
                  <Link
                    href={`/users/dashboard/projects/${projectId}/tasks/${relatedTask.id}`}
                    className="block"
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <ListTodo className="mr-2 h-4 w-4" />
                      View Parent Task
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
