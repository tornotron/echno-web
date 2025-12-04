'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import { mockEmployees } from '@/components/shared/mock-data';
import { AppLayout } from '@/components/common/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getDepartmentLabel } from '@/types/employee';

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
  const employee = mockEmployees.find(
    (emp) => emp.id === Number.parseInt(resolvedParams.id)
  );

  if (!employee) {
    notFound();
  }

  return (
    <AppLayout>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                <User className="h-10 w-10 text-white" />
              </div>
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
                <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Building className="h-4 w-4" />
                  <span>{getDepartmentLabel(employee.department)}</span>
                </div>
              </div>
            </div>
            <Link href={`/dashboard/workforce/employees/${employee.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Employee
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
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
              </CardContent>
            </Card>

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
                {employee.reportingManager && (
                  <>
                    <Separator />
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                        <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Reporting Manager
                        </p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {employee.reportingManager}
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
            {/* Organizations */}
            {employee.organizations && employee.organizations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Organizations</CardTitle>
                  <CardDescription>Associated organizations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {employee.organizations.map((org) => (
                      <Link
                        key={org.id}
                        href={`/dashboard/organizations/${org.id}`}
                        className="block rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600">
                            <Building className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                              {org.organizationName}
                            </p>
                            <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                              {org.organizationAddress}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Projects */}
            {employee.currentProjects &&
              employee.currentProjects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Current Projects</CardTitle>
                    <CardDescription>
                      Active project assignments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {employee.currentProjects.map((project) => (
                        <div
                          key={project.id}
                          className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                              {project.projectName}
                            </h4>
                            <Badge variant="outline">{project.status}</Badge>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {project.projectAddress}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Certifications */}
            {employee.certifications && employee.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Certifications</CardTitle>
                  <CardDescription>Professional certifications</CardDescription>
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
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
