'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Progress } from '@/components/shadcn/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  HardHat,
  Users,
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Wrench,
  Shield,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';

// Mock data for site operations - filtered by user's organization/projects
const siteStats = {
  totalWorkers: 45,
  presentToday: 38,
  activeProjects: 3,
  pendingInspections: 5,
  safetyIncidents: 0,
  tasksCompleted: 12,
  tasksInProgress: 8,
};

const todayAttendance = [
  {
    id: 1,
    name: 'John Doe',
    role: 'Mason',
    status: 'present',
    checkIn: '07:30 AM',
  },
  {
    id: 2,
    name: 'Jane Smith',
    role: 'Electrician',
    status: 'present',
    checkIn: '07:45 AM',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    role: 'Carpenter',
    status: 'late',
    checkIn: '08:30 AM',
  },
  {
    id: 4,
    name: 'Sarah Williams',
    role: 'Plumber',
    status: 'absent',
    checkIn: '-',
  },
  {
    id: 5,
    name: 'Tom Brown',
    role: 'Laborer',
    status: 'present',
    checkIn: '07:15 AM',
  },
];

const activeProjects = [
  {
    id: '1',
    name: 'Building A Foundation',
    progress: 65,
    status: 'on-track',
    location: 'Site A - Block 1',
    workers: 15,
  },
  {
    id: '2',
    name: 'Electrical Installation',
    progress: 40,
    status: 'delayed',
    location: 'Site A - Block 2',
    workers: 8,
  },
  {
    id: '3',
    name: 'Plumbing Work',
    progress: 80,
    status: 'on-track',
    location: 'Site B',
    workers: 12,
  },
];

const pendingTasks = [
  {
    id: 1,
    task: 'Concrete pouring - Section C',
    priority: 'high',
    assignedTo: 'Team Alpha',
    dueTime: '2:00 PM',
  },
  {
    id: 2,
    task: 'Safety inspection - Block 2',
    priority: 'high',
    assignedTo: 'Safety Team',
    dueTime: '11:00 AM',
  },
  {
    id: 3,
    task: 'Material delivery check',
    priority: 'medium',
    assignedTo: 'Logistics',
    dueTime: '10:00 AM',
  },
  {
    id: 4,
    task: 'Equipment maintenance',
    priority: 'low',
    assignedTo: 'Maintenance',
    dueTime: '4:00 PM',
  },
];

const safetyAlerts = [
  {
    id: 1,
    type: 'reminder',
    message: 'Daily safety briefing at 7:00 AM',
    time: '6:45 AM',
  },
  {
    id: 2,
    type: 'warning',
    message: 'High temperature alert - ensure hydration breaks',
    time: '10:00 AM',
  },
  {
    id: 3,
    type: 'info',
    message: 'New PPE guidelines effective today',
    time: 'Yesterday',
  },
];

export default function SiteOperationsDashboard() {
  const { data: session } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const userName = session?.user?.name?.split(' ')[0] || 'Supervisor';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <HardHat className="h-8 w-8 text-orange-600" />
            Site Operations
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {userName}! Here&apos;s your site overview for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <p className="text-muted-foreground text-xs">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Workers Present
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {siteStats.presentToday}/{siteStats.totalWorkers}
            </div>
            <p className="text-muted-foreground text-xs">
              {Math.round(
                (siteStats.presentToday / siteStats.totalWorkers) * 100
              )}
              % attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <HardHat className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{siteStats.activeProjects}</div>
            <p className="text-muted-foreground text-xs">
              In your assigned sites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasks Progress
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {siteStats.tasksCompleted}/
              {siteStats.tasksCompleted + siteStats.tasksInProgress}
            </div>
            <p className="text-muted-foreground text-xs">
              {siteStats.tasksInProgress} tasks in progress
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            siteStats.safetyIncidents > 0
              ? 'border-red-200 bg-red-50'
              : 'border-green-200 bg-green-50'
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Status</CardTitle>
            <Shield
              className={`h-4 w-4 ${siteStats.safetyIncidents > 0 ? 'text-red-600' : 'text-green-600'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${siteStats.safetyIncidents > 0 ? 'text-red-600' : 'text-green-600'}`}
            >
              {siteStats.safetyIncidents === 0
                ? 'All Clear'
                : `${siteStats.safetyIncidents} Incidents`}
            </div>
            <p className="text-muted-foreground text-xs">
              {siteStats.safetyIncidents === 0
                ? 'No incidents today'
                : 'Requires attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Attendance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today&apos;s Attendance</CardTitle>
              <CardDescription>Worker check-ins for your sites</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={routes.attendance.href}>
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayAttendance.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell>{worker.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          worker.status === 'present'
                            ? 'default'
                            : worker.status === 'late'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className={
                          worker.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : worker.status === 'late'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }
                      >
                        {worker.status === 'present' && (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        )}
                        {worker.status === 'late' && (
                          <Clock className="mr-1 h-3 w-3" />
                        )}
                        {worker.status === 'absent' && (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {worker.status.charAt(0).toUpperCase() +
                          worker.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {worker.checkIn}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Projects assigned to your sites</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={routes.projects.href}>
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeProjects.map((project) => (
              <div key={project.id} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{project.name}</h4>
                  <Badge
                    variant={
                      project.status === 'on-track' ? 'default' : 'destructive'
                    }
                  >
                    {project.status === 'on-track' ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <AlertTriangle className="mr-1 h-3 w-3" />
                    )}
                    {project.status === 'on-track' ? 'On Track' : 'Delayed'}
                  </Badge>
                </div>
                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {project.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {project.workers} workers
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today&apos;s Tasks</CardTitle>
              <CardDescription>Pending work items for today</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={routes.projects.href}>
                Manage Tasks <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{task.task}</p>
                    <p className="text-muted-foreground text-sm">
                      {task.assignedTo}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        task.priority === 'high'
                          ? 'border-red-300 text-red-600'
                          : task.priority === 'medium'
                            ? 'border-yellow-300 text-yellow-600'
                            : 'border-gray-300 text-gray-600'
                      }
                    >
                      {task.priority}
                    </Badge>
                    <span className="text-muted-foreground flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {task.dueTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              Safety Alerts
            </CardTitle>
            <CardDescription>Important safety notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safetyAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    alert.type === 'warning'
                      ? 'border-yellow-200 bg-yellow-50'
                      : alert.type === 'reminder'
                        ? 'border-blue-200 bg-blue-50'
                        : ''
                  }`}
                >
                  {alert.type === 'warning' && (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  {alert.type === 'reminder' && (
                    <Calendar className="h-5 w-5 text-blue-600" />
                  )}
                  {alert.type === 'info' && (
                    <ClipboardCheck className="h-5 w-5 text-gray-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-muted-foreground text-xs">
                      {alert.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for site operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href={routes.attendance.mark}>
                <Users className="h-5 w-5" />
                <span>Mark Attendance</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href={routes.inspections}>
                <ClipboardCheck className="h-5 w-5" />
                <span>Inspections</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href="/users/dashboard/resources/material-requests/new">
                <Wrench className="h-5 w-5" />
                <span>Request Materials</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href={routes.workforce.leaves.href}>
                <Calendar className="h-5 w-5" />
                <span>Leave Requests</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
