'use client';

import { notFound } from 'next/navigation';
import { useState, use } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Department } from '@/types/employee/departments';
import {
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  Edit,
  Calendar,
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
import { buildTree } from '@/lib/utils/hierarchy';
import {
  OrganizationOverviewTab,
  OrganizationSettingsTab,
  OrganizationHierarchyTab,
} from '@/features/organization';
import { EmployeeTreeNode } from '@/features/employee';

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
        <OrganizationOverviewTab
          organization={organization}
          orgEmployeesCount={orgEmployees.length}
          orgProjectsCount={orgProjects.length}
        />
      )}

      {activeTab === 'settings' && (
        <OrganizationSettingsTab
          organization={organization}
          isDefault={isDefault}
          orgEmployeesCount={orgEmployees.length}
          orgProjectsCount={orgProjects.length}
          onSetAsDefault={handleSetAsDefault}
        />
      )}

      {activeTab === 'hierarchy' && (
        <OrganizationHierarchyTab
          hierarchyDepartments={hierarchyDepartments}
          activeDept={activeDept}
          deptEmployees={deptEmployees}
          treeRoots={treeRoots}
          onSelectDepartment={setSelectedDepartment}
          hierarchyEmployees={hierarchyEmployees}
          renderNode={(node) => <EmployeeTreeNode node={node} />}
        />
      )}
    </div>
  );
}
