'use client';

import { use, useState } from 'react';
import { Button } from '@/components/shadcn/button';
import {
  AssignManagerDialog,
  AssignRoleDialog,
  RemoveRoleDialog,
} from '@/features/employee/components/employee-alert-dialogs';
import { User, Loader2, CalendarDays } from 'lucide-react';
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
import { EmployeeOverviewTab } from '@/features/employee/components/employee-overview-tab';
import { EmployeeErrorState } from '@/features/employee/components/employee-error-state';
import { EmployeeDetailsHeader } from '@/features/employee/components/employee-details-header';

interface EmployeeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

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

  if (error) {
    return <EmployeeErrorState employeeId={employeeId} variant="fetch-error" />;
  }

  if (!employee) {
    return <EmployeeErrorState employeeId={employeeId} variant="not-found" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <EmployeeDetailsHeader employee={employee} />

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
