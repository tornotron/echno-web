'use client';

import { use, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  useProject,
  useEmployeesByProject,
} from '@/hooks/project/use-projects';
import {
  useIssue,
  useCreateIssueComment,
  useUpdateIssueWithFiles,
} from '@/hooks/issue';
import { useTask } from '@/hooks/task';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { useDeleteAttachment } from '@/hooks/attachment/use-attachment-mutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Calendar,
  User,
  ListTodo,
  AlertCircle,
  Edit,
  MessageSquare,
  Loader2,
  Send,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Sheet,
  Box,
  File,
  Trash2,
  Search,
  UserCheck,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { getIssueTypeLabel, getIssueTypeColor } from '@/types/issue/issue-type';
import { IssueStatus } from '@/types/issue';
import { AttachmentType, formatFileSize } from '@/types/attachment';
import {
  isValidAttachmentUrl,
  getSafeDownloadUrl,
} from '@/lib/utils/attachment-url';
import { IssueAttachmentsUploader } from '@/features/issues/components';

interface PageProps {
  params: Promise<{ id: string; issueId: string }>;
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

const AVATAR_GRADIENTS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-teal-500 to-teal-600',
  'from-orange-500 to-orange-600',
  'from-rose-500 to-rose-600',
  'from-green-500 to-green-600',
  'from-indigo-500 to-indigo-600',
];

function getAvatarGradient(name: string | undefined): string {
  if (!name) return 'from-zinc-400 to-zinc-500';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (name.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export default function IssueDetailPage({ params }: PageProps) {
  const { id: projectId, issueId: issueIdParam } = use(params);
  const searchParams = useSearchParams();

  const { data: issue, isLoading: issueLoading } = useIssue(
    Number.parseInt(issueIdParam)
  );
  const { data: relatedTask } = useTask(issue?.taskId);
  const { data: project } = useProject(Number.parseInt(projectId));

  // Forward navigation context to the edit page so breadcrumbs stay correct
  const fromParam = searchParams.get('from');
  const taskIdParam = searchParams.get('taskId');
  const editHref = (() => {
    const base = `/users/dashboard/projects/${projectId}/issues/${issueIdParam}/edit`;
    if (fromParam && taskIdParam)
      return `${base}?from=${fromParam}&taskId=${taskIdParam}`;
    return base;
  })();

  const [attachmentToDelete, setAttachmentToDelete] = useState<number | null>(
    null
  );
  const [commentText, setCommentText] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');

  const deleteAttachmentMutation = useDeleteAttachment();
  const createCommentMutation = useCreateIssueComment();
  const updateIssueMutation = useUpdateIssueWithFiles();
  const { data: currentEmployee } = useCurrentUserEmployee();
  const { data: projectMembers = [] } = useEmployeesByProject(
    Number.parseInt(projectId)
  );

  const filteredMembers = useMemo(() => {
    if (!assignSearch.trim()) return projectMembers;
    const q = assignSearch.toLowerCase();
    return projectMembers.filter((m) => m.name?.toLowerCase().includes(q));
  }, [projectMembers, assignSearch]);

  const handleAssign = async (memberId: number) => {
    if (!issue?.id) return;
    try {
      await updateIssueMutation.mutateAsync({
        id: issue.id,
        data: { assigneeId: memberId },
        files: { attachments: [] },
      });
      setAssignDialogOpen(false);
      setAssignSearch('');
    } catch {
      // error toast shown by mutation
    }
  };

  const handleUnassign = async () => {
    if (!issue?.id) return;
    try {
      await updateIssueMutation.mutateAsync({
        id: issue.id,
        data: { assigneeId: undefined },
        files: { attachments: [] },
      });
      setAssignDialogOpen(false);
      setAssignSearch('');
    } catch {
      // error toast shown by mutation
    }
  };

  const handleDeleteAttachment = async () => {
    if (attachmentToDelete === null) return;
    try {
      await deleteAttachmentMutation.mutateAsync(attachmentToDelete);
      setAttachmentToDelete(null);
    } catch {
      // error toast shown by mutation
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !issue?.id) return;

    try {
      await createCommentMutation.mutateAsync({
        issueId: issue.id,
        data: {
          comment: commentText.trim(),
          author: currentEmployee,
          createdAt: new Date(),
        },
      });
      setCommentText('');
    } catch {
      // error toast already shown by mutation hook
    }
  };

  const handleCommentKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddComment();
    }
  };

  if (issueLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!issue) {
    return (
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
    );
  }

  return (
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
          <Link href={editHref}>
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

          {/* Attachments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Paperclip className="h-5 w-5" />
                    <span>Attachments</span>
                    {issue.attachments && issue.attachments.length > 0 && (
                      <Badge variant="outline">
                        {issue.attachments.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Files attached to this issue
                  </CardDescription>
                </div>
                {issue.id && <IssueAttachmentsUploader issueId={issue.id} />}
              </div>
            </CardHeader>
            <CardContent>
              {issue.attachments && issue.attachments.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {issue.attachments.map((attachment) => {
                    const Icon = getAttachmentIcon(attachment.fileType);
                    const attachmentKey =
                      attachment.id ||
                      `${attachment.file}-${attachment.createdAt?.getTime() || 'noDate'}`;
                    const safeDownloadUrl = getSafeDownloadUrl(attachment);
                    const isValidUrl = isValidAttachmentUrl(attachment.file);

                    return (
                      <div
                        key={attachmentKey}
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
                              setAttachmentToDelete(attachment.id!);
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

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span>Comments</span>
                {issue.comments && issue.comments.length > 0 && (
                  <Badge variant="outline" className="ml-1">
                    {issue.comments.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Discussion and updates about this issue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 px-6 pb-6">
              {/* Comment list */}
              {issue.comments && issue.comments.length > 0 ? (
                <div className="mb-6 space-y-1">
                  {issue.comments.map((comment, index) => {
                    const gradient = getAvatarGradient(comment.author?.name);
                    const initial =
                      comment.author?.name?.charAt(0).toUpperCase() || '?';
                    const isLast = index === issue.comments!.length - 1;
                    return (
                      <div key={comment.id ?? index} className="flex gap-3">
                        {/* Avatar + thread line */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${gradient}`}
                          >
                            <span className="text-xs font-semibold text-white">
                              {initial}
                            </span>
                          </div>
                          {!isLast && (
                            <div className="mt-1 w-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                          )}
                        </div>

                        {/* Comment body */}
                        <div className={`flex-1 pb-5 ${isLast ? 'pb-0' : ''}`}>
                          <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
                            {/* Comment header */}
                            <div className="flex items-center justify-between rounded-t-lg border-b border-zinc-200 bg-zinc-100 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-800/60">
                              <div className="flex items-center gap-2">
                                {comment.author ? (
                                  <Link
                                    href={`/users/dashboard/workforce/employees/${comment.author.id}`}
                                    className="text-sm font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                                  >
                                    {comment.author.name}
                                  </Link>
                                ) : (
                                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    Unknown
                                  </span>
                                )}
                                <span className="text-zinc-400">·</span>
                                <span
                                  className="text-xs text-zinc-500 dark:text-zinc-400"
                                  title={format(
                                    comment.createdAt,
                                    'MMM d, yyyy HH:mm'
                                  )}
                                >
                                  {formatDistanceToNow(comment.createdAt, {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                            </div>
                            {/* Comment text */}
                            <div className="px-4 py-3">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                                {comment.comment}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mb-6 rounded-lg border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
                  <MessageSquare className="mx-auto mb-3 h-9 w-9 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    No comments yet
                  </p>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    Be the first to leave a comment
                  </p>
                </div>
              )}

              {/* Comment composer */}
              <div className="flex gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${getAvatarGradient(currentEmployee?.name)}`}
                >
                  <span className="text-xs font-semibold text-white">
                    {currentEmployee?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {currentEmployee?.name && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Commenting as{' '}
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {currentEmployee.name}
                      </span>
                    </p>
                  )}
                  <Textarea
                    placeholder="Leave a comment…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={handleCommentKeyDown}
                    rows={3}
                    className="resize-none"
                    disabled={createCommentMutation.isPending}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      <kbd className="rounded border border-zinc-300 px-1 py-0.5 font-mono text-[10px] dark:border-zinc-700">
                        Ctrl
                      </kbd>
                      {' + '}
                      <kbd className="rounded border border-zinc-300 px-1 py-0.5 font-mono text-[10px] dark:border-zinc-700">
                        Enter
                      </kbd>
                      {' to submit'}
                    </span>
                    <div className="flex items-center gap-2">
                      {commentText.trim() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCommentText('')}
                          disabled={createCommentMutation.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={
                          !commentText.trim() || createCommentMutation.isPending
                        }
                      >
                        {createCommentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Posting…
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-3.5 w-3.5" />
                            Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Issue Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Issue Summary</CardTitle>
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
                    href={`/users/dashboard/projects/${projectId}/tasks/${relatedTask.id}`}
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
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${getAvatarGradient(issue.creator.name)}`}
                    >
                      <span className="text-sm font-medium text-white">
                        {issue.creator.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {issue.creator.name}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {issue.creator.designation || 'Issue Reporter'}
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

          {/* Assigned To */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">
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
                  href={`/users/dashboard/workforce/employees/${issue.assignee.id}`}
                  className="block rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${getAvatarGradient(issue.assignee.name)}`}
                    >
                      <span className="text-sm font-medium text-white">
                        {issue.assignee.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {issue.assignee.name}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {issue.assignee.designation || 'Assignee'}
                      </p>
                    </div>
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
                          onClick={() => member.id && handleAssign(member.id)}
                          disabled={updateIssueMutation.isPending || isCurrent}
                          className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors disabled:cursor-not-allowed ${
                            isCurrent
                              ? 'border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${getAvatarGradient(member.name)}`}
                          >
                            <span className="text-sm font-medium text-white">
                              {member.name?.charAt(0) || '?'}
                            </span>
                          </div>
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
      </div>

      {/* Delete Attachment Confirmation Dialog */}
      <AlertDialog
        open={attachmentToDelete !== null}
        onOpenChange={(open) => !open && setAttachmentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attachment? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAttachmentMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttachment}
              disabled={deleteAttachmentMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAttachmentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
