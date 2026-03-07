'use client';

import { use, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AssignManagerDialog,
  AssignRoleDialog,
  RemoveRoleDialog,
} from '@/features/employee/components/employee-alert-dialogs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Edit,
  Building,
  Briefcase,
  IdCard,
  DollarSign,
  Clock,
  Users,
  Award,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  UserPlus,
  ArrowRightLeft,
  X,
  Shield,
  Wrench,
  CalendarDays,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getDepartmentLabel } from '@/types/employee';
import { OrgRole, getOrgRoleLabel } from '@/types/employee/org-role';
import {
  useEmployees,
  useManagers,
  useCurrentUserEmployee,
} from '@/hooks/employee';
import { useAssignManager } from '@/hooks/employee/use-employee-mutations';
import { useRoleManagement } from '@/hooks/role-management/use-role-management';
import {
  useAssignRole,
  useUnassignRole,
} from '@/hooks/role-management/use-role-management-mutations';
import { useAuthorization } from '@/hooks/use-authorization';
import { useProjectsByEmployee } from '@/hooks/project';
import { EmployeeLeaveSection } from '@/features/leave/components/employee-leave-section';
import { CurrentProjectsCard } from '@/features/employee/components/current-projects-card';
import { EmployeeAvatar } from '@/features/employee/components/employee-avatar';

interface EmployeeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case 'inactive': {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case 'onLeave': {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': {
      return 'Active';
    }
    case 'inactive': {
      return 'Inactive';
    }
    case 'onLeave': {
      return 'On Leave';
    }
    default: {
      return status;
    }
  }
};

export default function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const resolvedParams = use(params);
  const employeeId = Number.parseInt(resolvedParams.id);
  const { data: employees, isLoading, error } = useEmployees();
  const employee = employees?.find((e) => e.id === employeeId);
  const { data: managers = [], isLoading: managersLoading } = useManagers();
  const assignManagerMutation = useAssignManager();
  const { data: currentUserEmployee } = useCurrentUserEmployee();
  const { isAdmin } = useAuthorization();
  const [showAssignManagerDialog, setShowAssignManagerDialog] = useState(false);

  // Projects
  const { data: employeeProjects, isLoading: projectsLoading } =
    useProjectsByEmployee(employeeId);

  // Role management
  const { currentRoles, availableRoles } = useRoleManagement(employeeId);
  const assignRole = useAssignRole();
  const unassignRole = useUnassignRole();
  const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<OrgRole | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold">Employee Not Found</h2>
        <p className="mb-4 text-zinc-500">
          The employee with ID {employeeId} could not be found.
        </p>
        <Button asChild>
          <Link href="/users/dashboard/workforce/employees">
            Back to Employees
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start space-x-4">
            <EmployeeAvatar employee={employee} size="lg" />
            <div>
              <div className="mb-2 flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {employee.name}
                </h1>
                <Badge className={getStatusColor(employee.status)}>
                  {getStatusLabel(employee.status)}
                </Badge>
              </div>
              <p className="mb-2 text-lg text-zinc-600 dark:text-zinc-400">
                {employee.designation}
              </p>
              {employee.department && (
                <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Building className="h-4 w-4" />
                  <span>{getDepartmentLabel(employee.department)}</span>
                </div>
              )}
            </div>
          </div>
          <Link
            href={`/users/dashboard/workforce/employees/${employee.id}/edit`}
          >
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {currentUserEmployee?.id && (
            <TabsTrigger value="leave">Leave</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Personal & Contact Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Employee personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <IdCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Employee ID
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {employee.employeeId}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Full Name
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {employee.name}
                      </p>
                    </div>
                  </div>
                  {employee.gender && (
                    <>
                      <Separator />
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/20">
                          <User className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Gender
                          </p>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {employee.gender}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {employee.dateOfBirth && (
                    <>
                      <Separator />
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                          <CalendarDays className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Date of Birth
                          </p>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {format(employee.dateOfBirth, 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {employee.joiningDate && (
                    <>
                      <Separator />
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                          <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Joining Date
                          </p>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {format(employee.joiningDate, 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {(employee.createdAt || employee.updatedAt) && (
                    <>
                      <Separator />
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
                        {employee.createdAt && (
                          <span>
                            Created {format(employee.createdAt, 'MMM d, yyyy')}
                          </span>
                        )}
                        {employee.updatedAt && (
                          <span>
                            Updated {format(employee.updatedAt, 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Employment Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Employment Details</CardTitle>
                  <CardDescription>Work-related information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Designation
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {employee.designation}
                      </p>
                    </div>
                  </div>
                  {employee.department && (
                    <>
                      <Separator />
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                          <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Department
                          </p>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {getDepartmentLabel(employee.department)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {employee.shiftTiming && (
                    <>
                      <Separator />
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Shift Timing
                          </p>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {employee.shiftTiming}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {employee.salary && (
                    <>
                      <Separator />
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Salary
                          </p>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            ${employee.salary.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Organizations, Projects, Certifications */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>How to reach this employee</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Email
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {employee.email}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                      <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Phone
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {employee.phone}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                      <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Address
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {employee.address}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reporting Manager */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Reporting Manager</CardTitle>
                      <CardDescription>
                        Direct reporting structure
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAssignManagerDialog(true)}
                    >
                      {employee.managerName ? (
                        <>
                          <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
                          Change
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                          Assign
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                      <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    {employee.managerName ? (
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {employee.managerName}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400 italic dark:text-zinc-500">
                        No manager assigned
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Current Projects */}
              <CurrentProjectsCard
                employeeProjects={employeeProjects}
                projectsLoading={projectsLoading}
              />

              {/* Roles */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Roles</CardTitle>
                      <CardDescription>
                        Organization roles &amp; permissions
                      </CardDescription>
                    </div>
                    {isAdmin && availableRoles.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAssignRoleDialog(true)}
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Assign
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Current roles */}
                  {currentRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {currentRoles.map((role) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className="flex items-center gap-1.5 pr-1"
                        >
                          <Shield className="h-3 w-3" />
                          {getOrgRoleLabel(role)}
                          {isAdmin && (
                            <button
                              type="button"
                              className="ml-0.5 rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100 disabled:pointer-events-none"
                              disabled={unassignRole.isPending}
                              onClick={() => setRoleToRemove(role)}
                              aria-label={`Remove ${getOrgRoleLabel(role)}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400 italic dark:text-zinc-500">
                      No roles assigned
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Skills */}
              {employee.skills && employee.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                    <CardDescription>Professional skills</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {employee.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1.5"
                        >
                          <Wrench className="h-3 w-3" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {employee.certifications &&
                employee.certifications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Certifications</CardTitle>
                      <CardDescription>
                        Professional certifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {employee.certifications.map((cert, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/50"
                          >
                            <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {cert}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* CV/Resume */}
              {employee.cv?.file && (
                <Card>
                  <CardHeader>
                    <CardTitle>CV / Resume</CardTitle>
                    <CardDescription>Uploaded resume document</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={employee.cv.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                        <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {employee.cv.fileName || 'Resume'}
                        </p>
                        {employee.cv.fileSize > 0 && (
                          <p className="text-xs text-zinc-500">
                            {(employee.cv.fileSize / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                      <Download className="h-4 w-4 shrink-0 text-zinc-400" />
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {currentUserEmployee?.id && (
          <TabsContent value="leave">
            <EmployeeLeaveSection
              employeeId={employeeId}
              currentUserId={currentUserEmployee.id}
            />
          </TabsContent>
        )}
      </Tabs>

      <AssignManagerDialog
        open={showAssignManagerDialog}
        onOpenChange={setShowAssignManagerDialog}
        managers={managers}
        managersLoading={managersLoading}
        currentEmployeeId={employee.id!}
        defaultManagerId={employee.managerId}
        isPending={assignManagerMutation.isPending}
        onConfirm={(managerId) => {
          if (!employee.id) return;
          assignManagerMutation.mutate(
            { employeeId: employee.id, managerId },
            { onSuccess: () => setShowAssignManagerDialog(false) }
          );
        }}
      />

      <AssignRoleDialog
        open={showAssignRoleDialog}
        onOpenChange={setShowAssignRoleDialog}
        availableRoles={availableRoles}
        isPending={assignRole.isPending}
        onConfirm={(role) => {
          if (!employee.id) return;
          assignRole.mutate(
            { employeeId: employee.id, orgRole: role },
            { onSuccess: () => setShowAssignRoleDialog(false) }
          );
        }}
      />

      <RemoveRoleDialog
        open={roleToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setRoleToRemove(null);
        }}
        roleName={roleToRemove ? getOrgRoleLabel(roleToRemove) : ''}
        employeeName={employee.name}
        isPending={unassignRole.isPending}
        onConfirm={() => {
          if (!roleToRemove || !employee.id) return;
          unassignRole.mutate(
            { employeeId: employee.id, orgRole: roleToRemove },
            { onSettled: () => setRoleToRemove(null) }
          );
        }}
      />
    </div>
  );
}
