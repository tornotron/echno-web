'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/hooks/project/use-projects';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FolderKanban,
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
} from 'lucide-react';
import {
  ProjectStatus,
  getProjectStatusLabel,
} from '@/types/project/project-status';
import { TaskStatus, getTaskStatusLabel } from '@/types/task';
import { AttachmentType, formatFileSize } from '@/types/attachment';
import { format } from 'date-fns';
import {
  TeamMembersSection,
  AttachmentsUploader,
} from '@/features/projects/components';
import { ScheduleTab } from '@/features/gantt/components/schedule-tab';
import { WBSTree } from '@/features/wbs/components/wbs-tree';
import { HealthTab } from '@/features/health/components/health-tab';
import { SCurveTab } from '@/features/evm/components/s-curve-tab';
import { RisksTab } from '@/features/risk/components/risks-tab';
import { useDeleteAttachment } from '@/hooks/attachment/use-attachment-mutations';
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
} from '@/components/ui/alert-dialog';
import {
  isValidAttachmentUrl,
  getSafeDownloadUrl,
} from '@/lib/utils/attachment-url';

const getStatusBadgeColor = (status: ProjectStatus): string => {
  const colors = {
    [ProjectStatus.open]:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    [ProjectStatus.upcoming]:
      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
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

const getTaskStatusColor = (status: TaskStatus): string => {
  const colors: Record<TaskStatus, string> = {
    [TaskStatus.upcoming]:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    [TaskStatus.onGoing]:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    [TaskStatus.onHold]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    [TaskStatus.completed]:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  };
  return colors[status] ?? '';
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
  const deleteAttachmentMutation = useDeleteAttachment();

  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete) return;
    try {
      await deleteAttachmentMutation.mutateAsync(attachmentToDelete);
      setAttachmentToDelete(null);
    } catch {
      toast.error('Failed to delete attachment');
      setAttachmentToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FolderKanban className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <h3 className="mb-2 text-lg font-medium">Failed to load project</h3>
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button onClick={() => router.push('/users/dashboard/projects')}>
            Back to Projects
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FolderKanban className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <h3 className="mb-2 text-lg font-medium">Project not found</h3>
          <Button onClick={() => router.push('/users/dashboard/projects')}>
            Back to Projects
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progress = Math.round(project.progress);
  const daysRemaining = project.endDate
    ? Math.ceil(
        (new Date(project.endDate).getTime() - now.getTime()) / 86_400_000
      )
    : null;

  const projectTasks = project.tasks ?? [];
  const completedTasks = projectTasks.filter(
    (t) => t.status === TaskStatus.completed
  ).length;
  const pendingTasks = projectTasks.filter(
    (t) => t.status === TaskStatus.onHold || t.status === TaskStatus.onGoing
  ).length;
  const totalIssues = projectTasks.reduce(
    (n, t) => n + (t.issues?.length ?? 0),
    0
  );
  const stats = {
    totalTasks: projectTasks.length,
    completedTasks,
    pendingTasks,
    issues: totalIssues,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {project.projectName}
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              <MapPin className="mr-1 inline h-4 w-4" />
              {project.projectAddress}
            </p>
            <Badge className={`mt-2 ${getStatusBadgeColor(project.status)}`}>
              {getProjectStatusLabel(project.status)}
            </Badge>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/users/dashboard/projects/${project.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </Link>
            </Button>
          </div>
        </div>
      </div>

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
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-6 space-y-4 sm:space-y-6">
          {/* Progress Overview */}
          {project.status !== ProjectStatus.upcoming && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
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

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href={`/users/dashboard/projects/${project.id}/tasks`}>
              <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Tasks
                  </CardTitle>
                  <ListTodo className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTasks}</div>
                  <p className="text-muted-foreground text-xs">
                    {stats.completedTasks} completed, {stats.pendingTasks}{' '}
                    pending
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/users/dashboard/projects/${project.id}/issues`}>
              <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Issues
                  </CardTitle>
                  <AlertCircle className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.issues}</div>
                  <p className="text-muted-foreground text-xs">
                    Active project issues
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Members
                </CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {project.members.length}
                </div>
                <p className="text-muted-foreground text-xs">
                  Active on project
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Team Members */}
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Members
                    </CardTitle>
                    <CardDescription>
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

              {/* Recent Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    Recent Tasks
                  </CardTitle>
                  <CardDescription>Latest task updates</CardDescription>
                </CardHeader>
                <CardContent>
                  {projectTasks.length > 0 ? (
                    <div className="space-y-3">
                      {projectTasks.slice(0, 5).map((task, index) => (
                        <div
                          key={task.id ?? index}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {task.title}
                          </p>
                          <Badge className={getTaskStatusColor(task.status)}>
                            {getTaskStatusLabel(task.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-zinc-600 dark:text-zinc-400">
                      <ListTodo className="mx-auto mb-2 h-12 w-12 opacity-50" />
                      <p>No tasks yet.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        asChild
                      >
                        <Link
                          href={`/users/dashboard/projects/${project.id}/tasks`}
                        >
                          <ListTodo className="mr-2 h-4 w-4" />
                          Create Task
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Paperclip className="h-5 w-5" />
                      Attachments
                      {project.attachments &&
                        project.attachments.length > 0 && (
                          <Badge variant="outline">
                            {project.attachments.length}
                          </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                      Files attached to this project
                    </CardDescription>
                  </div>
                  {projectId && <AttachmentsUploader projectId={projectId} />}
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      href={`/users/dashboard/projects/${project.id}/tasks/new`}
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
                    <Link href="/users/dashboard/projects/inspections/new">
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
                      href={`/users/dashboard/projects/${project.id}/issues/new`}
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
                  <CardTitle>Project Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Open Issues
                    </span>
                    <span className="font-medium text-red-600">
                      {stats.issues}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Task Completion
                    </span>
                    <span className="font-medium">
                      {stats.totalTasks > 0
                        ? `${Math.round(
                            (stats.completedTasks / stats.totalTasks) * 100
                          )}%`
                        : '0%'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Team Size
                    </span>
                    <span className="font-medium">
                      {project.members.length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Created On
                    </div>
                    <div className="font-medium">
                      {project.createdAt
                        ? format(project.createdAt, 'MMM dd, yyyy')
                        : 'Unknown'}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Location
                    </div>
                    <div className="flex items-start gap-1 font-medium">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="wrap-break-word">
                        {project.projectAddress}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
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
          <WBSTree tasks={projectTasks} />
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
