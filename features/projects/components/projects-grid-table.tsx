'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import { Pagination } from '@/components/common';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
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
  Search,
} from 'lucide-react';
import {
  ProjectStatus,
  getProjectStatusLabel,
} from '@tornotron/echno-core/project/types';
import type { Project } from '@tornotron/echno-core/project/types';
import { routes } from '@/nav';
import { usePrefetchProject } from '@tornotron/echno-core/project/hooks';

interface ProjectFilters {
  search: string;
  status: ProjectStatus | 'all';
}

const getStatusIcon = (status: ProjectStatus) => {
  switch (status) {
    case ProjectStatus.open: {
      return <TrendingUp className="h-3.5 w-3.5" />;
    }
    case ProjectStatus.completed: {
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    }
    case ProjectStatus.upcoming: {
      return <Clock className="h-3.5 w-3.5" />;
    }
    case ProjectStatus.onHold: {
      return <Pause className="h-3.5 w-3.5" />;
    }
    case ProjectStatus.cancelled:
    case ProjectStatus.dropped: {
      return <XCircle className="h-3.5 w-3.5" />;
    }
    default: {
      return <FolderKanban className="h-3.5 w-3.5" />;
    }
  }
};

const getStatusBadgeColor = (status: ProjectStatus): string => {
  const colors: Record<ProjectStatus, string> = {
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

interface ProjectsGridTableProps {
  projects: Project[];
}

export function ProjectsGridTable({ projects }: ProjectsGridTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: 'all',
  });
  const prefetchProject = usePrefetchProject();

  const handleFilterChange = (
    key: keyof ProjectFilters,
    value: string | ProjectStatus
  ) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

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

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProjects = filteredProjects.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProjects.length);

  return (
    <Card>
      {/* Inline filters */}
      <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-1">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search projects…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(v) =>
            handleFilterChange('status', v as ProjectStatus | 'all')
          }
        >
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.values(ProjectStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {getProjectStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2 border-l pl-3">
          <span className="text-xs whitespace-nowrap text-zinc-500">
            Rows per page
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[8, 12, 16, 24].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {paginatedProjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {paginatedProjects.map((project: Project) => {
              const progress = Math.round(project.progress);
              return (
                <Link
                  key={project.id}
                  href={
                    routes.portfolio.projects.allProjects.detail(project.id)
                      .href
                  }
                  onMouseEnter={() => prefetchProject(project.id)}
                  onFocus={() => prefetchProject(project.id)}
                >
                  <Card className="h-full cursor-pointer text-sm transition-all hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-500/40">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex flex-1 items-start gap-3">
                          <div
                            className={`rounded-lg p-2 ${getStatusBadgeColor(project.status)}`}
                          >
                            <FolderKanban className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="line-clamp-2 text-sm">
                              {project.projectName}
                            </CardTitle>
                            <Badge variant="outline" className="mt-1 text-xs">
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
                          <Users className="h-3.5 w-3.5" />
                          <span>{project.members.length} members</span>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <ListTodo className="h-3.5 w-3.5" />
                          <span>{project.tasks.length} tasks</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Empty variant="inline">
            <EmptyMedia variant="icon">
              <FolderKanban className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No projects found</EmptyTitle>
              <EmptyDescription>
                {filters.search || filters.status !== 'all'
                  ? "Try adjusting your filters to find what you're looking for."
                  : 'Get started by creating your first project.'}
              </EmptyDescription>
            </EmptyHeader>
            {!filters.search && filters.status === 'all' && (
              <Button asChild>
                <Link href={routes.portfolio.projects.allProjects.new}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Link>
              </Button>
            )}
          </Empty>
        )}
      </CardContent>

      {/* Footer: count + pagination */}
      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-sm text-zinc-500">
          {filteredProjects.length === 0 ? 0 : startIndex + 1}–{endIndex} of{' '}
          {filteredProjects.length} projects
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </Card>
  );
}
