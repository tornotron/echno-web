'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/hooks/project/use-projects';
import { useUpdateProjectWithFiles } from '@/hooks/project/use-project-mutations';
import { toast } from '@/lib/styles/toast-styles';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FolderKanban,
  Edit,
  MapPin,
  Users,
  UserPlus,
  ListTodo,
  AlertCircle,
  Activity,
  Briefcase,
  ClipboardCheck,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Sheet,
  Box,
  File,
  Upload,
  Loader2,
} from 'lucide-react';
import {
  ProjectStatus,
  getProjectStatusLabel,
} from '@/types/project/project-status';
import { TaskStatus } from '@/types/task';
import { AttachmentType, formatFileSize } from '@/types/attachment';
import { format } from 'date-fns';
import { TeamMembersSection } from '@/features/projects/components';

// Helper function to validate attachment URLs
function isValidAttachmentUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    const scheme = parsedUrl.protocol.toLowerCase();

    // Only allow http, https protocols
    // Reject dangerous schemes like javascript:, data:, vbscript:, etc.
    const allowedSchemes = ['http:', 'https:'];
    return allowedSchemes.includes(scheme);
  } catch {
    // If URL parsing fails, reject it
    return false;
  }
}

// Helper function to get safe download URL
function getSafeDownloadUrl(attachment: { id?: number; file: string }): string {
  // Validate the URL
  if (!isValidAttachmentUrl(attachment.file)) {
    return '#'; // Return a safe fallback
  }

  // In a real application, you would return a proxy endpoint like:
  // return `/api/attachments/${attachment.id}/download`;
  // For now, return the validated URL
  return attachment.file;
}

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
  const projectId = params.id
    ? Number.parseInt(params.id as string)
    : undefined;
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const updateProjectWithFiles = useUpdateProjectWithFiles();

  // Fetch project data
  const { data: project, isLoading, error } = useProject(projectId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !projectId) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const selectedFiles = [...e.target.files];
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    }

    if (invalidFiles.length > 0) {
      toast.error(
        `The following files exceed 10MB and were not uploaded: ${invalidFiles.join(', ')}`
      );
    }

    if (validFiles.length > 0) {
      updateProjectWithFiles.mutate({
        id: projectId,
        data: {},
        files: { attachments: validFiles },
      });
    }

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading project...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Failed to load project
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
            <Button onClick={() => router.push('/users/dashboard/projects')}>
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Project not found
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              The project you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <Button onClick={() => router.push('/users/dashboard/projects')}>
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getProjectProgress = (): number => {
    if (!project.startDate || !project.endDate) return 0;
    if (project.status === ProjectStatus.completed) return 100;
    if (project.status === ProjectStatus.upcoming) return 0;

    const now = new Date();
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
  };

  const calculateDaysRemaining = (): number => {
    if (!project.endDate) return 0;
    const now = new Date();
    const end = new Date(project.endDate);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const progress = getProjectProgress();
  const daysRemaining = calculateDaysRemaining();

  // Calculate statistics from real project data
  const projectTasks = project.tasks ?? [];
  const completedTasks = projectTasks.filter(
    (task) => task.status === TaskStatus.completed
  ).length;
  const pendingTasks = projectTasks.filter(
    (task) =>
      task.status === TaskStatus.onHold || task.status === TaskStatus.onGoing
  ).length;

  // Count issues from all tasks in this project
  const totalIssues = projectTasks.reduce(
    (count, task) => count + (task.issues?.length || 0),
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
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/users/dashboard/projects/${project.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Link>
          </Button>
        </div>
      </div>

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
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {progress}%
                </span>
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
                <div className="text-muted-foreground text-xs">Start Date</div>
                <div className="text-sm font-medium">
                  {project.startDate
                    ? format(project.startDate, 'MMM dd, yyyy')
                    : 'Not set'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">End Date</div>
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
                  className={`text-sm font-medium ${daysRemaining < 30 ? 'text-red-600' : 'text-zinc-900 dark:text-zinc-100'}`}
                >
                  {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Duration</div>
                <div className="text-sm font-medium">
                  {project.endDate && project.startDate
                    ? `${Math.round((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
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
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ListTodo className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-muted-foreground text-xs">
                {stats.completedTasks} completed, {stats.pendingTasks} pending
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
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.members.length}</div>
            <p className="text-muted-foreground text-xs">Active on project</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
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
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {task.title}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {task.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-zinc-600 dark:text-zinc-400">
                  <ListTodo className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>No tasks yet. Create tasks to track project progress.</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
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
                  {project.attachments && project.attachments.length > 0 && (
                    <Badge variant="outline">
                      {project.attachments.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Files attached to this project
                </CardDescription>
              </div>
              <div>
                <Input
                  id="attachment-upload"
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.dwg,.dxf"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updateProjectWithFiles.isPending}
                  onClick={() =>
                    (
                      document.querySelector(
                        '#attachment-upload'
                      ) as HTMLElement
                    )?.click()
                  }
                >
                  {updateProjectWithFiles.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {project.attachments && project.attachments.length > 0 ? (
                <div className="space-y-2">
                  {project.attachments.map((attachment) => {
                    const Icon = getAttachmentIcon(attachment.fileType);
                    const attachmentKey =
                      attachment.id ||
                      `${attachment.file}-${attachment.createdAt?.getTime() || 'noDate'}`;
                    const safeDownloadUrl = getSafeDownloadUrl(attachment);
                    const isValidUrl = isValidAttachmentUrl(attachment.file);

                    return (
                      <div
                        key={attachmentKey}
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
                                {format(attachment.createdAt, 'MMM d, yyyy')}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild={isValidUrl}
                          disabled={!isValidUrl}
                        >
                          {isValidUrl ? (
                            <a
                              href={safeDownloadUrl}
                              download
                              aria-label={`Download ${attachment.fileName}`}
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          ) : (
                            <span>
                              <Download className="h-4 w-4" />
                            </span>
                          )}
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
          {/* Quick Actions */}
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

          {/* Project Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Project Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Open Issues
                </span>
                <span className="font-medium text-red-600">{stats.issues}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Task Completion
                </span>
                <span className="font-medium">
                  {stats.totalTasks > 0
                    ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Team Size
                </span>
                <span className="font-medium">{project.members.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Project Info */}
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
    </div>
  );
}
