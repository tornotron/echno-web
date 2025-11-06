'use client';

import { use } from 'react';
import { mockIssues, mockTasks, mockProjects } from '@/lib/mock-data';
import { AppLayout } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getIssueTypeLabel, getIssueTypeColor } from '@/types/issue/issue-type';
import { IssueStatus } from '@/types/issue';
import { AttachmentType, formatFileSize } from '@/types/attachment';
import { Plus } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Helper function to get attachment icon based on file type
function getAttachmentIcon(fileType: AttachmentType) {
  switch (fileType) {
    case AttachmentType.image:
      return ImageIcon;
    case AttachmentType.pdf:
      return FileText;
    case AttachmentType.document:
      return FileText;
    case AttachmentType.spreadsheet:
      return Sheet;
    case AttachmentType.cad:
      return Box;
    default:
      return File;
  }
}

export default async function IssueDetailPage({ params }: PageProps) {
  const { id } = await use(params);
  const issue = mockIssues.find((i) => i.id === parseInt(id));
  
  // Find the task that contains this issue
  const relatedTask = issue
    ? mockTasks.find((task) => task.issues?.some((i) => i.id === issue.id))
    : null;
  
  const project = relatedTask ? mockProjects.find((p) => p.id === relatedTask.projectId) : null;

  if (!issue) {
    return (
      <AppLayout>
        <div className="px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Issue not found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                The issue you're looking for doesn't exist.
              </p>
              <Link href="/dashboard/workflow/issues">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Issues
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const getStatusColor = (status: IssueStatus | string) => {
    const statusMap: { [key: string]: string } = {
      open: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      inProgress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return statusMap[status] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
  };

  const getStatusLabel = (status: IssueStatus | string) => {
    const labelMap: { [key: string]: string } = {
      open: 'Open',
      inProgress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return labelMap[status] || status;
  };

  return (
    <AppLayout>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
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
                    color: getIssueTypeColor(issue.type)
                  }}
                >
                  {getIssueTypeLabel(issue.type)}
                </Badge>
              </div>
            </div>
            <Link href={`/dashboard/workflow/issues/${issue.id}/edit`}>
              <Button className="mt-4 md:mt-0">
                <Edit className="h-4 w-4 mr-2" />
                Edit Issue
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                {issue.description ? (
                  <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {issue.description}
                  </p>
                ) : (
                  <p className="text-zinc-500 dark:text-zinc-500 italic">
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
                  <CardDescription>This issue is linked to the following task</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/dashboard/workflow/tasks/${relatedTask.id}`}>
                    <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                            {relatedTask.title}
                          </h3>
                          {project && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                              {project.projectName}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            {relatedTask.tags?.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
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

            {/* Attachments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Paperclip className="h-5 w-5" />
                      <span>Attachments</span>
                      {issue.attachments && issue.attachments.length > 0 && (
                        <Badge variant="outline">{issue.attachments.length}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>Files attached to this issue</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {issue.attachments && issue.attachments.length > 0 ? (
                  <div className="space-y-3">
                    {issue.attachments.map((attachment, index) => {
                      const IconComponent = getAttachmentIcon(attachment.fileType);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {attachment.fileName}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-zinc-600 dark:text-zinc-400">
                                <span>{formatFileSize(attachment.fileSize)}</span>
                                <span>•</span>
                                <span>{format(attachment.uploadedAt, 'MMM d, yyyy')}</span>
                                <span>•</span>
                                <span>{attachment.uploadedBy}</span>
                              </div>
                              {attachment.description && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                                  {attachment.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            asChild
                          >
                            <a href={attachment.fileUrl} download={attachment.fileName}>
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
                    <CardDescription>Discussion about this issue</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {issue.comments && issue.comments.length > 0 ? (
                  <div className="space-y-4">
                    {issue.comments.map((comment, index) => (
                      <div key={index} className="border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {comment.author?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {comment.author}
                          </span>
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
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
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
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                    Created
                  </label>
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    {format(issue.createdAt, 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                {issue.updatedAt && (
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      Last Updated
                    </label>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">
                      {format(issue.updatedAt, 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Creator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <User className="h-4 w-4 inline mr-2" />
                  Reported By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm text-white font-medium">
                      {issue.creator?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {issue.creator}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Issue Reporter
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
                {relatedTask && (
                  <Link href={`/dashboard/workflow/tasks/${relatedTask.id}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <ListTodo className="h-4 w-4 mr-2" />
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
