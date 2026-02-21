/**
 * Projects Page - Role-Based Access Control (RBAC) Example
 *
 * This page demonstrates the correct RBAC implementation pattern:
 * - ONE page for ALL users (no separate admin/user copies)
 * - Conditional rendering based on permissions/roles
 * - Uses RBAC hooks to check permissions
 *
 * RBAC Hooks Used:
 * - useIsSystemAdmin(): Check if user is system admin
 * - useCanPerform(module, action): Check if user can perform specific action
 * - useModuleAccess(module): Check if user has access to module
 *
 * Example Conditional Rendering:
 * {canCreate && <CreateButton />}      // Only users with create permission
 * {canDelete && <DeleteButton />}      // Only users with delete permission
 * {isSystemAdmin && <AdminControls />}  // Only system admins
 */
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, SearchAndFilter } from '@/components/common';
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
} from 'lucide-react';
import {
  ProjectStatus,
  getProjectStatusLabel,
} from '@/types/project/project-status';
import type { Project } from '@/types/project/project';
import { useProjects } from '@/hooks/project/use-projects';

interface ProjectFilters {
  search: string;
  status: ProjectStatus | 'all';
}

export default function ProjectsPage() {
  // Fetch projects
  const { data: projects = [], isLoading, error } = useProjects();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12); // 4 columns x 3 rows

  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: 'all',
  });

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
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
  }, [projects, filters]);

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

  const hasActiveFilters = Boolean(filters.search || filters.status !== 'all');

  const clearFilters = () => {
    setFilters({ search: '', status: 'all' });
    setCurrentPage(1);
  };

  // Statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.status === ProjectStatus.open
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === ProjectStatus.completed
  ).length;
  const upcomingProjects = projects.filter(
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading projects...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Failed to load projects
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
            <Button onClick={() => globalThis.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Projects</h1>
          </div>
          <p className="text-muted-foreground">
            Manage and monitor all construction projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/users/dashboard/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Link>
          </Button>
        </div>
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
      <SearchAndFilter
        variant="card"
        searchValue={filters.search}
        onSearchChange={(value) => handleFilterChange('search', value)}
        searchPlaceholder="Search projects..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
              {
                value: ProjectStatus.open,
                label: getProjectStatusLabel(ProjectStatus.open),
              },
              {
                value: ProjectStatus.upcoming,
                label: getProjectStatusLabel(ProjectStatus.upcoming),
              },
              {
                value: ProjectStatus.completed,
                label: getProjectStatusLabel(ProjectStatus.completed),
              },
              {
                value: ProjectStatus.closed,
                label: getProjectStatusLabel(ProjectStatus.closed),
              },
              {
                value: ProjectStatus.onHold,
                label: getProjectStatusLabel(ProjectStatus.onHold),
              },
              {
                value: ProjectStatus.cancelled,
                label: getProjectStatusLabel(ProjectStatus.cancelled),
              },
              {
                value: ProjectStatus.dropped,
                label: getProjectStatusLabel(ProjectStatus.dropped),
              },
            ],
            value: filters.status,
            onChange: (value) =>
              handleFilterChange('status', value as ProjectStatus | 'all'),
          },
        ]}
      />

      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          Showing {paginatedProjects.length} of {filteredProjects.length}{' '}
          projects
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground text-sm">Rows per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">8</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="16">16</SelectItem>
              <SelectItem value="24">24</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {paginatedProjects.map((project: Project) => {
              const progress = Math.round(project.progress);
              return (
                <Link
                  key={project.id}
                  href={`/users/dashboard/projects/${project.id}`}
                >
                  <Card className="hover:border-primary/50 h-full cursor-pointer transition-all hover:shadow-md">
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
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {paginatedProjects.length === 0 && (
            <div className="py-12 text-center">
              <FolderKanban className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.status !== 'all'
                  ? "Try adjusting your filters to find what you're looking for."
                  : 'Get started by creating your first project.'}
              </p>
              <Button asChild>
                <Link href="/users/dashboard/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Link>
              </Button>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
