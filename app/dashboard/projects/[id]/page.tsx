'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/common/app-layout';
import { Separator } from '@/components/ui/separator';
import {
  FolderKanban,
  Edit,
  MapPin,
  Calendar,
  Users,
  ListTodo,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Activity,
  Target,
  Briefcase,
  ClipboardCheck,
} from 'lucide-react';
import { ProjectStatus, getProjectStatusLabel } from '@/types/project/project-status';
import type { Project } from '@/types/project/project';

// Mock function to fetch project - replace with actual API call
const fetchProject = async (id: string): Promise<Project | null> => {
  // Simulate API call
  const mockProjects: Project[] = [
    {
      id: 1,
      projectName: 'Residential Tower Construction',
      projectAddress: 'Plot 456, Andheri East, Mumbai, Maharashtra',
      status: ProjectStatus.open,
      projectLongitude: 72.8777,
      projectLatitude: 19.076,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-12-31'),
      createdAt: new Date('2023-12-01'),
      members: [
        { memberName: 'John Smith', memberEmail: 'john@example.com', memberPhone: '+91 98765 43210', memberRole: 'manager', department: 'Construction', designation: 'Project Manager' },
        { memberName: 'Sarah Johnson', memberEmail: 'sarah@example.com', memberPhone: '+91 98765 43211', memberRole: 'engineer', department: 'Engineering', designation: 'Civil Engineer' },
        { memberName: 'Mike Davis', memberEmail: 'mike@example.com', memberPhone: '+91 98765 43212', memberRole: 'contractor', department: 'Construction', designation: 'Site Supervisor' },
      ],
      tasks: [],
    },
  ];
  
  return mockProjects.find(p => p.id === Number.parseInt(id)) || null;
};

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Load project data
  useState(() => {
    const loadProject = async () => {
      if (!params.id) return;
      
      const projectData = await fetchProject(params.id as string);
      setProject(projectData);
      setLoading(false);
    };
    
    loadProject();
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-zinc-600 dark:text-zinc-400">Loading project...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-7xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <FolderKanban className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Project not found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                The project you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => router.push('/dashboard/projects')}>
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const getStatusBadgeColor = (status: ProjectStatus): string => {
    const colors = {
      [ProjectStatus.open]: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      [ProjectStatus.upcoming]: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      [ProjectStatus.completed]: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      [ProjectStatus.closed]: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
      [ProjectStatus.onHold]: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      [ProjectStatus.cancelled]: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      [ProjectStatus.dropped]: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    };
    return colors[status];
  };

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

  // Mock statistics - replace with actual data
  const stats = {
    totalTasks: 45,
    completedTasks: 28,
    pendingTasks: 12,
    overdueTasks: 5,
    totalBudget: 15_000_000,
    spentBudget: 8_500_000,
    inspections: 12,
    issues: 3,
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {project.projectName}
              </h1>
              <Badge className={getStatusBadgeColor(project.status)}>
                {getProjectStatusLabel(project.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <MapPin className="h-4 w-4" />
              <p>{project.projectAddress}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/projects/${project.id}/edit`}>
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
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-600 dark:text-zinc-400">Overall Progress</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{progress}%</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all ${
                      progress === 100 ? 'bg-purple-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <div className="text-xs text-muted-foreground">Start Date</div>
                  <div className="text-sm font-medium">
                    {project.startDate ? format(project.startDate, 'MMM dd, yyyy') : 'Not set'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">End Date</div>
                  <div className="text-sm font-medium">
                    {project.endDate ? format(project.endDate, 'MMM dd, yyyy') : 'Not set'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Days Remaining</div>
                  <div className={`text-sm font-medium ${daysRemaining < 30 ? 'text-red-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Completion</div>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedTasks} completed, {stats.pendingTasks} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
              <p className="text-xs text-muted-foreground">Need immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.spentBudget / 10_000_000).toFixed(1)}Cr</div>
              <p className="text-xs text-muted-foreground">
                of ₹{(stats.totalBudget / 10_000_000).toFixed(1)}Cr total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.members.length}</div>
              <p className="text-xs text-muted-foreground">Active on project</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <CardDescription>{project.members.length} members working on this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.members.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {member.memberName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{member.memberName}</p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">{member.designation}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{member.department}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity / Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Recent Tasks
                </CardTitle>
                <CardDescription>Latest task updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
                  <ListTodo className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tasks yet. Create tasks to track project progress.</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/dashboard/workflow/tasks/new">
                      <ListTodo className="mr-2 h-4 w-4" />
                      Create Task
                    </Link>
                  </Button>
                </div>
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
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/workflow/tasks/new">
                    <ListTodo className="mr-2 h-4 w-4" />
                    Create Task
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/workflow/inspections/new">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Schedule Inspection
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/workflow/issues/new">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Report Issue
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/resources/material-requests/new">
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
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Inspections Done</span>
                  <span className="font-medium">{stats.inspections}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Open Issues</span>
                  <span className="font-medium text-red-600">{stats.issues}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Budget Utilization</span>
                  <span className="font-medium">
                    {Math.round((stats.spentBudget / stats.totalBudget) * 100)}%
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Task Completion</span>
                  <span className="font-medium">
                    {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
                  </span>
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
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Created On</div>
                  <div className="font-medium">
                    {project.createdAt ? format(project.createdAt, 'MMM dd, yyyy') : 'Unknown'}
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Location</div>
                  <div className="font-medium flex items-start gap-1">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="wrap-break-word">{project.projectAddress}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Coordinates</div>
                  <div className="font-medium text-sm">
                    {project.projectLatitude.toFixed(4)}, {project.projectLongitude.toFixed(4)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
