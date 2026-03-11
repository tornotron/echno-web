'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Calendar,
  Download,
  FileText,
  Image as ImageIcon,
  Sheet,
  Box,
  File,
  Paperclip,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Task } from '@/types/task/task';
import { AttachmentType, formatFileSize } from '@/types/attachment';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';
import { TaskAttachmentsUploader } from './task-attachments-uploader';
import {
  isValidAttachmentUrl,
  getSafeDownloadUrl,
} from '@/lib/utils/attachment-url';

// ---------------------------------------------------------------------------
// Attachment icon helper
// ---------------------------------------------------------------------------

function getAttachmentIcon(type: AttachmentType) {
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
}

// ---------------------------------------------------------------------------
// TaskOverviewTab
// ---------------------------------------------------------------------------

interface TaskOverviewTabProps {
  task: Task;
  taskId: number;
  onDeleteAttachment: (id: number) => void;
}

export function TaskOverviewTab({
  task,
  taskId,
  onDeleteAttachment,
}: TaskOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="space-y-6 lg:col-span-2">
        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            {task.description ? (
              <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {task.description}
              </p>
            ) : (
              <p className="text-zinc-500 italic dark:text-zinc-500">
                No description provided
              </p>
            )}
          </CardContent>
        </Card>

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
                  <Tag className="mr-1 inline h-4 w-4" />
                  Category
                </label>
                <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-linear-to-br from-zinc-50 to-zinc-100 p-4 transition-all hover:shadow-md dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900">
                  {task.category.image ? (
                    <Image
                      src={task.category.image}
                      alt={task.category.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-blue-500 to-blue-600 text-lg font-bold text-white shadow-sm">
                      {task.category.icon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {task.category.name}
                    </h4>
                    {task.category.description && (
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {task.category.description}
                      </p>
                    )}
                  </div>
                </div>
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
                  {task.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
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
              <TaskAttachmentsUploader taskId={taskId} />
            </div>
          </CardHeader>
          <CardContent>
            {task.attachments && task.attachments.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {task.attachments.map((attachment) => {
                  const Icon = getAttachmentIcon(attachment.fileType);
                  const key =
                    attachment.id ||
                    `${attachment.file}-${attachment.createdAt?.getTime() ?? 'noDate'}`;
                  const safeDownloadUrl = getSafeDownloadUrl(attachment);
                  const isValidUrl = isValidAttachmentUrl(attachment.file);

                  return (
                    <div
                      key={key}
                      className="group relative flex h-28 w-28 flex-col items-center justify-between rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="w-full truncate text-center text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatFileSize(attachment.fileSize)}
                      </p>
                      {isValidUrl && (
                        <a
                          href={safeDownloadUrl}
                          download
                          aria-label={`Download ${attachment.fileName}`}
                          className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-zinc-900/60 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Download className="h-5 w-5 text-white" />
                        </a>
                      )}
                      {attachment.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteAttachment(attachment.id!);
                          }}
                          className="absolute top-1 right-1 h-6 w-6 bg-red-500/90 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                          aria-label={`Delete ${attachment.fileName}`}
                        >
                          <Trash2 className="h-3 w-3 text-white" />
                        </Button>
                      )}
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
                {task.endDate ? format(task.endDate, 'MMM d, yyyy') : 'Not set'}
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
              <div className="space-y-2">
                {task.assignees.map((assignee, i) => (
                  <Link
                    key={i}
                    href={`/users/dashboard/workforce/employees/${assignee.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <EmployeeAvatar employee={assignee} size="sm" />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {assignee.name}
                      </p>
                      <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                        {assignee.designation || 'Team Member'}
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
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <EmployeeAvatar employee={task.creator} size="sm" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {task.creator.name}
                  </p>
                  <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {task.creator.designation || 'Project Manager'}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
