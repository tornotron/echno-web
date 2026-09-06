/**
 * app/users/dashboard/attendance/my-leaves/page.tsx
 *
 * The employee-facing entry point for leave.
 *
 * It sits under My Attendance because that is where a site engineer looks for
 * anything about their own time: the days they worked and the days they took
 * off. It used to sit under Workforce, alongside the organisation-wide leave
 * admin, which put a personal request next to the approvals queue.
 *
 * The page is deliberately fixed to the employee view: no role switcher, no
 * organisation totals, no approvals queue. Managers and admins keep their own
 * entry under Workforce.
 */

'use client';

import { OrgGuard, PageHeader } from '@/components/common';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import { EmployeeDashboard } from '@/features/leave/components/dashboard/employee-dashboard';

export default function MyLeavesPage() {
  const { data: employee, isLoading } = useCurrentUserEmployee();

  return (
    <OrgGuard
      isLoading={isLoading}
      error={null}
      organizationId={employee?.organizationId}
    >
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="My Leaves"
          description="Your leave balance, requests and upcoming time off"
        />
        <EmployeeDashboard />
      </div>
    </OrgGuard>
  );
}
