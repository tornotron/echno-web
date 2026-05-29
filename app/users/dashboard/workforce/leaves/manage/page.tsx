'use client';

import { useState } from 'react';
import { OrgGuard, PageHeader } from '@/components/common';
import { useLeaveRole } from '@/hooks/leave/use-leave-role';
import { LeaveRole } from '@/types/leave';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { usePendingApprovalsCount } from '@/hooks/leave/use-leave';
import { DashboardSwitcher } from '@/features/leave/components/dashboard/dashboard-switcher';
import { EmployeeDashboard } from '@/features/leave/components/dashboard/employee-dashboard';
import { ManagerDashboard } from '@/features/leave/components/dashboard/manager-dashboard';
import { AdminDashboard } from '@/features/leave/components/dashboard/admin-dashboard';

const PREF_KEY = 'leave-dashboard-preference';

const ROLE_META: Record<LeaveRole, { title: string; description: string }> = {
  [LeaveRole.EMPLOYEE]: {
    title: 'My Leave',
    description: 'Your leave balance, requests, and upcoming time off',
  },
  [LeaveRole.MANAGER]: {
    title: 'Team Leave',
    description: 'Pending approvals and team leave management',
  },
  [LeaveRole.ADMIN]: {
    title: 'Leave Management',
    description: 'Organisation-wide leave analytics and management',
  },
};

export default function LeaveDashboardPage() {
  const { data: employee, isLoading: employeeLoading } =
    useCurrentUserEmployee();
  const { role, availableRoles, isLoading: roleLoading } = useLeaveRole();
  const employeeId = employee?.id || 0;

  const { data: pendingCount } = usePendingApprovalsCount(employeeId);

  const [selectedRole, setSelectedRole] = useState<LeaveRole | null>(() => {
    if (globalThis.window === undefined) return null;
    return localStorage.getItem(PREF_KEY) as LeaveRole | null;
  });

  const savedRoleIsValid =
    selectedRole !== null && availableRoles.includes(selectedRole);
  const activeRole = savedRoleIsValid ? selectedRole : role;

  const handleRoleChange = (newRole: LeaveRole) => {
    setSelectedRole(newRole);
    localStorage.setItem(PREF_KEY, newRole);
  };

  const { title, description } = ROLE_META[activeRole];

  return (
    <OrgGuard
      isLoading={employeeLoading || roleLoading}
      error={null}
      organizationId={employee?.organizationId}
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader title={title} description={description} />
          <DashboardSwitcher
            currentRole={activeRole}
            availableRoles={availableRoles}
            onRoleChange={handleRoleChange}
            pendingApprovalsCount={pendingCount}
          />
        </div>

        {activeRole === LeaveRole.EMPLOYEE && <EmployeeDashboard />}
        {activeRole === LeaveRole.MANAGER && <ManagerDashboard />}
        {activeRole === LeaveRole.ADMIN && (
          <>
            <AdminDashboard />
          </>
        )}
      </div>
    </OrgGuard>
  );
}
