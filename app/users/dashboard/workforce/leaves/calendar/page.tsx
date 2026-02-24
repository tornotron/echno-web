'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useOrganizationCalendar,
  useTeamCalendar,
  useDepartmentCalendar,
} from '@/hooks/leave/use-leave';
import { Calendar, Users, Download, Filter } from 'lucide-react';
import { DashboardSkeleton } from '@/features/leave/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';
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

  if (employeeLoading) {
    return <DashboardSkeleton />;
  }

  if (!employee) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Employee profile not found</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Please ensure your employee profile is set up correctly
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Calendar</h1>
          <p className="text-muted-foreground">
            View team and organization leave schedules
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Calendar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgCalendar?.length || 0}</div>
            <p className="text-muted-foreground text-xs">
              leave entries this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Team</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamCalendar?.length || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              team members on leave
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Employees
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(orgCalendar?.map((e) => e.employeeId)).size || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              employees with leave
            </p>
          </CardContent>
        </Card>
      </div>

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
  );
}
