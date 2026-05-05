'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import {
  useOrganizationCalendar,
  useTeamCalendar,
  useDepartmentCalendar,
} from '@/hooks/leave/use-leave';
import { Calendar, Users, Download, Filter } from 'lucide-react';
import { OrgGuard, PageHeader } from '@/components/common';
import { Skeleton } from '@/components/shadcn/skeleton';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Department, getDepartmentLabel } from '@/types/employee/departments';
import { useCurrentUserEmployee } from '@/hooks/employee';
import {
  LeaveCalendarGrid,
  CalendarView,
} from '@/features/leave/components/calendar/leave-calendar-grid';

export default function LeaveCalendarPage() {
  const { data: employee, isLoading: employeeLoading } =
    useCurrentUserEmployee();
  const employeeId = employee?.id || 0;
  const organizationId = employee?.organizationId || 0;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [view, setView] = useState<CalendarView>('month');

  const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  const { data: orgCalendar, isLoading: orgLoading } = useOrganizationCalendar(
    organizationId,
    startDate,
    endDate
  );

  const { data: teamCalendar, isLoading: teamLoading } = useTeamCalendar(
    employeeId,
    startDate,
    endDate
  );

  const { data: deptCalendar, isLoading: deptLoading } = useDepartmentCalendar(
    organizationId,
    selectedDepartment,
    startDate,
    endDate
  );

  return (
    <OrgGuard
      isLoading={employeeLoading}
      error={null}
      organizationId={employee?.organizationId}
    >
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Leave Calendar"
          description="View team and organization leave schedules"
          actions={
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Calendar
            </Button>
          }
        />

        {/* Stats */}
        <Card className="gap-0 p-6">
          <div className="divide-border grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col gap-1 py-6 sm:py-0 sm:pr-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Organisation
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {orgCalendar?.length || 0}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Users className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                leave entries this month
              </p>
            </div>
            <div className="flex flex-col gap-1 py-6 sm:px-6 sm:py-0">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                My Team
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                  {teamCalendar?.length || 0}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
                  <Users className="size-4 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                team members on leave
              </p>
            </div>
            <div className="flex flex-col gap-1 py-6 sm:py-0 sm:pl-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Unique Employees
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {new Set(orgCalendar?.map((e) => e.employeeId)).size || 0}
                </p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                  <Calendar className="size-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                employees with leave
              </p>
            </div>
          </div>
        </Card>

        {/* Calendar Tabs */}
        <Tabs defaultValue="organization" className="space-y-4">
          <TabsList>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="team">My Team</TabsTrigger>
            <TabsTrigger value="department">By Department</TabsTrigger>
          </TabsList>

          <TabsContent value="organization" className="space-y-4">
            {orgLoading ? (
              <Card>
                <CardContent className="space-y-4 p-6">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-[400px] w-full" />
                </CardContent>
              </Card>
            ) : (
              <LeaveCalendarGrid
                entries={orgCalendar || []}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                view={view}
                onViewChange={setView}
              />
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            {teamLoading ? (
              <Card>
                <CardContent className="space-y-4 p-6">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-[400px] w-full" />
                </CardContent>
              </Card>
            ) : (
              <LeaveCalendarGrid
                entries={teamCalendar || []}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                view={view}
                onViewChange={setView}
              />
            )}
          </TabsContent>

          <TabsContent value="department" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <CardTitle className="text-base">
                    Filter by Department
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {Object.values(Department).map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {getDepartmentLabel(dept)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedDepartment !== 'all' &&
              (deptLoading ? (
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-[400px] w-full" />
                  </CardContent>
                </Card>
              ) : (
                <LeaveCalendarGrid
                  entries={deptCalendar || []}
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  view={view}
                  onViewChange={setView}
                />
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </OrgGuard>
  );
}
