'use client';

/**
 * The Home dashboard. Every figure on it comes from the organization's own
 * records: the four headline counts, the project and task/issue widgets
 * (worked out from the lists the app already loads), and the finance, leave
 * and inventory sections (from their backend reports, for the roles those
 * reports admit). A widget with nothing to show renders an empty state.
 *
 * Widgets with no backend source at all (attendance trends, budget usage by
 * department, equipment utilization, contractor performance and the like)
 * are left off rather than drawn from sample data; see echno-web #487.
 */
import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Building,
  CheckCircle2,
  ClipboardList,
  Clock,
  FolderKanban,
  IndianRupee,
  ListTodo,
  MessageSquare,
  Package,
  PauseCircle,
  TriangleAlert,
  UserCheck,
  Users,
  CalendarDays,
  Activity,
  Percent,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useTasks } from '@tornotron/echno-core/task/hooks';
import { useIssues } from '@tornotron/echno-core/issue/hooks';
import {
  ProjectStatus,
  getProjectStatusLabel,
} from '@tornotron/echno-core/project/types';
import { TaskStatus } from '@tornotron/echno-core/task/types';
import { routes } from '@/nav';
import { useCan } from '@/hooks/use-can';
import {
  FINANCE_REPORTS_ACCESS,
  LEAVE_ORG_READ_ACCESS,
  STORES_ACCESS,
} from '@/nav/access/roles';
import { formatDateMedium } from '@/lib/utils/date-utils';
import {
  isOpenIssue,
  itemsNeedingAttention,
  openIssuesByPriority,
  projectCounts,
  projectsByStatus,
  recentProjects,
  taskIssueMetrics,
  tasksByStatus,
} from '../lib/dashboard-metrics';
import {
  BreakdownBars,
  MetricTile,
  WidgetCard,
  WidgetEmpty,
  WidgetLoading,
} from './dashboard-widgets';
import {
  FinanceSection,
  IncomeStatCard,
  InventorySection,
  LeaveSection,
} from './gated-sections';

type TabKey = 'projects' | 'work' | 'finance' | 'people' | 'inventory';

function StatCard({
  title,
  icon: Icon,
  value,
  note,
}: {
  title: string;
  icon: typeof Users;
  value: number;
  note: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium sm:text-base">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-amber-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
          {value}
        </div>
        <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
          {note}
        </p>
      </CardContent>
    </Card>
  );
}

const PROJECT_STATUS_BADGE: Partial<Record<ProjectStatus, string>> = {
  [ProjectStatus.open]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  [ProjectStatus.approved]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  [ProjectStatus.upcoming]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  [ProjectStatus.onHold]:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export function HomeDashboard() {
  const employeesQuery = useEmployeeLookup();
  const projectsQuery = useProjects();
  const tasksQuery = useTasks();
  const issuesQuery = useIssues();
  const employees = employeesQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const issues = issuesQuery.data ?? [];

  const finance = useCan(FINANCE_REPORTS_ACCESS).allowed;
  const leave = useCan(LEAVE_ORG_READ_ACCESS).allowed;
  const stores = useCan(STORES_ACCESS).allowed;

  const [tab, setTab] = useState<TabKey>('projects');

  const activeTasks = tasks.filter(
    (t) => t.status === TaskStatus.onGoing || t.status === TaskStatus.upcoming
  ).length;
  const openIssues = issues.filter((i) => isOpenIssue(i)).length;
  const counts = projectCounts(projects);
  const statusBreakdown = projectsByStatus(projects);
  const latestProjects = recentProjects(projects);
  const taskBreakdown = tasksByStatus(tasks);
  const priorityBreakdown = openIssuesByPriority(issues);
  const attention = itemsNeedingAttention(tasks, issues);
  const metrics = taskIssueMetrics(tasks, issues);

  const tabs: { key: TabKey; label: string; icon: typeof Users }[] = [
    { key: 'projects', label: 'Projects', icon: Building },
    { key: 'work', label: 'Tasks & Issues', icon: ClipboardList },
    ...(finance
      ? [{ key: 'finance' as const, label: 'Finance', icon: IndianRupee }]
      : []),
    ...(leave
      ? [{ key: 'people' as const, label: 'Leave', icon: CalendarDays }]
      : []),
    ...(stores
      ? [{ key: 'inventory' as const, label: 'Inventory', icon: Package }]
      : []),
  ];
  const activeTab = tabs.some((t) => t.key === tab) ? tab : 'projects';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile quick actions, visible only on small screens */}
      <div className="grid grid-cols-4 gap-2 lg:hidden">
        {[
          {
            label: 'Attendance',
            icon: UserCheck,
            href: routes.attendance.href,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20',
          },
          {
            label: 'Projects',
            icon: FolderKanban,
            href: routes.projects.href,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-500/10',
          },
          {
            label: 'Tasks',
            icon: ListTodo,
            href: routes.tasks,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-500/10',
          },
          {
            label: 'Chat',
            icon: MessageSquare,
            href: routes.chat.href,
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

      {/* Headline counts */}
      <div
        className={`grid grid-cols-2 gap-3 sm:gap-4 ${finance ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}
      >
        <StatCard
          title="Employees"
          icon={Users}
          value={employees.length}
          note={
            <>
              <span className="text-green-600">
                {employees.filter((e) => e.status === 'active').length}
              </span>{' '}
              active
            </>
          }
        />
        <StatCard
          title="Projects"
          icon={FolderKanban}
          value={projects.length}
          note={
            <>
              <span className="text-green-600">{counts.active}</span> active
            </>
          }
        />
        <StatCard
          title="Tasks"
          icon={ClipboardList}
          value={activeTasks}
          note="active tasks"
        />
        <StatCard
          title="Open Issues"
          icon={TriangleAlert}
          value={openIssues}
          note="require attention"
        />
        {finance ? <IncomeStatCard /> : null}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value: string) => setTab(value as TabKey)}
        className="space-y-4"
      >
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          {tabs.map(({ key, label, icon: Icon }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="flex items-center gap-2 py-2 sm:py-3"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <WidgetCard
              title="Projects by Status"
              description="Every project in the organization"
            >
              {projectsQuery.isLoading ? (
                <WidgetLoading />
              ) : statusBreakdown.length > 0 ? (
                <BreakdownBars items={statusBreakdown} />
              ) : (
                <WidgetEmpty
                  icon={FolderKanban}
                  title="No projects yet"
                  description="Create a project to start tracking its status here."
                />
              )}
            </WidgetCard>

            <WidgetCard title="Project Metrics" description="Projects by stage">
              <div className="grid grid-cols-2 gap-4">
                <MetricTile
                  icon={CheckCircle2}
                  label="Active"
                  value={counts.active}
                />
                <MetricTile
                  icon={Clock}
                  label="Upcoming"
                  value={counts.upcoming}
                />
                <MetricTile
                  icon={PauseCircle}
                  label="On hold"
                  value={counts.onHold}
                />
                <MetricTile
                  icon={Building}
                  label="Completed or closed"
                  value={counts.completed}
                />
              </div>
            </WidgetCard>
          </div>

          <WidgetCard
            title="Recent Projects"
            description="Most recently created"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href={routes.projects.allProjects.href}>
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            }
          >
            {projectsQuery.isLoading ? (
              <WidgetLoading />
            ) : latestProjects.length > 0 ? (
              <ul className="space-y-4">
                {latestProjects.map((project) => {
                  const progress = Math.min(
                    Math.max(Math.round(project.progress || 0), 0),
                    100
                  );
                  return (
                    <li key={project.id}>
                      <Link
                        href={
                          routes.projects.allProjects.detail(project.id).href
                        }
                        className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      >
                        <div className="mb-3 flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h4 className="truncate text-sm font-semibold text-zinc-900 sm:text-base dark:text-zinc-100">
                                {project.projectName}
                              </h4>
                              <span
                                className={`rounded px-2 py-0.5 text-xs font-medium ${
                                  PROJECT_STATUS_BADGE[project.status] ??
                                  'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}
                              >
                                {getProjectStatusLabel(project.status)}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
                              {[project.projectCity, project.projectState]
                                .filter(Boolean)
                                .join(', ') || project.projectAddress}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                              {progress}%
                            </div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400">
                              complete
                            </div>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <div
                            className="h-2 rounded-full bg-green-600"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-zinc-500">
                          <span>
                            {formatDateMedium(
                              project.startDate,
                              'No start date'
                            )}
                          </span>
                          <span>
                            {formatDateMedium(project.endDate, 'No end date')}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <WidgetEmpty
                icon={FolderKanban}
                title="No projects yet"
                description="Your newest projects will be listed here."
              />
            )}
          </WidgetCard>
        </TabsContent>

        <TabsContent value="work" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <WidgetCard
              title="Tasks by Status"
              description="Every task in the organization"
            >
              {tasksQuery.isLoading ? (
                <WidgetLoading />
              ) : taskBreakdown.length > 0 ? (
                <BreakdownBars items={taskBreakdown} />
              ) : (
                <WidgetEmpty
                  icon={ListTodo}
                  title="No tasks yet"
                  description="Tasks added to projects are counted here by status."
                />
              )}
            </WidgetCard>

            <WidgetCard
              title="Open Issues by Priority"
              description="Issues not yet resolved"
            >
              {issuesQuery.isLoading ? (
                <WidgetLoading />
              ) : priorityBreakdown.length > 0 ? (
                <BreakdownBars items={priorityBreakdown} />
              ) : (
                <WidgetEmpty
                  icon={TriangleAlert}
                  title="No open issues"
                  description="Open issues are grouped here by priority."
                />
              )}
            </WidgetCard>

            <WidgetCard
              title="Needs Attention"
              description="Overdue tasks and open high-priority issues"
            >
              {tasksQuery.isLoading || issuesQuery.isLoading ? (
                <WidgetLoading />
              ) : attention.length > 0 ? (
                <ul className="space-y-3">
                  {attention.map((item) => (
                    <li
                      key={`${item.kind}-${item.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {item.title}
                        </p>
                        <p className="text-xs text-zinc-500">{item.reason}</p>
                      </div>
                      {item.kind === 'task' ? (
                        <ListTodo className="h-4 w-4 shrink-0 text-amber-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <WidgetEmpty
                  icon={CheckCircle2}
                  title="Nothing needs attention"
                  description="Overdue tasks and high-priority issues will appear here."
                />
              )}
            </WidgetCard>

            <WidgetCard
              title="Task & Issue Metrics"
              description="Across all projects"
            >
              <div className="grid grid-cols-2 gap-4">
                <MetricTile
                  icon={CheckCircle2}
                  label="Tasks completed"
                  value={metrics.completedTasks}
                />
                <MetricTile
                  icon={Activity}
                  label="Tasks ongoing"
                  value={metrics.ongoingTasks}
                />
                <MetricTile
                  icon={TriangleAlert}
                  label="Open critical issues"
                  value={metrics.openCriticalIssues}
                />
                <MetricTile
                  icon={Percent}
                  label="Issues resolved"
                  value={
                    metrics.resolutionRate === undefined
                      ? '—'
                      : `${metrics.resolutionRate}%`
                  }
                  hint={
                    metrics.resolutionRate === undefined
                      ? 'No issues yet'
                      : undefined
                  }
                />
              </div>
            </WidgetCard>
          </div>
        </TabsContent>

        {finance ? (
          <TabsContent value="finance" className="space-y-4">
            <FinanceSection />
          </TabsContent>
        ) : null}

        {leave ? (
          <TabsContent value="people" className="space-y-4">
            <LeaveSection />
          </TabsContent>
        ) : null}

        {stores ? (
          <TabsContent value="inventory" className="space-y-4">
            <InventorySection />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
