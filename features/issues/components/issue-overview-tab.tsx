'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import {
  Box,
  Calendar,
  CheckCircle2,
  Download,
  File,
  FileText,
  Image as ImageIcon,
  ListTodo,
  Loader2,
  Paperclip,
  Search,
  Sheet,
  Trash2,
  User,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Issue } from '@/types/issue/issue';
import type { Task } from '@/types/task/task';
import type { Project } from '@/types/project/project';
import { AttachmentType, formatFileSize } from '@/types/attachment';
import { useUpdateIssue } from '@/hooks/issue';
import { useEmployeesByProject } from '@/hooks/project/use-projects';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';
import { AttachmentsUploader } from '@/components/common';
import {
  isValidAttachmentUrl,
  getSafeDownloadUrl,
} from '@/lib/utils/attachment-url';
import { routes } from '@/nav';

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
// IssueOverviewTab
// ---------------------------------------------------------------------------

interface IssueOverviewTabProps {
  issue: Issue;
  relatedTask: Task | undefined;
  project: Project | undefined;
  projectId: string;
  onDeleteAttachment: (id: number) => void;
}

export function IssueOverviewTab({
  issue,
  relatedTask,
  project,
  projectId,
  onDeleteAttachment,
}: IssueOverviewTabProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');

  const updateIssueMutation = useUpdateIssue();
  const { data: projectMembers = [] } = useEmployeesByProject(
    Number.parseInt(projectId)
  );

  const filteredMembers = useMemo(() => {
    if (!assignSearch.trim()) return projectMembers;
    const q = assignSearch.toLowerCase();
    return projectMembers.filter((m) => m.name?.toLowerCase().includes(q));
  }, [projectMembers, assignSearch]);

  const handleAssign = async (memberId: number) => {
    try {
      await updateIssueMutation.mutateAsync({
        id: issue.id,
        data: { assigneeId: memberId },
      });
      setAssignDialogOpen(false);
      setAssignSearch('');
    } catch {
      // error toast shown by mutation
    }
  };

  const handleUnassign = async () => {
    try {
      await updateIssueMutation.mutateAsync({
        id: issue.id,
        data: { assigneeId: null },
      });
      setAssignDialogOpen(false);
      setAssignSearch('');
    } catch {
      // error toast shown by mutation
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="space-y-6 lg:col-span-2">
        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Description</CardTitle>
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

        {/* Attachments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2 text-sm font-semibold">
                  <Paperclip className="h-4 w-4" />
                  <span>Attachments</span>
                  {issue.attachments && issue.attachments.length > 0 && (
                    <Badge variant="outline">{issue.attachments.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>Files attached to this issue</CardDescription>
              </div>
              <AttachmentsUploader
                onUpload={(files) =>
                  updateIssueMutation.mutate({
                    id: issue.id,
                    data: {},
                    files: { attachments: files },
                  })
                }
                isPending={updateIssueMutation.isPending}
              />
            </div>
          </CardHeader>
          <CardContent>
            {issue.attachments && issue.attachments.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {issue.attachments.map((attachment) => {
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
                            onDeleteAttachment(attachment.id);
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
        {/* Issue Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Issue Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Created
                </label>
                <p className="flex items-center gap-1.5 text-sm text-zinc-900 dark:text-zinc-100">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  {format(issue.createdAt, 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              {issue.updatedAt && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Last Updated
                  </label>
                  <p className="flex items-center gap-1.5 text-sm text-zinc-900 dark:text-zinc-100">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    {format(issue.updatedAt, 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>

            {relatedTask && (
              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Related Task
                </label>
                <Link
                  href={
                    routes.portfolio.projects.allProjects
                      .detail(projectId)
                      .tasks.detail(relatedTask.id).href
                  }
                >
                  <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
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

        {/* Reported By */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              <User className="mr-2 inline h-4 w-4" />
              Reported By
            </CardTitle>
          </CardHeader>
          <CardContent>
            {issue.creator ? (
              <Link
                href={
                  routes.workforce.employees.employeeManagement.detail(
                    issue.creator.id
                  ).href
                }
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <EmployeeAvatar employee={issue.creator} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {issue.creator.name}
                  </p>
                  <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {issue.creator.designation || 'Issue Reporter'}
                  </p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No creator information
              </p>
            )}
          </CardContent>
        </Card>

        {/* Assigned To */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">
                <User className="mr-2 inline h-4 w-4" />
                Assigned To
              </CardTitle>
              <div className="flex shrink-0 items-center gap-1.5">
                {issue.assignee && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnassign}
                    disabled={updateIssueMutation.isPending}
                    className="h-7 gap-1.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    {updateIssueMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Unassign
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignDialogOpen(true)}
                  className="h-7 gap-1.5 text-xs"
                >
                  {issue.assignee ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5" />
                      Reassign
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      Assign
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {issue.assignee ? (
              <Link
                href={
                  routes.workforce.employees.employeeManagement.detail(
                    issue.assignee.id
                  ).href
                }
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <EmployeeAvatar employee={issue.assignee} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {issue.assignee.name}
                  </p>
                  <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {issue.assignee.designation || 'Assignee'}
                  </p>
                </div>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAssignDialogOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
              >
                <UserPlus className="h-4 w-4" />
                Click to assign a member
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign / Reassign Dialog */}
      <Dialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) setAssignSearch('');
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {issue.assignee ? 'Reassign Issue' : 'Assign Issue'}
            </DialogTitle>
            <DialogDescription>
              Select a project member to{' '}
              {issue.assignee ? 'reassign' : 'assign'} this issue to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search members..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const isCurrent = issue.assignee?.id === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleAssign(member.id)}
                      disabled={updateIssueMutation.isPending || isCurrent}
                      className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors disabled:cursor-not-allowed ${
                        isCurrent
                          ? 'border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <EmployeeAvatar
                        employee={member}
                        size="sm"
                        className="!size-9"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {member.name}
                        </p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {member.designation ||
                            member.department ||
                            'Team Member'}
                        </p>
                      </div>
                      {isCurrent && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      )}
                      {updateIssueMutation.isPending && !isCurrent && (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-400" />
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No members found
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
