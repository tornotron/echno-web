'use client';

import { use, useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  AssignManagerDialog,
  AssignRoleDialog,
  RemoveRoleDialog,
} from '@/features/employee/components/employee-alert-dialogs';
import {
  User,
  Edit,
  Building,
  Loader2,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import Link from 'next/link';
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
import { EmployeeAvatar } from '@/components/shared/employee-avatar';
import { EmployeeOverviewTab } from '@/features/employee/components/employee-overview-tab';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'leave'>('overview');
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
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

      {/* Tabs */}
      <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex space-x-8">
          {[
            { id: 'overview' as const, label: 'Overview', icon: User },
            ...(currentUserEmployee?.id
              ? [{ id: 'leave' as const, label: 'Leave', icon: CalendarDays }]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
        <EmployeeOverviewTab
          employee={employee}
          employeeProjects={employeeProjects}
          projectsLoading={projectsLoading}
          currentRoles={currentRoles}
          availableRoles={availableRoles}
          isAdmin={isAdmin}
          isRoleRemovePending={unassignRole.isPending}
          onAssignManager={() => setShowAssignManagerDialog(true)}
          onAssignRole={() => setShowAssignRoleDialog(true)}
          onRemoveRole={(role) => setRoleToRemove(role)}
        />
      )}

      {activeTab === 'leave' && currentUserEmployee?.id && (
        <EmployeeLeaveSection
          employeeId={employeeId}
          currentUserId={currentUserEmployee.id}
        />
      )}

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
