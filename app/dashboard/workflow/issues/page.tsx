'use client';

import { useState, useMemo } from 'react';
import { mockIssues, mockProjects, mockTasks } from '@/lib/mock-data';
import { AppLayout, Pagination } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  AlertCircle,
  Plus,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  ListTodo,
} from 'lucide-react';
import Link from 'next/link';
import { IssueStatus, IssueType } from '@/types/issue';
import { format } from 'date-fns';

export default function IssuesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter issues
  const filteredIssues = useMemo(() => {
    return mockIssues.filter((issue) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        issue.title.toLowerCase().includes(searchLower) ||
        issue.description?.toLowerCase().includes(searchLower) ||
        issue.creator?.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
      const matchesType = typeFilter === 'all' || issue.type === typeFilter;
      
      // For project filter, we would need a way to link issues to projects
      // For now, we'll just show all issues when project filter is 'all'
      const matchesProject = projectFilter === 'all';

      return matchesSearch && matchesStatus && matchesType && matchesProject;
    });
  }, [searchQuery, statusFilter, typeFilter, projectFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIssues = filteredIssues.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, projectFilter, itemsPerPage]);

  // Statistics
  const totalIssues = mockIssues.length;
  const openIssues = mockIssues.filter((i) => i.status === IssueStatus.open).length;
  const inProgressIssues = mockIssues.filter((i) => i.status === IssueStatus.inProgress).length;
  const resolvedIssues = mockIssues.filter((i) => i.status === IssueStatus.resolved).length;

  const hasActiveFilters =
    searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || projectFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setProjectFilter('all');
    setCurrentPage(1);
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.open:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case IssueStatus.inProgress:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case IssueStatus.resolved:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case IssueStatus.closed:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const getStatusLabel = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.open:
        return 'Open';
      case IssueStatus.inProgress:
        return 'In Progress';
      case IssueStatus.resolved:
        return 'Resolved';
      case IssueStatus.closed:
        return 'Closed';
      default:
        return status;
    }
  };

  const getTypeColor = (type: IssueType) => {
    switch (type) {
      case IssueType.technical:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case IssueType.design:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case IssueType.quality:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case IssueType.safety:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case IssueType.material:
        return 'bg-brown-100 text-brown-800 dark:bg-brown-900/20 dark:text-brown-400';
      case IssueType.equipment:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const getTypeLabel = (type: IssueType) => {
    switch (type) {
      case IssueType.technical:
        return 'Technical';
      case IssueType.design:
        return 'Design';
      case IssueType.quality:
        return 'Quality';
      case IssueType.safety:
        return 'Safety';
      case IssueType.material:
        return 'Material';
      case IssueType.equipment:
        return 'Equipment';
      case IssueType.labour:
        return 'Labour';
      case IssueType.weather:
        return 'Weather';
      case IssueType.permit:
        return 'Permit';
      case IssueType.coordination:
        return 'Coordination';
      case IssueType.other:
        return 'Other';
      default:
        return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  return (
    <AppLayout>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Issues</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Track and manage project issues</p>
          </div>
          <Link href="/dashboard/workflow/issues/new">
            <Button className="mt-4 md:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              New Issue
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalIssues}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Open</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {openIssues}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>In Progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {inProgressIssues}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Resolved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {resolvedIssues}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                <CardTitle>Search & Filters</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={IssueStatus.open}>Open</SelectItem>
                  <SelectItem value={IssueStatus.inProgress}>In Progress</SelectItem>
                  <SelectItem value={IssueStatus.resolved}>Resolved</SelectItem>
                  <SelectItem value={IssueStatus.closed}>Closed</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={IssueType.technical}>Technical</SelectItem>
                  <SelectItem value={IssueType.design}>Design</SelectItem>
                  <SelectItem value={IssueType.quality}>Quality</SelectItem>
                  <SelectItem value={IssueType.safety}>Safety</SelectItem>
                  <SelectItem value={IssueType.material}>Material</SelectItem>
                  <SelectItem value={IssueType.equipment}>Equipment</SelectItem>
                  <SelectItem value={IssueType.labour}>Labour</SelectItem>
                  <SelectItem value={IssueType.weather}>Weather</SelectItem>
                  <SelectItem value={IssueType.permit}>Permit</SelectItem>
                  <SelectItem value={IssueType.coordination}>Coordination</SelectItem>
                  <SelectItem value={IssueType.other}>Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Project Filter */}
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {mockProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id!.toString()}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredIssues.length)} of{' '}
            {filteredIssues.length} issues
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Rows per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Issues Table */}
        {filteredIssues.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Related Task</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedIssues.map((issue) => {
                    // Find the task that contains this issue
                    const relatedTask = mockTasks.find((task) => 
                      task.issues?.some((i) => i.id === issue.id)
                    );
                    const project = mockProjects.find((p) => p.id === relatedTask?.projectId);

                    return (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {issue.title}
                            </p>
                            {issue.description && (
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[300px]">
                                {issue.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(issue.type)}>
                            {getTypeLabel(issue.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {relatedTask ? (
                            <Link href={`/dashboard/workflow/tasks/${relatedTask.id}`}>
                              <div className="hover:underline">
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                  {relatedTask.title}
                                </p>
                                {project && (
                                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                    {project.projectName}
                                  </p>
                                )}
                              </div>
                            </Link>
                          ) : (
                            <span className="text-sm text-zinc-400">No task</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                              <span className="text-xs text-white font-medium">
                                {issue.creator?.charAt(0) || '?'}
                              </span>
                            </div>
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {issue.creator}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <Calendar className="h-3 w-3" />
                            <span>{format(issue.createdAt, 'MMM d, yyyy')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(issue.status)}>
                            {getStatusLabel(issue.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/dashboard/workflow/issues/${issue.id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Issue Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                No issues found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first issue'}
              </p>
              {!hasActiveFilters && (
                <Link href="/dashboard/workflow/issues/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Issue
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
