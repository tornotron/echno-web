'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';

import { toast } from '@/lib/styles/toast-styles';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/shadcn/chart';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { dashboardData } from '@/components/shared/mock-data';
import { useEmployees } from '@/hooks/employee';
import { useProjects } from '@/hooks/project';
import { useTasks } from '@/hooks/task';
import { useIssues } from '@/hooks/issue';
import { useUser } from '@/hooks/user/use-user';
import { ProjectStatus } from '@/types/project/project-status';
import { TaskStatus } from '@/types/task/task-status';
import { IssueStatus } from '@/types/issue/issue-status';
import Link from 'next/link';
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  ClipboardList,
  UserCheck,
  DollarSign,
  Package,
  Truck,
  TrendingDown,
  Activity,
  FileText,
  Wrench,
  ArrowRight,
  FolderKanban,
  ListTodo,
  MessageSquare,
  TriangleAlert,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loginToastShown = useRef(false);
  const [activeTab, setActiveTab] = useState<
    'attendance' | 'tasks' | 'thirdparty' | 'resources' | 'finance' | 'projects'
  >('finance');

  // Real data hooks
  const { data: user } = useUser();
  const { data: employees = [] } = useEmployees();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: issues = [] } = useIssues();

  // Derived live counts
  const activeProjects = projects.filter(
    (p) => p.status === ProjectStatus.open
  ).length;
  const activeTasks = tasks.filter(
    (t) => t.status === TaskStatus.onGoing || t.status === TaskStatus.upcoming
  ).length;
  const openIssues = issues.filter(
    (i) =>
      i.status === IssueStatus.open ||
      i.status === IssueStatus.inProgress ||
      i.status === IssueStatus.reOpened
  ).length;
  const displayName =
    user?.name?.split(' ')[0] ?? session?.user?.name?.split(' ')[0] ?? 'there';

  // Import data from mock-data
  const {
    stats,
    attendance,
    attendanceTrend,
    leaveRequests,
    recentLeaveRequests,
    tasksByPriority,
    issuesResolutionTrend,
    recentTasksIssues,
    vendorStatus,
    contractorPerformance,
    inventoryStatus,
    equipmentUtilization,
    cashFlow,
    expenseBreakdown,
    profitMargin,
    departmentBudget,
    financialHealth,
    projectsByStatus,
    projectTimeline,
    projectBudgetUtilization,
    recentProjects,
    projectPerformance,
  } = dashboardData;

  // Legacy variable names for compatibility
  const attendanceData = attendanceTrend;
  const leaveRequestsData = leaveRequests;
  const tasksByPriorityData = tasksByPriority;
  const issuesTrendData = issuesResolutionTrend;
  const vendorStatusData = vendorStatus;
  const contractorPerformanceData = contractorPerformance;
  const inventoryStatusData = inventoryStatus;
  const equipmentUsageData = equipmentUtilization;
  const cashFlowData = cashFlow;
  const expenseBreakdownData = expenseBreakdown;
  const profitMarginData = profitMargin;
  const departmentBudgetData = departmentBudget;

  const financialHealthData = financialHealth;

  const chartConfig = {
    present: {
      label: 'Present',
      color: '#10b981',
      description: 'Employees present',
    },
    absent: {
      label: 'Absent',
      color: '#ef4444',
      description: 'Employees absent',
    },
    leave: {
      label: 'On Leave',
      color: '#f59e0b',
      description: 'Employees on leave',
    },
    approved: { label: 'Approved', color: '#10b981' },
    pending: { label: 'Pending', color: '#f59e0b' },
    rejected: { label: 'Rejected', color: '#ef4444' },
    open: { label: 'Open', color: '#ef4444', description: 'Open issues' },
    inProgress: {
      label: 'In Progress',
      color: '#f59e0b',
      description: 'Issues being worked on',
    },
    resolved: {
      label: 'Resolved',
      color: '#10b981',
      description: 'Resolved issues',
    },
    onTime: {
      label: 'On Time',
      color: '#10b981',
      description: 'Delivered on time',
    },
    delayed: {
      label: 'Delayed',
      color: '#ef4444',
      description: 'Delayed deliveries',
    },
    utilized: {
      label: 'Utilized',
      color: '#10b981',
      description: 'Equipment in use',
    },
    idle: {
      label: 'Idle',
      color: '#ef4444',
      description: 'Equipment not in use',
    },
    revenue: {
      label: 'Revenue',
      color: '#10b981',
      description: 'Total revenue',
    },
    expenses: {
      label: 'Expenses',
      color: '#ef4444',
      description: 'Total expenses',
    },
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Show login success toast if redirected from login
  useEffect(() => {
    if (
      globalThis.window !== undefined &&
      status === 'authenticated' &&
      !loginToastShown.current
    ) {
      const params = new URLSearchParams(globalThis.location.search);
      const loginParam = params.get('login');

      if (loginParam === 'success') {
        loginToastShown.current = true;

        // Show toast after a small delay to ensure component is mounted
        const timer = setTimeout(() => {
          toast.success('Login successful!', {
            description: 'Welcome back to your dashboard.',
          });

          // Clean up URL by removing the login parameter
          const url = new URL(globalThis.location.href);
          url.searchParams.delete('login');
          globalThis.history.replaceState({}, '', url.toString());
        }, 100);

        return () => clearTimeout(timer);
      }
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Good{' '}
          {new Date().getHours() < 12
            ? 'morning'
            : new Date().getHours() < 17
              ? 'afternoon'
              : 'evening'}
          , {displayName}
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Here&apos;s what&apos;s happening on site today.
        </p>
      </div>

      {/* Mobile Quick Actions — visible only on small screens */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 lg:hidden">
        {[
          {
            label: 'Attendance',
            icon: UserCheck,
            href: '/users/dashboard/attendance',
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20',
          },
          {
            label: 'Projects',
            icon: FolderKanban,
            href: '/users/dashboard/portfolio/projects',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-500/10',
          },
          {
            label: 'Tasks',
            icon: ListTodo,
            href: '/users/dashboard/tasks',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-500/10',
          },
          {
            label: 'Chat',
            icon: MessageSquare,
            href: '/users/dashboard/chat',
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
          },
        ].map(({ label, icon: Icon, href, color, bg }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-center transition-colors hover:border-indigo-300 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}
            >
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium sm:text-base">
                Employees
              </CardTitle>
              <Users className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
              {employees.length}
            </div>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
              <span className="text-green-600">
                {employees.filter((e) => e.status === 'active').length}
              </span>{' '}
              active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium sm:text-base">
                Projects
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
              {projects.length}
            </div>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
              <span className="text-green-600">{activeProjects}</span> active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium sm:text-base">
                Tasks
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
              {activeTasks}
            </div>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
              active tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium sm:text-base">
                Open Issues
              </CardTitle>
              <TriangleAlert className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
              {openIssues}
            </div>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
              require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium sm:text-base">
                Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
              {stats.revenue.formatted}
            </div>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
              <span className="text-green-600">
                +{stats.revenue.growthPercentage}%
              </span>{' '}
              from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Modules */}
      <Tabs
        value={activeTab}
        onValueChange={(value: string) =>
          setActiveTab(value as typeof activeTab)
        }
        className="space-y-4"
      >
        <TabsList className="grid h-auto w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger
            value="finance"
            className="flex items-center gap-2 py-2 sm:py-3"
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Finance</span>
            <span className="sm:hidden">Money</span>
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="flex items-center gap-2 py-2 sm:py-3"
          >
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Projects</span>
            <span className="sm:hidden">Projects</span>
          </TabsTrigger>
          <TabsTrigger
            value="resources"
            className="flex items-center gap-2 py-2 sm:py-3"
          >
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Resources</span>
            <span className="sm:hidden">Stock</span>
          </TabsTrigger>
          <TabsTrigger
            value="thirdparty"
            className="flex items-center gap-2 py-2 sm:py-3"
          >
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Third Party</span>
            <span className="sm:hidden">Vendor</span>
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="flex items-center gap-2 py-2 sm:py-3"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks & Issues</span>
            <span className="sm:hidden">Tasks</span>
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="flex items-center gap-2 py-2 sm:py-3"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance & Leave</span>
            <span className="sm:hidden">Attend</span>
          </TabsTrigger>
        </TabsList>

        {/* Attendance & Leave Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Monthly Attendance Overview
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Employee attendance trends over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <BarChart
                    data={attendanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-zinc-200 dark:stroke-zinc-700"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                      label={{
                        value: 'Employees',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: '12px' },
                      }}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="present"
                      fill="#10b981"
                      stackId="a"
                      name="Present"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="absent"
                      fill="#ef4444"
                      stackId="a"
                      name="Absent"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="leave"
                      fill="#f59e0b"
                      stackId="a"
                      name="On Leave"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg">
                      Recent Leave Requests
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Latest leave applications requiring action
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push('/users/dashboard/workforce/leaves')
                    }
                    className="text-xs sm:text-sm"
                  >
                    View All
                    <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] space-y-3 overflow-y-auto">
                  {recentLeaveRequests.map((request, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-zinc-200 p-3 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {request.employeeName}
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {request.type}
                          </p>
                        </div>
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            request.status === 'approved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}
                        >
                          {request.status === 'approved'
                            ? 'Approved'
                            : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(
                            request.startDate
                          ).toLocaleDateString()} -{' '}
                          {new Date(request.endDate).toLocaleDateString()}
                        </span>
                        <span>{request.days} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Leave Days by Type
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Total leave days consumed this year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <PieChart>
                    <Pie
                      data={leaveRequestsData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(props) => {
                        const { type, days } = props as typeof props & {
                          type: string;
                          days: number;
                        };
                        return `${type}: ${days}d`;
                      }}
                      outerRadius={80}
                      innerRadius={40}
                      dataKey="days"
                      paddingAngle={2}
                    >
                      {leaveRequestsData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const total = leaveRequestsData.reduce(
                            (sum, item) => sum + item.days,
                            0
                          );
                          const percent = (
                            ((payload[0].value as number) / total) *
                            100
                          ).toFixed(1);
                          return (
                            <div className="bg-background rounded-lg border p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium">
                                    {payload[0].payload.type}
                                  </span>
                                  <span className="text-sm font-bold">
                                    {payload[0].value} days
                                  </span>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {percent}% of total leave days
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Quick Stats
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Today&apos;s attendance highlights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/10">
                    <UserCheck className="mb-2 h-6 w-6 text-green-600" />
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {attendance.present}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-400">
                      Present Today
                    </div>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-4 dark:border-red-800 dark:from-red-900/20 dark:to-red-800/10">
                    <XCircle className="mb-2 h-6 w-6 text-red-600" />
                    <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {attendance.absent}
                    </div>
                    <div className="text-xs text-red-700 dark:text-red-400">
                      Absent
                    </div>
                  </div>
                  <div className="rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 dark:border-yellow-800 dark:from-yellow-900/20 dark:to-yellow-800/10">
                    <Calendar className="mb-2 h-6 w-6 text-yellow-600" />
                    <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {attendance.leave}
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-400">
                      On Leave
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/10">
                    <Clock className="mb-2 h-6 w-6 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {attendance.late}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-400">
                      Late Arrivals
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks & Issues Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Tasks by Priority
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Distribution of active tasks by priority level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <PieChart>
                    <Pie
                      data={tasksByPriorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(props) => {
                        const { priority, count, percent } =
                          props as typeof props & {
                            priority: string;
                            count: number;
                          };
                        return `${priority}: ${count} (${((percent ?? 0) * 100).toFixed(0)}%)`;
                      }}
                      outerRadius={80}
                      innerRadius={40}
                      dataKey="count"
                      paddingAngle={2}
                    >
                      {tasksByPriorityData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          return (
                            <div className="bg-background rounded-lg border p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium">
                                    {payload[0].payload.priority}
                                  </span>
                                  <span className="text-sm font-bold">
                                    {payload[0].value} tasks
                                  </span>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {(
                                    ((payload[0].value as number) /
                                      tasksByPriorityData.reduce(
                                        (sum, item) => sum + item.count,
                                        0
                                      )) *
                                    100
                                  ).toFixed(1)}
                                  % of total tasks
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg">
                      Items Needing Attention
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Critical and high priority tasks/issues
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard/portfolio/projects')}
                    className="text-xs sm:text-sm"
                  >
                    View All
                    <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] space-y-3 overflow-y-auto">
                  {recentTasksIssues.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-zinc-200 p-3 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            {item.type} • {item.assignee}
                          </p>
                        </div>
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium whitespace-nowrap ${
                            item.priority === 'critical'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              : item.priority === 'high'
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                        <Clock className="mr-1 h-3 w-3" />
                        Due: {item.dueDate}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Issues Resolution Trend
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monthly issues tracking and resolution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <LineChart
                    data={issuesTrendData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-zinc-200 dark:stroke-zinc-700"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                      label={{
                        value: 'Issues',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: '12px' },
                      }}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          return (
                            <div className="bg-background rounded-lg border p-3 shadow-sm">
                              <div className="mb-2 font-medium">
                                {payload[0].payload.month}
                              </div>
                              <div className="grid gap-1">
                                {payload.map((entry, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{
                                          backgroundColor: entry.color,
                                        }}
                                      />
                                      <span className="text-sm">
                                        {entry.name}
                                      </span>
                                    </div>
                                    <span className="text-sm font-bold">
                                      {entry.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconType="circle"
                    />
                    <Line
                      type="monotone"
                      dataKey="open"
                      stroke="#ef4444"
                      strokeWidth={3}
                      name="Open"
                      dot={{ fill: '#ef4444', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="inProgress"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      name="In Progress"
                      dot={{ fill: '#f59e0b', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="resolved"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Resolved"
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Task & Issue Metrics
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.taskMetrics.completed}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      This month
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                    <div className="mb-2 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">In Progress</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.taskMetrics.inProgress}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      Active now
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium">Critical</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.taskMetrics.critical}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      Need attention
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                    <div className="mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium">
                        Resolution Rate
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.taskMetrics.resolutionRate}%
                    </div>
                    <div className="mt-1 text-xs text-green-600">
                      +{stats.taskMetrics.resolutionRateChange}% vs last month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Third Party Tab */}
        <TabsContent value="thirdparty" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Vendor Status
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Current status of all vendors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <PieChart>
                    <Pie
                      data={vendorStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(props) => {
                        const { status, count } = props as typeof props & {
                          status: string;
                          count: number;
                        };
                        return `${status}: ${count}`;
                      }}
                      outerRadius={80}
                      innerRadius={40}
                      dataKey="count"
                      paddingAngle={2}
                    >
                      {vendorStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const total = vendorStatusData.reduce(
                            (sum, item) => sum + item.count,
                            0
                          );
                          const percent = (
                            ((payload[0].value as number) / total) *
                            100
                          ).toFixed(1);
                          return (
                            <div className="bg-background rounded-lg border p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium">
                                    {payload[0].payload.status}
                                  </span>
                                  <span className="text-sm font-bold">
                                    {payload[0].value} vendors
                                  </span>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {percent}% of total vendors
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Contractor Performance
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  On-time delivery vs delayed projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <BarChart
                    data={contractorPerformanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-zinc-200 dark:stroke-zinc-700"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                      label={{
                        value: 'Percentage (%)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: '12px' },
                      }}
                      domain={[0, 100]}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          return (
                            <div className="bg-background rounded-lg border p-3 shadow-sm">
                              <div className="mb-2 font-medium">
                                {payload[0].payload.month}
                              </div>
                              <div className="grid gap-1">
                                {payload.map((entry, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{
                                          backgroundColor: entry.color,
                                        }}
                                      />
                                      <span className="text-sm">
                                        {entry.name}
                                      </span>
                                    </div>
                                    <span className="text-sm font-bold">
                                      {entry.value}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="onTime"
                      fill="#10b981"
                      name="On Time %"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="delayed"
                      fill="#ef4444"
                      name="Delayed %"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Third Party Overview
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Vendor and contractor metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/10">
                    <Truck className="mb-2 h-6 w-6 text-green-600" />
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      45
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-400">
                      Active Vendors
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/10">
                    <Users className="mb-2 h-6 w-6 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      28
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-400">
                      Contractors
                    </div>
                  </div>
                  <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4 dark:border-purple-800 dark:from-purple-900/20 dark:to-purple-800/10">
                    <FileText className="mb-2 h-6 w-6 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      15
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-400">
                      Active Contracts
                    </div>
                  </div>
                  <div className="rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-4 dark:border-orange-800 dark:from-orange-900/20 dark:to-orange-800/10">
                    <TrendingUp className="mb-2 h-6 w-6 text-orange-600" />
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      95%
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-400">
                      Delivery Rate
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Inventory Status
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Current stock levels across all items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <PieChart>
                    <Pie
                      data={inventoryStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(props) => {
                        const { status, items } = props as typeof props & {
                          status: string;
                          items: number;
                        };
                        return `${status}: ${items}`;
                      }}
                      outerRadius={80}
                      innerRadius={40}
                      dataKey="items"
                      paddingAngle={2}
                    >
                      {inventoryStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const total = inventoryStatusData.reduce(
                            (sum, item) => sum + item.items,
                            0
                          );
                          const percent = (
                            ((payload[0].value as number) / total) *
                            100
                          ).toFixed(1);
                          return (
                            <div className="bg-background rounded-lg border p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium">
                                    {payload[0].payload.status}
                                  </span>
                                  <span className="text-sm font-bold">
                                    {payload[0].value} items
                                  </span>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {percent}% of inventory
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Equipment Utilization
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Weekly equipment usage percentage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <BarChart
                    data={equipmentUsageData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-zinc-200 dark:stroke-zinc-700"
                    />
                    <XAxis
                      dataKey="week"
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                    />
                    <YAxis
                      className="text-xs"
                      domain={[0, 100]}
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                      label={{
                        value: 'Usage (%)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: '12px' },
                      }}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          return (
                            <div className="bg-background rounded-lg border p-3 shadow-sm">
                              <div className="mb-2 font-medium">
                                {payload[0].payload.week}
                              </div>
                              <div className="grid gap-1">
                                {payload.map((entry, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{
                                          backgroundColor: entry.color,
                                        }}
                                      />
                                      <span className="text-sm">
                                        {entry.name}
                                      </span>
                                    </div>
                                    <span className="text-sm font-bold">
                                      {entry.value}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="utilized"
                      fill="#10b981"
                      stackId="a"
                      name="Utilized %"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="idle"
                      fill="#ef4444"
                      stackId="a"
                      name="Idle %"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Resource Metrics
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Inventory and equipment statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/10">
                    <Package className="mb-2 h-6 w-6 text-green-600" />
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      450
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-400">
                      Items In Stock
                    </div>
                  </div>
                  <div className="rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-4 dark:border-orange-800 dark:from-orange-900/20 dark:to-orange-800/10">
                    <AlertCircle className="mb-2 h-6 w-6 text-orange-600" />
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      75
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-400">
                      Low Stock Items
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/10">
                    <Wrench className="mb-2 h-6 w-6 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      120
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-400">
                      Equipment Units
                    </div>
                  </div>
                  <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4 dark:border-purple-800 dark:from-purple-900/20 dark:to-purple-800/10">
                    <Activity className="mb-2 h-6 w-6 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      88%
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-400">
                      Avg Utilization
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-4">
          {/* Row 1: Cash Flow (Area) + Expense Breakdown (Donut) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Cash Flow Analysis
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monthly cash inflow vs outflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <AreaChart
                    data={cashFlowData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorInflow"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorOutflow"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-zinc-200 dark:stroke-zinc-700"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                      label={{
                        value: 'Amount ($)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: '12px' },
                      }}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          return (
                            <div className="bg-background rounded-lg border p-3 shadow-sm">
                              <div className="mb-2 font-medium">
                                {payload[0].payload.month}
                              </div>
                              <div className="grid gap-1">
                                {payload.map((entry, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{
                                          backgroundColor: entry.color,
                                        }}
                                      />
                                      <span className="text-sm">
                                        {entry.name}
                                      </span>
                                    </div>
                                    <span className="text-sm font-bold">
                                      $
                                      {(entry.value as number).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="text-muted-foreground mt-2 border-t pt-2 text-xs">
                                Net: $
                                {(
                                  (payload[0].payload.inflow -
                                    payload[0].payload.outflow) as number
                                ).toLocaleString()}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconType="circle"
                    />
                    <Area
                      type="monotone"
                      dataKey="inflow"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorInflow)"
                      name="Cash Inflow"
                    />
                    <Area
                      type="monotone"
                      dataKey="outflow"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOutflow)"
                      name="Cash Outflow"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Expense Breakdown
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Distribution by category ($)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <PieChart>
                    <Pie
                      data={expenseBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(props) => {
                        const { category, value } = props as typeof props & {
                          category: string;
                          value: number;
                        };
                        return `${category}: $${(value / 1000).toFixed(0)}k`;
                      }}
                      outerRadius={80}
                      innerRadius={40}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {expenseBreakdownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const total = expenseBreakdownData.reduce(
                            (sum, item) => sum + item.value,
                            0
                          );
                          const percent = (
                            ((payload[0].value as number) / total) *
                            100
                          ).toFixed(1);
                          return (
                            <div className="bg-background rounded-lg border p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium">
                                    {payload[0].payload.category}
                                  </span>
                                  <span className="text-sm font-bold">
                                    $
                                    {(
                                      payload[0].value as number
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {percent}% of total expenses
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Profit Margin (Radial) + Department Budget (Bar) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Profit Margin Trend
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monthly profit margin percentage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="90%"
                    data={profitMarginData.map((item, index) => ({
                      ...item,
                      fill: `hsl(${120 + index * 20}, 70%, 50%)`,
                    }))}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarGrid gridType="circle" />
                    <RadialBar background dataKey="margin" cornerRadius={10} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          return (
                            <div className="bg-background rounded-lg border p-2 shadow-sm">
                              <div className="grid gap-1">
                                <span className="text-sm font-medium">
                                  {payload[0].payload.month}
                                </span>
                                <span className="text-sm font-bold">
                                  {payload[0].value}% margin
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      iconSize={10}
                      layout="horizontal"
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      formatter={(value, entry) => {
                        const payload = entry.payload as {
                          month?: string;
                          margin?: number;
                        };
                        return payload?.month && payload?.margin !== undefined
                          ? `${payload.month}: ${payload.margin}%`
                          : value;
                      }}
                    />
                  </RadialBarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Department Budget Usage
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Allocated vs utilized (%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <BarChart
                    data={departmentBudgetData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-zinc-200 dark:stroke-zinc-700"
                    />
                    <XAxis
                      dataKey="department"
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                      domain={[0, 100]}
                      label={{
                        value: 'Percentage (%)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: '12px' },
                      }}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          return (
                            <div className="bg-background rounded-lg border p-3 shadow-sm">
                              <div className="mb-2 font-medium">
                                {payload[0].payload.department}
                              </div>
                              <div className="grid gap-1">
                                {payload.map((entry, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{
                                          backgroundColor: entry.color,
                                        }}
                                      />
                                      <span className="text-sm">
                                        {entry.name}
                                      </span>
                                    </div>
                                    <span className="text-sm font-bold">
                                      {entry.value}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="allocated"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      name="Allocated"
                    />
                    <Bar
                      dataKey="utilized"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      name="Utilized"
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Financial Health Radar Chart (Full Width) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                Financial Health Index
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Overall financial performance across key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="h-[280px] w-full sm:h-[320px]"
              >
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  data={financialHealthData}
                >
                  <PolarGrid
                    stroke="#cbd5e1"
                    className="dark:stroke-zinc-700"
                  />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: 'currentColor', fontSize: 10 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const value = payload[0].value as number;
                        return (
                          <div className="bg-background rounded-lg border p-2 shadow-sm">
                            <div className="grid gap-1">
                              <span className="text-sm font-medium">
                                {payload[0].payload.metric}
                              </span>
                              <span className="text-sm font-bold">
                                {value}/100
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {value >= 80
                                  ? 'Excellent'
                                  : value >= 60
                                    ? 'Good'
                                    : 'Needs Attention'}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}
                    iconType="circle"
                  />
                </RadarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Financial Summary Stats */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                Financial Summary
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Key financial metrics this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/10">
                  <DollarSign className="mb-2 h-6 w-6 text-green-600" />
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    $580K
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-400">
                    Total Revenue
                  </div>
                  <div className="mt-1 text-xs text-green-600">+8.5% MoM</div>
                </div>
                <div className="rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-4 dark:border-red-800 dark:from-red-900/20 dark:to-red-800/10">
                  <TrendingDown className="mb-2 h-6 w-6 text-red-600" />
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                    $390K
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-400">
                    Total Expenses
                  </div>
                  <div className="mt-1 text-xs text-red-600">+5.4% MoM</div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/10">
                  <TrendingUp className="mb-2 h-6 w-6 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    $190K
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-400">
                    Net Profit
                  </div>
                  <div className="mt-1 text-xs text-blue-600">+13.8% MoM</div>
                </div>
                <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4 dark:border-purple-800 dark:from-purple-900/20 dark:to-purple-800/10">
                  <Activity className="mb-2 h-6 w-6 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    32.8%
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-400">
                    Profit Margin
                  </div>
                  <div className="mt-1 text-xs text-purple-600">Healthy</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          {/* Row 1: Projects by Status (Donut) + Project Timeline (Bar) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Projects by Status
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Current status distribution of all projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <PieChart>
                    <Pie
                      data={projectsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="count"
                      label={(props) => {
                        const { name, count } = props as typeof props & {
                          name: string;
                          count: number;
                        };
                        return `${name}: ${count}`;
                      }}
                      labelLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                    >
                      {projectsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          return (
                            <div className="bg-background rounded-lg border p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground text-[0.70rem] uppercase">
                                    Status
                                  </span>
                                  <span className="text-muted-foreground font-bold">
                                    {payload[0].payload.status}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground text-[0.70rem] uppercase">
                                    Count
                                  </span>
                                  <span className="font-bold">
                                    {payload[0].value}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Project Progress
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Completion percentage by project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] w-full sm:h-[300px]"
                >
                  <BarChart
                    data={projectTimeline}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-zinc-200 dark:stroke-zinc-700"
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                      label={{
                        value: 'Progress (%)',
                        position: 'insideBottom',
                        offset: -5,
                        style: { fontSize: '12px' },
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickLine={{ stroke: 'currentColor' }}
                      width={90}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          return (
                            <div className="bg-background rounded-lg border p-3 shadow-sm">
                              <div className="mb-2 font-bold">
                                {payload[0].payload.name}
                              </div>
                              <div className="grid gap-2 text-sm">
                                <div className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">
                                    Progress:
                                  </span>
                                  <span className="font-bold text-green-600">
                                    {payload[0].payload.progress}%
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">
                                    Budget Used:
                                  </span>
                                  <span className="font-bold text-blue-600">
                                    {payload[0].payload.budget}%
                                  </span>
                                </div>
                                <div className="text-muted-foreground mt-1 text-xs">
                                  {payload[0].payload.startDate} -{' '}
                                  {payload[0].payload.endDate}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar
                      dataKey="progress"
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                      name="Progress %"
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Budget Utilization (Area Chart) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                Project Budget Utilization
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Monthly allocated vs spent budget (in thousands)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="h-[250px] w-full sm:h-[300px]"
              >
                <AreaChart
                  data={projectBudgetUtilization}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="colorAllocated"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-zinc-200 dark:stroke-zinc-700"
                  />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    tickLine={{ stroke: 'currentColor' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    tickLine={{ stroke: 'currentColor' }}
                    label={{
                      value: 'Amount ($K)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: '12px' },
                    }}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        return (
                          <div className="bg-background rounded-lg border p-3 shadow-sm">
                            <div className="mb-2 font-bold">
                              {payload[0].payload.month}
                            </div>
                            <div className="grid gap-1 text-sm">
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                  Allocated:
                                </span>
                                <span className="font-bold text-blue-600">
                                  ${payload[0].value}K
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                  Spent:
                                </span>
                                <span className="font-bold text-green-600">
                                  ${payload[1].value}K
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ stroke: 'currentColor', strokeWidth: 1 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    iconType="line"
                  />
                  <Area
                    type="monotone"
                    dataKey="allocated"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAllocated)"
                    name="Allocated"
                  />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSpent)"
                    name="Spent"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Row 3: Recent Projects List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Recent Projects
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Latest project details and progress
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard/portfolio/projects')}
                  className="text-xs sm:text-sm"
                >
                  View All
                  <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-zinc-900 sm:text-base dark:text-zinc-100">
                            {project.name}
                          </h4>
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${(() => {
                              if (project.status === 'open')
                                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                              if (project.status === 'upcoming')
                                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
                              if (project.status === 'on-hold')
                                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
                              return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
                            })()}`}
                          >
                            {project.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="mb-2 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
                          {project.location}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                          <span>
                            Budget: ₹{(project.budget / 10_000_000).toFixed(1)}
                            Cr
                          </span>
                          <span>
                            Spent: ₹{(project.spent / 10_000_000).toFixed(1)}
                            Cr
                          </span>
                          <span>Team: {project.members} members</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                          {project.progress}%
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          Complete
                        </div>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-2 rounded-full bg-green-600 transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-zinc-500 dark:text-zinc-500">
                      <span>
                        {new Date(project.startDate).toLocaleDateString()}
                      </span>
                      <span>
                        {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Row 4: Project Performance Radar + Project Stats */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Project Performance Index
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Overall performance across key metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[280px] w-full sm:h-[320px]"
                >
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    data={projectPerformance}
                  >
                    <PolarGrid
                      stroke="#cbd5e1"
                      className="dark:stroke-zinc-700"
                    />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          return (
                            <div className="bg-background rounded-lg border p-2 shadow-sm">
                              <div className="mb-1 text-sm font-bold">
                                {payload[0].payload.metric}
                              </div>
                              <div className="text-sm">
                                Score:{' '}
                                <span className="font-bold text-blue-600">
                                  {payload[0].value}/100
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}
                      iconType="circle"
                    />
                  </RadarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Project Metrics
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Key project statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/10">
                    <CheckCircle2 className="mb-2 h-6 w-6 text-green-600" />
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      8
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-400">
                      Active Projects
                    </div>
                    <div className="mt-1 text-xs text-green-600">On Track</div>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/10">
                    <Clock className="mb-2 h-6 w-6 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      5
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-400">
                      Upcoming
                    </div>
                    <div className="mt-1 text-xs text-blue-600">
                      In Pipeline
                    </div>
                  </div>
                  <div className="rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 dark:border-yellow-800 dark:from-yellow-900/20 dark:to-yellow-800/10">
                    <AlertCircle className="mb-2 h-6 w-6 text-yellow-600" />
                    <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      3
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-400">
                      On Hold
                    </div>
                    <div className="mt-1 text-xs text-yellow-600">
                      Needs Attention
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:border-gray-800 dark:from-gray-900/20 dark:to-gray-800/10">
                    <Building className="mb-2 h-6 w-6 text-gray-600" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      12
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-400">
                      Completed
                    </div>
                    <div className="mt-1 text-xs text-gray-600">This Year</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
