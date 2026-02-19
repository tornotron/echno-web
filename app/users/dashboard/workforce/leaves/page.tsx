/**
 * app/users/dashboard/workforce/leaves/page.tsx
 *
 * Main leave management dashboard with role-based views.
 *
 * Features:
 * - Defaults to Employee Dashboard
 * - Dashboard switcher for users with multiple roles
 * - Stores dashboard preference in localStorage
 */

'use client';

import { useState } from 'react';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { DashboardSkeleton } from '@/components/leave/skeletons';
import { useLeaveRole, LeaveRole } from '@/hooks/leave/use-leave-role';
import { usePendingApprovalsCount } from '@/hooks/leave/use-leave';
import { EmployeeDashboard } from '@/components/leave/dashboard/employee-dashboard';
import { ManagerDashboard } from '@/components/leave/dashboard/manager-dashboard';
import { AdminDashboard } from '@/components/leave/dashboard/admin-dashboard';
import { DashboardSwitcher } from '@/components/leave/dashboard/dashboard-switcher';

const DASHBOARD_PREFERENCE_KEY = 'leave-dashboard-preference';

export default function LeaveDashboardPage() {
  const { data: employee, isLoading: employeeLoading } =
    useCurrentUserEmployee();
  const { availableRoles, isLoading: roleLoading } = useLeaveRole();
  const canApprove =
    availableRoles.includes(LeaveRole.MANAGER) ||
    availableRoles.includes(LeaveRole.ADMIN);
  const { data: pendingCount } = usePendingApprovalsCount(
    canApprove ? employee?.id || 0 : 0
  );

  // State for current dashboard view - initialized from localStorage
  const [currentView, setCurrentView] = useState<LeaveRole>(() => {
    if (globalThis.window === undefined) return LeaveRole.EMPLOYEE;
    const saved = localStorage.getItem(DASHBOARD_PREFERENCE_KEY);
    if (saved && Object.values(LeaveRole).includes(saved as LeaveRole)) {
      return saved as LeaveRole;
    }
    return LeaveRole.EMPLOYEE;
  });

  // Save preference when view changes
  const handleViewChange = (newView: LeaveRole) => {
    setCurrentView(newView);
    localStorage.setItem(DASHBOARD_PREFERENCE_KEY, newView);
  };

  // Show loading state
  if (employeeLoading || roleLoading) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Show error if employee not found
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
    <div className="container mx-auto space-y-6 p-6">
      {/* Dashboard Switcher - Only shown if user has multiple roles */}
      {availableRoles.length > 1 && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Leave Management
            </h1>
            <p className="text-muted-foreground">
              Manage your leave requests and team approvals
            </p>
          </div>
          <DashboardSwitcher
            currentRole={currentView}
            availableRoles={availableRoles}
            onRoleChange={handleViewChange}
            pendingApprovalsCount={pendingCount}
          />
        </div>
      )}

      {/* Render selected dashboard */}
      {currentView === LeaveRole.EMPLOYEE && <EmployeeDashboard />}
      {currentView === LeaveRole.MANAGER && <ManagerDashboard />}
      {currentView === LeaveRole.ADMIN && <AdminDashboard />}
    </div>
  );
}
