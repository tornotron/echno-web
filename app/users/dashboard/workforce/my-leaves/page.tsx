/**
 * app/users/dashboard/workforce/my-leaves/page.tsx
 *
 * The employee-facing entry point for leave.
 *
 * Workforce previously offered a single "Employee Leave" link, and despite the
 * name it opened the organisation-wide analytics page. The self-service surface
 * existed but sat two levels below it, past the sidebar's two-level render
 * ceiling, so an employee had no way to reach their own balance or requests
 * from the navigation.
 *
 * This route is that surface, on its own top-level link. It is deliberately
 * fixed to the employee view: no role switcher, no organisation totals, no
 * approvals queue. Managers and admins keep their own entry alongside it.
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
