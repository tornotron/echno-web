'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  useProject,
  useUpdateProjectWithFiles,
} from '@tornotron/echno-core/project/hooks';
import { useTasksByProject } from '@tornotron/echno-core/task/hooks';
import { useIssuesByProject } from '@tornotron/echno-core/issue/hooks';
import { cn } from '@/lib/utils/index';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Separator } from '@/components/shadcn/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import {
  FolderKanban,
  Loader2,
  Briefcase,
  Edit,
  MapPin,
  Users,
  UserPlus,
  ListTodo,
  AlertCircle,
  Activity,
  ClipboardCheck,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Sheet,
  Box,
  File,
  Trash2,
  GanttChart,
  Network,
  HeartPulse,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  ProjectStatus,
  getProjectStatusLabel,
} from '@tornotron/echno-core/project/types';
import { TaskStatus } from '@tornotron/echno-core/task/types';
import { IssueStatus } from '@tornotron/echno-core/issue/types';
import {
  AttachmentType,
  formatFileSize,
} from '@tornotron/echno-core/attachment/types';
import { useDeleteAttachment } from '@tornotron/echno-core/attachment/hooks';
import { format } from 'date-fns';
import { TeamMembersSection } from '@/features/projects/components';
import { AttachmentsUploader } from '@/components/common';
import { ScheduleTab } from '@/features/gantt/components/schedule-tab';
import { WBSTree } from '@/features/wbs/components/wbs-tree';
import { HealthTab } from '@/features/health/components/health-tab';
import { SCurveTab } from '@/features/evm/components/s-curve-tab';
import { RisksTab } from '@/features/risk/components/risks-tab';
import { ProjectComplianceTab } from '@/features/compliance/components';
import { toast } from '@/lib/styles/toast-styles';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';
import {
  isValidAttachmentUrl,
  getSafeDownloadUrl,
} from '@/lib/utils/attachment-url';
import { PageHeader } from '@/components/common/page-header';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { routes } from '@/nav';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const getStatusBadgeColor = (status: ProjectStatus): string => {
  const colors = {
    [ProjectStatus.open]:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    [ProjectStatus.upcoming]:
      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    [ProjectStatus.approved]:
      'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
    [ProjectStatus.completed]:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    [ProjectStatus.closed]:
      'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    [ProjectStatus.onHold]:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    [ProjectStatus.cancelled]:
      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    [ProjectStatus.dropped]:
      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[status];
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

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const now = new Date();
  const projectId = params.id
    ? Number.parseInt(params.id as string)
    : undefined;
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<number | null>(
    null
  );

  const { data: project, isLoading, error } = useProject(projectId);
  const {
    data: tasks,
    isLoading: isTasksLoading,
    isError: isTasksError,
  } = useTasksByProject(projectId);
  const {
    data: issues,
    isLoading: isIssuesLoading,
    isError: isIssuesError,
  } = useIssuesByProject(projectId);
  const deleteAttachmentMutation = useDeleteAttachment();
  const updateProjectWithFiles = useUpdateProjectWithFiles();

  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete) return;
    try {
      await deleteAttachmentMutation.mutateAsync(attachmentToDelete);
      toast.success('Attachment Deleted', {
        description: 'The attachment has been removed.',
      });
      setAttachmentToDelete(null);
    } catch {
      toast.error('Failed to delete attachment');
      setAttachmentToDelete(null);
    }
  };

  if (isLoading || isTasksLoading || isIssuesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <FolderKanban className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load project</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error ? error.message : 'An error occurred'}
          </EmptyDescription>
        </EmptyHeader>
        <Button
          onClick={() =>
            router.push(routes.portfolio.projects.allProjects.href)
          }
        >
          Back to Projects
        </Button>
      </Empty>
    );
  }

  if (!project) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <FolderKanban className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Project not found</EmptyTitle>
          <EmptyDescription>
            The project you&apos;re looking for doesn&apos;t exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          onClick={() =>
            router.push(routes.portfolio.projects.allProjects.href)
          }
        >
          Back to Projects
        </Button>
      </Empty>
    );
  }

  if (isTasksError || isIssuesError) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <FolderKanban className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load project data</EmptyTitle>
          <EmptyDescription>
            {isTasksError ? 'Tasks' : 'Issues'} could not be loaded. Please try
            again.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          onClick={() =>
            router.push(routes.portfolio.projects.allProjects.href)
          }
        >
          Back to Projects
        </Button>
      </Empty>
    );
  }

  const progress = Math.round(project.progress);
  const daysRemaining = project.endDate
    ? Math.ceil(
        (new Date(project.endDate).getTime() - now.getTime()) / 86_400_000
      )
    : null;

  const resolvedTasks = tasks ?? [];
  const resolvedIssues = issues ?? [];

  const taskStats = {
    total: resolvedTasks.length,
    upcoming: resolvedTasks.filter((t) => t.status === TaskStatus.upcoming)
      .length,
    onGoing: resolvedTasks.filter((t) => t.status === TaskStatus.onGoing)
      .length,
    completed: resolvedTasks.filter((t) => t.status === TaskStatus.completed)
      .length,
  };
  const issueStats = {
    total: resolvedIssues.length,
    open: resolvedIssues.filter((i) => i.status === IssueStatus.open).length,
    inProgress: resolvedIssues.filter(
      (i) => i.status === IssueStatus.inProgress
    ).length,
    resolved: resolvedIssues.filter((i) => i.status === IssueStatus.resolved)
      .length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader
        title={project.projectName}
        description={
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {project.projectAddress}
          </span>
        }
        badge={
          <Badge className={getStatusBadgeColor(project.status)}>
            {getProjectStatusLabel(project.status)}
          </Badge>
        }
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link
              href={
                routes.portfolio.projects.allProjects.detail(project.id).edit
              }
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Link>
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-zinc-100 px-1.5 py-1.5 dark:bg-zinc-800/60">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <FolderKanban className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-1.5">
            <GanttChart className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="wbs" className="flex items-center gap-1.5">
            <Network className="h-4 w-4" />
            WBS
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-1.5">
            <HeartPulse className="h-4 w-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="s-curve" className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            S-Curve
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" />
            Risks
          </TabsTrigger>
          <TabsTrigger
            value="compliance"
            className="flex items-center gap-1.5"
          >
            <ShieldCheck className="h-4 w-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-6 space-y-4 sm:space-y-6">
          {/* Progress Overview */}
          {project.status !== ProjectStatus.upcoming && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="h-4 w-4" />
                  Project Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Overall Progress
                    </span>
                    <span className="font-bold">{progress}%</span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        progress === 100 ? 'bg-purple-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 md:grid-cols-4">
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Start Date
                    </div>
                    <div className="text-sm font-medium">
                      {project.startDate
                        ? format(project.startDate, 'MMM dd, yyyy')
                        : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      End Date
                    </div>
                    <div className="text-sm font-medium">
                      {project.endDate
                        ? format(project.endDate, 'MMM dd, yyyy')
                        : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Days Remaining
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        daysRemaining !== null && daysRemaining < 30
                          ? 'text-red-600'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {daysRemaining === null
                        ? 'Not set'
                        : daysRemaining > 0
                          ? `${daysRemaining} days`
                          : 'Overdue'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Duration
                    </div>
                    <div className="text-sm font-medium">
                      {project.endDate && project.startDate
                        ? `${Math.round(
                            (new Date(project.endDate).getTime() -
                              new Date(project.startDate).getTime()) /
                              86_400_000
                          )} days`
                        : 'Not set'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task & Issue Stats */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Tasks */}
            <Card className="gap-0 p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Tasks
                </p>
                <Link
                  href={
                    routes.portfolio.projects.allProjects.detail(project.id)
                      .tasks.href
                  }
                  className="text-primary text-xs hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
                {(
                  [
                    {
                      label: 'Total',
                      count: taskStats.total,
                      valueClass: 'text-zinc-900 dark:text-zinc-100',
                      icon: ListTodo,
                      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
                      iconClass: 'text-blue-600 dark:text-blue-400',
                      description: 'in project',
                    },
                    {
                      label: 'Upcoming',
                      count: taskStats.upcoming,
                      valueClass: 'text-zinc-500 dark:text-zinc-400',
                      icon: Clock,
                      iconBg: 'bg-zinc-100 dark:bg-zinc-800',
                      iconClass: 'text-zinc-500 dark:text-zinc-400',
                      description: 'not started',
                    },
                    {
                      label: 'On Going',
                      count: taskStats.onGoing,
                      valueClass: 'text-blue-600 dark:text-blue-400',
                      icon: Activity,
                      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
                      iconClass: 'text-blue-600 dark:text-blue-400',
                      description: 'in progress',
                    },
                    {
                      label: 'Completed',
                      count: taskStats.completed,
                      valueClass: 'text-emerald-600 dark:text-emerald-400',
                      icon: CheckCircle,
                      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
                      iconClass: 'text-emerald-600 dark:text-emerald-400',
                      description: 'done',
                    },
                  ] as const
                ).map(
                  (
                    {
                      label,
                      count,
                      valueClass,
                      icon: Icon,
                      iconBg,
                      iconClass,
                      description,
                    },
                    i
                  ) => {
                    let padClass = 'sm:px-6';
                    if (i === 0) padClass = 'sm:pr-6';
                    else if (i === 3) padClass = 'sm:pl-6';
                    return (
                      <div
                        key={label}
                        className={cn(
                          'flex flex-col gap-1 rounded-lg p-3 sm:rounded-none',
                          padClass
                        )}
                      >
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {label}
                        </p>
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-2xl font-bold tracking-tight ${valueClass}`}
                          >
                            {count}
                          </p>
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
                          >
                            <Icon className={`size-4 ${iconClass}`} />
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          {description}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </Card>

            {/* Issues */}
            <Card className="gap-0 p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Issues
                </p>
                <Link
                  href={
                    routes.portfolio.projects.allProjects.detail(project.id)
                      .issues.href
                  }
                  className="text-primary text-xs hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
                {(
                  [
                    {
                      label: 'Total',
                      count: issueStats.total,
                      valueClass: 'text-zinc-900 dark:text-zinc-100',
                      icon: FileText,
                      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
                      iconClass: 'text-blue-600 dark:text-blue-400',
                      description: 'in project',
                    },
                    {
                      label: 'Open',
                      count: issueStats.open,
                      valueClass: 'text-red-600 dark:text-red-400',
                      icon: AlertCircle,
                      iconBg: 'bg-red-50 dark:bg-red-950/30',
                      iconClass: 'text-red-600 dark:text-red-400',
                      description: 'need attention',
                    },
                    {
                      label: 'In Progress',
                      count: issueStats.inProgress,
                      valueClass: 'text-blue-600 dark:text-blue-400',
                      icon: Activity,
                      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
                      iconClass: 'text-blue-600 dark:text-blue-400',
                      description: 'being worked on',
                    },
                    {
                      label: 'Resolved',
                      count: issueStats.resolved,
                      valueClass: 'text-emerald-600 dark:text-emerald-400',
                      icon: CheckCircle,
                      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
                      iconClass: 'text-emerald-600 dark:text-emerald-400',
                      description: 'closed out',
                    },
                  ] as const
                ).map(
                  (
                    {
                      label,
                      count,
                      valueClass,
                      icon: Icon,
                      iconBg,
                      iconClass,
                      description,
                    },
                    i
                  ) => {
                    let padClass = 'sm:px-6';
                    if (i === 0) padClass = 'sm:pr-6';
                    else if (i === 3) padClass = 'sm:pl-6';
                    return (
                      <div
                        key={label}
                        className={cn(
                          'flex flex-col gap-1 rounded-lg p-3 sm:rounded-none',
                          padClass
                        )}
                      >
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {label}
                        </p>
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-2xl font-bold tracking-tight ${valueClass}`}
                          >
                            {count}
                          </p>
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
                          >
                            <Icon className={`size-4 ${iconClass}`} />
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          {description}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Team Members */}
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Users className="h-4 w-4" />
                      Team Members
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      {project.members.length} members working on this project
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddMemberDialogOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </CardHeader>
                <CardContent>
                  <TeamMembersSection
                    projectId={project.id}
                    members={project.members || []}
                    isDialogOpen={isAddMemberDialogOpen}
                    onDialogOpenChange={setIsAddMemberDialogOpen}
                  />
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Paperclip className="h-4 w-4" />
                      Attachments
                      {project.attachments &&
                        project.attachments.length > 0 && (
                          <Badge variant="outline">
                            {project.attachments.length}
                          </Badge>
                        )}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      Files attached to this project
                    </CardDescription>
                  </div>
                  {projectId && (
                    <AttachmentsUploader
                      onUpload={(files) => {
                        const valid = files.filter(
                          (f) => f.size <= MAX_FILE_SIZE
                        );
                        const invalid = files
                          .filter((f) => f.size > MAX_FILE_SIZE)
                          .map((f) => f.name);
                        if (invalid.length > 0)
                          toast.error('Some files exceed 10MB', {
                            description: `Not uploaded: ${invalid.join(', ')}`,
                          });
                        if (valid.length > 0)
                          updateProjectWithFiles.mutate(
                            {
                              id: projectId,
                              data: {},
                              files: { attachments: valid },
                            },
                            {
                              onSuccess: () => {
                                toast.success('Project Updated', {
                                  description:
                                    'The project has been updated successfully',
                                });
                              },
                              onError: (error) => {
                                const title = getErrorTitle(
                                  error,
                                  'Failed to Update Project'
                                );
                                const description = getErrorMessage(error);
                                toast.error(title, { description });
                              },
                            }
                          );
                      }}
                      isPending={updateProjectWithFiles.isPending}
                    />
                  )}
                </CardHeader>
                <CardContent>
                  {project.attachments && project.attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {project.attachments.map((attachment) => {
                        const Icon = getAttachmentIcon(attachment.fileType);
                        const key =
                          attachment.id ||
                          `${attachment.file}-${attachment.createdAt?.getTime() ?? 'noDate'}`;
                        const safeUrl = getSafeDownloadUrl(attachment);
                        const isValid = isValidAttachmentUrl(attachment.file);
                        return (
                          <div
                            key={key}
                            className="group relative flex h-28 w-28 flex-col items-center justify-between rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="w-full truncate text-center text-xs font-medium">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {formatFileSize(attachment.fileSize)}
                            </p>
                            {isValid && (
                              <a
                                href={safeUrl}
                                download
                                aria-label={`Download ${attachment.fileName}`}
                                className="absolute inset-0 flex items-center justify-center rounded-lg bg-zinc-900/60 opacity-0 transition-opacity group-hover:opacity-100"
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
                                  setAttachmentToDelete(attachment.id);
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      href={
                        routes.portfolio.projects.allProjects.detail(project.id)
                          .tasks.new
                      }
                    >
                      <ListTodo className="mr-2 h-4 w-4" />
                      Create Task
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={routes.portfolio.inspections.new}>
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Schedule Inspection
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      href={
                        routes.portfolio.projects.allProjects.detail(project.id)
                          .issues.new
                      }
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Report Issue
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/users/dashboard/resources/material-requests/new">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Material Request
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">
                    Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Created On
                    </div>
                    <div className="text-sm font-medium">
                      {project.createdAt
                        ? format(project.createdAt, 'MMM dd, yyyy')
                        : 'Unknown'}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Location
                    </div>
                    <div className="flex items-start gap-1 font-medium">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium wrap-break-word">
                        {project.projectAddress}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Coordinates
                    </div>
                    <div className="text-sm font-medium">
                      {project.projectLatitude.toFixed(4)},{' '}
                      {project.projectLongitude.toFixed(4)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Schedule ─────────────────────────────────────────────────────── */}
        <TabsContent value="schedule" className="mt-6">
          <ScheduleTab project={project} />
        </TabsContent>

        {/* ── WBS ──────────────────────────────────────────────────────────── */}
        <TabsContent value="wbs" className="mt-6">
          <WBSTree tasks={resolvedTasks} />
        </TabsContent>

        {/* ── Health ───────────────────────────────────────────────────────── */}
        <TabsContent value="health" className="mt-6">
          <HealthTab project={project} />
        </TabsContent>

        {/* ── S-Curve ──────────────────────────────────────────────────────── */}
        <TabsContent value="s-curve" className="mt-6">
          <SCurveTab project={project} />
        </TabsContent>

        {/* ── Risks ────────────────────────────────────────────────────────── */}
        <TabsContent value="risks" className="mt-6">
          <RisksTab projectId={project.id} />
        </TabsContent>

        {/* ── Compliance ───────────────────────────────────────────────────── */}
        <TabsContent value="compliance" className="mt-6">
          <ProjectComplianceTab projectId={project.id} />
        </TabsContent>
      </Tabs>

      {/* Delete Attachment Dialog */}
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
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAttachment();
              }}
              disabled={deleteAttachmentMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAttachmentMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
