'use client';

import { notFound } from 'next/navigation';
import { useState, use } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Department, getDepartmentLabel } from '@/types/employee/departments';
import type { Employee } from '@/types/employee';
import { EmployeeAvatar } from '@/features/employee/components/employee-avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Calendar,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  Edit,
  User,
  Settings,
  Network,
  Loader2,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { useOrganization as useOrganizationQuery } from '@/hooks/organization/use-organizations';
import { useOrganization } from '@/components/providers/organization-provider';
import { toast } from '@/lib/styles/toast-styles';
import { LeavePoliciesManager } from '@/features/leave/components/leave-policies-manager';

// ---------------------------------------------------------------------------
// Hierarchy tree helpers
// ---------------------------------------------------------------------------

type TreeNode = Employee & { children: TreeNode[] };

function buildTree(employees: Employee[]): TreeNode[] {
  const nodeMap = new Map<number, TreeNode>();
  for (const emp of employees) {
    if (emp.id !== undefined) nodeMap.set(emp.id, { ...emp, children: [] });
  }
  const roots: TreeNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.managerId !== undefined && nodeMap.has(node.managerId)) {
      nodeMap.get(node.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function EmployeeTreeNode({
  node,
  isLast,
}: {
  node: TreeNode;
  isLast: boolean;
}) {
  return (
    <div className="relative">
      <div className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
        <EmployeeAvatar employee={node} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {node.name}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {node.designation}
          </p>
        </div>
        {node.children.length > 0 && (
          <Badge variant="outline" className="shrink-0 text-xs">
            {node.children.length}{' '}
            {node.children.length === 1 ? 'report' : 'reports'}
          </Badge>
        )}
      </div>

      {node.children.length > 0 && (
        <div className="mt-1 ml-5 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
          {node.children.map((child, i) => (
            <EmployeeTreeNode
              key={child.id}
              node={child}
              isLast={i === node.children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface OrganizationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OrganizationDetailPage({
  params,
}: OrganizationDetailPageProps) {
  const resolvedParams = use(params);
  const organizationId = Number.parseInt(resolvedParams.id);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'settings' | 'hierarchy'
  >('overview');
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  const {
    data: organization,
    isLoading,
    error,
  } = useOrganizationQuery(organizationId);
  const { defaultOrganization, setDefaultOrganization } = useOrganization();

  const isDefault = defaultOrganization?.id === organization?.id;

  const handleSetAsDefault = () => {
    if (organization && !isDefault) {
      setDefaultOrganization(organization);
      toast.success('Default Organization Updated', {
        description: `${organization.organizationName} is now your default organization`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !organization) {
    if (!isLoading && error) {
      return (
        <div className="flex h-screen items-center justify-center text-red-500">
          Error loading organization
        </div>
      );
    }
    // Case: Loading finished, no error, but no org?
    if (!isLoading && !organization && !error) {
      notFound();
    }
  }

  // If we're here, organization is defined (typescript might complain so allow Optional chaining or check above)
  if (!organization) return null;

  // Get employees and projects for this organization from the fetched data
  const orgEmployees = organization.employees || [];
  const orgProjects = organization.projects || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'hierarchy', label: 'Hierarchy', icon: Network },
  ];

  const hierarchyEmployees = orgEmployees;
  const hierarchyDepartments = [
    ...new Set(
      hierarchyEmployees
        .map((emp) => emp.department)
        .filter((d): d is Department => !!d)
    ),
  ];
  const activeDept = selectedDepartment ?? hierarchyDepartments[0] ?? null;
  const deptEmployees = activeDept
    ? hierarchyEmployees.filter((emp) => emp.department === activeDept)
    : [];
  const treeRoots = buildTree(deptEmployees);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start space-x-4">
            {organization.logo ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Image
                  src={
                    organization.logo.file.includes('?')
                      ? organization.logo.file
                      : `${organization.logo.file}?v=${organization.logo.updatedAt.getTime()}`
                  }
                  alt={organization.organizationName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600">
                <Building2 className="h-10 w-10 text-white" />
              </div>
            )}
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {organization.organizationName}
                </h1>
                <Badge
                  variant={organization.isActive ? 'default' : 'secondary'}
                >
                  {organization.isActive ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      Inactive
                    </>
                  )}
                </Badge>
                {isDefault && (
                  <Badge
                    variant="outline"
                    className="border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                  >
                    <Star className="mr-1 h-3 w-3 fill-yellow-500" />
                    Default
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <MapPin className="h-4 w-4" />
                  <span>{organization.organizationAddress}</span>
                </div>
                {organization.createdAt && (
                  <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Created on{' '}
                      {format(organization.createdAt, 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!isDefault && (
              <Button variant="outline" onClick={handleSetAsDefault}>
                <Star className="mr-2 h-4 w-4" />
                Set as Default
              </Button>
            )}
            <Link
              href={`/users/dashboard/organizations/${organization.id}/edit`}
            >
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Organization
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
              } `}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Contact Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Organization contact details</CardDescription>
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
                      {organization.organizationEmail}
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
                      {organization.organizationPhone}
                    </p>
                  </div>
                </div>
                {organization.organizationWebsite && (
                  <>
                    <Separator />
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                        <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Website
                        </p>
                        <a
                          href={organization.organizationWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {organization.organizationWebsite}
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>Quick overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link
                  href={`/users/dashboard/workforce/employees?organizationId=${organization.id}`}
                  className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Employees
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {orgEmployees.length}
                  </span>
                </Link>
                <Separator />
                <Link
                  href={`/users/dashboard/projects?organizationId=${organization.id}`}
                  className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Projects
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {orgProjects.length}
                  </span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Manage organization preferences and configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  General Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        Default Organization
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {isDefault
                          ? 'This is your default organization for viewing data'
                          : 'Set as default to filter all data by this organization'}
                      </p>
                    </div>
                    {isDefault ? (
                      <Badge
                        variant="outline"
                        className="border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                      >
                        <Star className="mr-1 h-3 w-3 fill-yellow-500" />
                        Default
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSetAsDefault}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set as Default
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        Organization Status
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Enable or disable this organization
                      </p>
                    </div>
                    <Badge
                      variant={organization.isActive ? 'default' : 'secondary'}
                    >
                      {organization.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        Total Employees
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Number of employees in this organization
                      </p>
                    </div>
                    <Badge variant="outline">{orgEmployees.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        Total Projects
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Number of projects in this organization
                      </p>
                    </div>
                    <Badge variant="outline">{orgProjects.length}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  Permissions & Access
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Employee Management
                    </span>
                    <span className="text-xs text-zinc-500">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Project Management
                    </span>
                    <span className="text-xs text-zinc-500">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Issue Tracking
                    </span>
                    <span className="text-xs text-zinc-500">Enabled</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Leave Policies</CardTitle>
                <CardDescription>
                  Manage leave policies for this organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Configure leave types, accrual rules, and policy settings for
                  employees.
                </p>
                <Link href="/users/dashboard/workforce/leaves/policies">
                  <Button>
                    <Settings className="mr-2 h-4 w-4" />
                    Go to Leave Policy Management
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Settings</CardTitle>
                <CardDescription>
                  Configure attendance rules and shift templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Set up check-in/check-out cycles, photo and geolocation
                  requirements, movement tracking, and regularization rules.
                </p>
                <Link href="/users/dashboard/attendance/settings">
                  <Button>
                    <User className="mr-2 h-4 w-4" />
                    Go to Attendance Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'hierarchy' && (
        <div>
          {hierarchyDepartments.length === 0 ? (
            <div className="py-16 text-center">
              <Network className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <p className="text-zinc-600 dark:text-zinc-400">
                No hierarchy data available
              </p>
            </div>
          ) : (
            <div className="flex min-h-[500px] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              {/* Left — department sidebar */}
              <div className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="p-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Departments
                </div>
                <nav className="space-y-0.5 px-2 pb-4">
                  {hierarchyDepartments.map((dept) => {
                    const count = hierarchyEmployees.filter(
                      (e) => e.department === dept
                    ).length;
                    const isActive = dept === activeDept;
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setSelectedDepartment(dept)}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-white font-medium text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                            : 'text-zinc-600 hover:bg-white/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
                        }`}
                      >
                        <span className="truncate">
                          {getDepartmentLabel(dept)}
                        </span>
                        <Badge
                          variant={isActive ? 'default' : 'outline'}
                          className="ml-2 shrink-0 text-xs"
                        >
                          {count}
                        </Badge>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Right — hierarchy tree */}
              <div className="min-w-0 flex-1 overflow-y-auto bg-white p-6 dark:bg-zinc-950">
                {activeDept && (
                  <>
                    <div className="mb-4 flex items-center gap-2">
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {getDepartmentLabel(activeDept)}
                      </h3>
                      <span className="text-sm text-zinc-400">
                        · {deptEmployees.length}{' '}
                        {deptEmployees.length === 1 ? 'employee' : 'employees'}
                      </span>
                    </div>

                    {treeRoots.length > 0 ? (
                      <div className="space-y-3">
                        {treeRoots.map((root, i) => (
                          <EmployeeTreeNode
                            key={root.id}
                            node={root}
                            isLast={i === treeRoots.length - 1}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <Users className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          No employees in this department
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
