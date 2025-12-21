'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout, Pagination, FiltersCard } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FolderKanban,
  MapPin,
  Plus,
  Users,
  ListTodo,
  CheckCircle2,
  Clock,
  XCircle,
  Pause,
  TrendingUp,
  Eye,
  Edit,
} from 'lucide-react';
import {
  ProjectStatus,
  getProjectStatusLabel,
} from '@/types/project/project-status';
import type { Project } from '@/types/project/project';
import { mockProjects } from '@/components/shared/mock-data';

interface ProjectFilters {
  search: string;
  status: ProjectStatus | 'all';
}

export default function ProjectsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 4 columns x 3 rows

  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: 'all',
  });

  // Filter projects
  const filteredProjects = useMemo(() => {
    return mockProjects.filter((project) => {
      const matchesSearch =
        project.projectName
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        project.projectAddress
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesStatus =
        filters.status === 'all' || project.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [filters]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  // Handle filter changes
  const handleFilterChange = (
    key: keyof ProjectFilters,
    value: string | ProjectStatus
  ) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  // Statistics
  const totalProjects = mockProjects.length;
  const activeProjects = mockProjects.filter(
    (p) => p.status === ProjectStatus.open
  ).length;
  const completedProjects = mockProjects.filter(
    (p) => p.status === ProjectStatus.completed
  ).length;
  const upcomingProjects = mockProjects.filter(
    (p) => p.status === ProjectStatus.upcoming
  ).length;

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.open: {
        return <TrendingUp className="h-4 w-4" />;
      }
      case ProjectStatus.completed: {
        return <CheckCircle2 className="h-4 w-4" />;
      }
      case ProjectStatus.upcoming: {
        return <Clock className="h-4 w-4" />;
      }
      case ProjectStatus.onHold: {
        return <Pause className="h-4 w-4" />;
      }
      case ProjectStatus.cancelled:
      case ProjectStatus.dropped: {
        return <XCircle className="h-4 w-4" />;
      }
      default: {
        return <FolderKanban className="h-4 w-4" />;
      }
    }
  };

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

  const getProjectProgress = (project: Project): number => {
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

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Manage and monitor all construction projects
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
              <FolderKanban className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-muted-foreground text-xs">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Projects
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeProjects}
              </div>
              <p className="text-muted-foreground text-xs">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {completedProjects}
              </div>
              <p className="text-muted-foreground text-xs">
                Successfully finished
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {upcomingProjects}
              </div>
              <p className="text-muted-foreground text-xs">Not started yet</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <FiltersCard
          title="Search & Filters"
          searchPlaceholder="Search projects..."
          searchValue={filters.search}
          onSearchChange={(value) => handleFilterChange('search', value)}
        >
          <div className="w-full sm:w-[200px]">
            <Select
              value={filters.status}
              onValueChange={(value) =>
                handleFilterChange('status', value as ProjectStatus | 'all')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={ProjectStatus.open}>
                  {getProjectStatusLabel(ProjectStatus.open)}
                </SelectItem>
                <SelectItem value={ProjectStatus.upcoming}>
                  {getProjectStatusLabel(ProjectStatus.upcoming)}
                </SelectItem>
                <SelectItem value={ProjectStatus.completed}>
                  {getProjectStatusLabel(ProjectStatus.completed)}
                </SelectItem>
                <SelectItem value={ProjectStatus.closed}>
                  {getProjectStatusLabel(ProjectStatus.closed)}
                </SelectItem>
                <SelectItem value={ProjectStatus.onHold}>
                  {getProjectStatusLabel(ProjectStatus.onHold)}
                </SelectItem>
                <SelectItem value={ProjectStatus.cancelled}>
                  {getProjectStatusLabel(ProjectStatus.cancelled)}
                </SelectItem>
                <SelectItem value={ProjectStatus.dropped}>
                  {getProjectStatusLabel(ProjectStatus.dropped)}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FiltersCard>

        {/* Projects Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Showing {paginatedProjects.length} of {filteredProjects.length}{' '}
              projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {paginatedProjects.map((project: Project) => {
                const progress = getProjectProgress(project);
                return (
                  <Card
                    key={project.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex flex-1 items-start gap-3">
                          <div
                            className={`rounded-lg p-2 ${getStatusBadgeColor(project.status)}`}
                          >
                            <FolderKanban className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="line-clamp-2 text-base">
                              {project.projectName}
                            </CardTitle>
                            <Badge variant="outline" className="mt-1">
                              <span className="flex items-center gap-1">
                                {getStatusIcon(project.status)}
                                {getProjectStatusLabel(project.status)}
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-muted-foreground line-clamp-2 text-sm">
                        <MapPin className="mr-1 inline h-3 w-3" />
                        {project.projectAddress}
                      </div>

                      {/* Progress Bar */}
                      {project.status !== ProjectStatus.upcoming &&
                        project.status !== ProjectStatus.cancelled && (
                          <div>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                Progress
                              </span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  progress === 100
                                    ? 'bg-purple-600'
                                    : 'bg-green-600'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                      <div className="grid grid-cols-2 gap-4">
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
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{project.members.length} members</span>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <ListTodo className="h-4 w-4" />
                          <span>{project.tasks.length} tasks</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/dashboard/projects/${project.id}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            Dashboard
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/dashboard/projects/${project.id}/edit`}>
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {paginatedProjects.length === 0 && (
              <div className="py-12 text-center">
                <FolderKanban className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">
                  No projects found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {filters.search || filters.status !== 'all'
                    ? "Try adjusting your filters to find what you're looking for."
                    : 'Get started by creating your first project.'}
                </p>
                <Button asChild>
                  <Link href="/dashboard/projects/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {filteredProjects.length > 0 && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
